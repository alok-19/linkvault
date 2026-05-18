import { NextResponse } from 'next/server';
import { linkDb } from '@/lib/db';

export async function POST() {
  try {
    const links = linkDb.getAll({ limit: 1000 });
    const results: { id: number; url: string; status: string }[] = [];

    // Check links in batches to avoid overwhelming
    for (const link of links.links) {
      try {
        const response = await fetch(link.url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        const isBroken = response.status >= 400;
        linkDb.updateBrokenStatus(link.id, isBroken);

        results.push({
          id: link.id,
          url: link.url,
          status: isBroken ? 'broken' : 'ok',
        });
      } catch {
        // If fetch fails entirely, mark as broken
        linkDb.updateBrokenStatus(link.id, true);
        results.push({
          id: link.id,
          url: link.url,
          status: 'broken',
        });
      }

      // Small delay between checks
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const brokenCount = results.filter(r => r.status === 'broken').length;

    return NextResponse.json({
      checked: results.length,
      broken: brokenCount,
      results,
    });
  } catch (error) {
    console.error('Error checking links:', error);
    return NextResponse.json({ error: 'Failed to check links' }, { status: 500 });
  }
}
