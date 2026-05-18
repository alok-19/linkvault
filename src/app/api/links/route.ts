import { NextRequest, NextResponse } from 'next/server';
import { linkDb } from '@/lib/db';
import { extractDomain } from '@/lib/metadata';
import { fetchThumbnail } from '@/lib/thumbnail';
import { parsePage } from '@/lib/page-parser';
import { autoCategorize, suggestTags } from '@/lib/auto-categorize';
import { normalizeUrl } from '@/lib/utils';
import { apiCache } from '@/lib/cache';

function cacheJson(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'private, max-age=3, stale-while-revalidate=60',
    },
  });
}

function noCacheJson(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

// Background metadata enrichment — fire-and-forget after returning response.
// In Node.js runtime, unawaited promises continue on the event loop.
async function backgroundEnrich(id: number, url: string) {
  try {
    const parsed = await parsePage(url, false);
    if (!parsed.title && !parsed.description && !parsed.ogImage && !parsed.favicon) return;

    const updates: Record<string, unknown> = {};
    if (parsed.title) updates.title = parsed.title;
    if (parsed.description) updates.description = parsed.description;
    if (parsed.favicon) updates.favicon_url = parsed.favicon;
    if (parsed.ogImage) {
      updates.thumbnail_url = parsed.ogImage;
      updates.thumbnail_type = 'og';
    }

    const current = linkDb.getById(id);
    if (current) {
      if (current.category === 'uncategorized') {
        const suggestion = autoCategorize(url, parsed.title || current.title, parsed.description || current.description);
        if (suggestion.confidence >= 0.6) {
          updates.category = suggestion.category;
        }
      }
      if (!current.tags || current.tags.length === 0) {
        updates.tags = suggestTags(url, parsed.title || current.title, parsed.description || current.description);
      }
    }

    if (Object.keys(updates).length > 0) {
      linkDb.update(id, updates);
      apiCache.invalidate('links:');
    }
  } catch (err) {
    console.error('Background enrichment failed for link', id, err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const status = searchParams.get('status') || undefined;
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const cacheKey = `links:${search ?? 'all'}:${category ?? 'all'}:${tag ?? 'all'}:${status ?? 'all'}:${sort}:${page}:${limit}`;
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return cacheJson(cached);
    }

    const result = linkDb.getAll({ search, category, tag, status, sort, page, limit });
    apiCache.set(cacheKey, result);

    return cacheJson(result);
  } catch (error) {
    console.error('Error fetching links:', error);
    return cacheJson({ error: 'Failed to fetch links' }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, title, description, category, tags: bodyTags, ogImage: bodyOgImage, favicon: bodyFavicon } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const normalizedUrl = normalizeUrl(url);

    const existing = linkDb.getByUrl(normalizedUrl);
    if (existing) {
      return NextResponse.json({ link: existing, alreadyExists: true });
    }

    const domain = extractDomain(normalizedUrl);

    // Use whatever metadata the client provided, or minimal defaults.
    // The UI (and extension) should pre-fetch metadata. If they don't,
    // we create the link instantly and enrich in the background.
    let finalTitle = title || domain;
    let finalDescription = description || '';
    let faviconUrl: string | null = bodyFavicon || null;
    let ogImage: string | null = bodyOgImage || null;

    // Auto-categorize if no category provided
    let finalCategory = category || 'uncategorized';
    let finalTags = bodyTags || [];

    if (!category || category === 'uncategorized') {
      const suggestion = autoCategorize(normalizedUrl, finalTitle, finalDescription);
      if (suggestion.confidence >= 0.6) {
        finalCategory = suggestion.category;
      }
    }

    // Auto-suggest tags if none provided
    if (finalTags.length === 0) {
      finalTags = suggestTags(normalizedUrl, finalTitle, finalDescription);
    }

    let thumbnail_url: string | null = null;
    let thumbnail_type: 'og' | 'fallback' = 'fallback';

    if (ogImage) {
      thumbnail_url = ogImage;
      thumbnail_type = 'og';
    } else {
      const thumb = await fetchThumbnail(normalizedUrl);
      thumbnail_url = thumb.thumbnail_url;
      thumbnail_type = thumb.thumbnail_type;
    }

    const link = linkDb.create({
      url: normalizedUrl,
      title: finalTitle,
      description: finalDescription,
      category: finalCategory,
      tags: finalTags,
      thumbnail_url: thumbnail_url || undefined,
      thumbnail_type: thumbnail_type,
      favicon_url: faviconUrl || undefined,
      domain,
      content: '',
      reading_time: 0,
    });

    // If client didn't provide rich metadata, enrich in background
    const hasRichMetadata = !!(title && description);
    if (!hasRichMetadata) {
      backgroundEnrich(link.id, normalizedUrl);
    }

    apiCache.invalidate('links:');

    return noCacheJson({ link }, 201);
  } catch (error) {
    console.error('Error creating link:', error);
    return noCacheJson({ error: 'Failed to create link' }, 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, status } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }

    if (!status || !['unread', 'reading', 'archived'].includes(status)) {
      return NextResponse.json({ error: 'Valid status is required (unread, reading, archived)' }, { status: 400 });
    }

    const result = linkDb.updateStatus(ids, status);
    apiCache.invalidate('links:');

    return noCacheJson(result);
  } catch (error) {
    console.error('Error updating links:', error);
    return noCacheJson({ error: 'Failed to update links' }, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }

    const result = linkDb.deleteMany(ids);
    apiCache.invalidate('links:');

    return noCacheJson(result);
  } catch (error) {
    console.error('Error deleting links:', error);
    return noCacheJson({ error: 'Failed to delete links' }, 500);
  }
}
