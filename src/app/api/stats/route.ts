import { NextResponse } from 'next/server';
import { linkDb } from '@/lib/db';
import { apiCache } from '@/lib/cache';

function cacheJson(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'private, max-age=3, stale-while-revalidate=60',
    },
  });
}

export async function GET() {
  try {
    const cached = apiCache.get('stats');
    if (cached) {
      return cacheJson(cached);
    }

    const stats = linkDb.getStats();
    const status_counts = linkDb.getStatusCounts();
    const result = { ...stats, status_counts };
    apiCache.set('stats', result);

    return cacheJson(result);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return cacheJson({ error: 'Failed to fetch stats' }, 500);
  }
}
