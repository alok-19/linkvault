import { NextRequest, NextResponse } from 'next/server';
import { linkDb } from '@/lib/db';
import { apiCache } from '@/lib/cache';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const link = linkDb.getById(parseInt(id));

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    const updated = linkDb.incrementClick(parseInt(id));
    apiCache.invalidate('links:');
    apiCache.invalidate('stats');
    return NextResponse.json({ click_count: updated?.click_count });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 });
  }
}
