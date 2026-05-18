import { NextRequest, NextResponse } from 'next/server';
import { fetchThumbnail } from '@/lib/thumbnail';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    const result = await fetchThumbnail(url);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching thumbnail:', error);
    return NextResponse.json({ error: 'Failed to fetch thumbnail' }, { status: 500 });
  }
}
