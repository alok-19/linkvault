import { NextRequest, NextResponse } from 'next/server';
import { linkDb } from '@/lib/db';
import { CATEGORIES } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category: categoryParam } = await params;
    const category = decodeURIComponent(categoryParam);
    const validCategory = CATEGORIES.find(c => c.name === category);

    if (!validCategory) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const result = linkDb.getAll({
      category,
      limit: 100,
      sort: 'newest',
    });

    const links = result.links.map(link => ({
      id: link.id,
      url: link.url,
      title: link.title,
      description: link.description,
      thumbnail_url: link.thumbnail_url,
      thumbnail_type: link.thumbnail_type,
      favicon_url: link.favicon_url,
      domain: link.domain,
      tags: Array.isArray(link.tags) ? link.tags : JSON.parse(link.tags as string || '[]'),
      click_count: link.click_count,
      created_at: link.created_at,
    }));

    return NextResponse.json({
      collection: {
        name: validCategory.name,
        label: validCategory.label,
        color: validCategory.color,
        count: result.total,
        og_image: `/api/collections/${encodeURIComponent(category)}/og`,
      },
      links,
    });
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 });
  }
}
