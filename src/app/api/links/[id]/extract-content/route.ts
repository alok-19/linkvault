import { NextRequest, NextResponse } from 'next/server';
import { linkDb } from '@/lib/db';
import { parsePage } from '@/lib/page-parser';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const linkId = parseInt(id, 10);

    if (isNaN(linkId)) {
      return NextResponse.json({ error: 'Invalid link ID' }, { status: 400 });
    }

    const link = linkDb.getById(linkId);
    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    if (link.content && link.content.length > 0) {
      return NextResponse.json({ link, alreadyExtracted: true });
    }

    const parsed = await parsePage(link.url, true);

    const updated = linkDb.update(linkId, {
      title: parsed.title || link.title,
      description: parsed.excerpt || link.description,
      content: parsed.textContent.slice(0, 50000),
      reading_time: parsed.readingTime,
    });

    return NextResponse.json({ link: updated, extracted: true });
  } catch (error) {
    console.error('Error extracting content:', error);
    return NextResponse.json({ error: 'Failed to extract content' }, { status: 500 });
  }
}
