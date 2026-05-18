import { NextRequest, NextResponse } from 'next/server';
import { linkDb } from '@/lib/db';
import { parseMetadataOnly } from '@/lib/page-parser';
import { extractDomain } from '@/lib/metadata';
import { fetchThumbnail } from '@/lib/thumbnail';
import { normalizeUrl } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const format = formData.get('format') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const content = await file.text();
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    if (format === 'json' || file.name.endsWith('.json')) {
      // LinkVault JSON format
      const data = JSON.parse(content);
      const links = data.links || data;

      for (const item of links) {
        try {
          const url = normalizeUrl(item.url);
          const existing = linkDb.getByUrl(url);
          if (existing) {
            skipped++;
            continue;
          }

          const domain = extractDomain(url);
          const title = item.title || '';
          const description = item.description || '';
          const category = item.category || 'uncategorized';
          const tags = Array.isArray(item.tags) ? item.tags : [];

          linkDb.create({
            url,
            title,
            description,
            category,
            tags,
            domain,
          });

          imported++;
        } catch (err: any) {
          errors.push(`Failed to import ${item.url}: ${err.message}`);
        }
      }
    } else if (format === 'html' || file.name.endsWith('.html')) {
      // Netscape Bookmark File format
      const urlMatches = content.match(/<A[^>]+HREF="([^"]+)"[^>]*>([^<]*)<\/A>/gi) || [];

      for (const match of urlMatches) {
        try {
          const hrefMatch = match.match(/HREF="([^"]+)"/i);
          const textMatch = match.match(/>([^<]*)<\/A>/i);
          const tagsMatch = match.match(/TAGS="([^"]+)"/i);

          const url = hrefMatch ? normalizeUrl(hrefMatch[1]) : null;
          const title = textMatch ? textMatch[1].trim() : '';
          const tags = tagsMatch ? tagsMatch[1].split(',').map((t: string) => t.trim()).filter(Boolean) : [];

          if (!url) continue;

          const existing = linkDb.getByUrl(url);
          if (existing) {
            skipped++;
            continue;
          }

          let finalTitle = title;
          let finalDescription = '';
          let faviconUrl: string | null = null;
          let ogImage: string | null = null;

          if (!finalTitle) {
            const parsed = await parseMetadataOnly(url);
            finalTitle = parsed.title || extractDomain(url);
            finalDescription = parsed.description;
            faviconUrl = parsed.favicon;
            ogImage = parsed.ogImage;
          }

          const domain = extractDomain(url);

          let thumbnail_url: string | null = null;
          let thumbnail_type: 'og' | 'fallback' = 'fallback';

          if (ogImage) {
            thumbnail_url = ogImage;
            thumbnail_type = 'og';
          } else {
            const thumb = await fetchThumbnail(url);
            thumbnail_url = thumb.thumbnail_url;
            thumbnail_type = thumb.thumbnail_type;
          }

          linkDb.create({
            url,
            title: finalTitle,
            description: finalDescription,
            category: 'uncategorized',
            tags,
            thumbnail_url: thumbnail_url || undefined,
            thumbnail_type,
            favicon_url: faviconUrl || undefined,
            domain,
          });

          imported++;
        } catch (err: any) {
          errors.push(`Failed to import bookmark: ${err.message}`);
        }
      }
    } else {
      return NextResponse.json({ error: 'Unsupported file format. Use .json or .html' }, { status: 400 });
    }

    return NextResponse.json({
      imported,
      skipped,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    console.error('Error importing links:', error);
    return NextResponse.json({ error: 'Failed to import links' }, { status: 500 });
  }
}
