import { NextRequest, NextResponse } from 'next/server';
import { linkDb } from '@/lib/db';
import { apiCache } from '@/lib/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const link = linkDb.getById(parseInt(id));

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    return NextResponse.json({ link });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch link' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const link = linkDb.getById(parseInt(id));
    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    const updated = linkDb.update(parseInt(id), body);
    apiCache.invalidate('links:');
    apiCache.invalidate('stats');
    return NextResponse.json({ link: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update link' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const link = linkDb.getById(parseInt(id));

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    linkDb.delete(parseInt(id));
    apiCache.invalidate('links:');
    apiCache.invalidate('stats');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 });
  }
}
