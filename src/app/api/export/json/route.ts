import { NextResponse } from 'next/server';
import { linkDb } from '@/lib/db';

export async function GET() {
  try {
    const result = linkDb.getAll({ limit: 10000 });
    const links = result.links.map(link => ({
      ...link,
      tags: typeof link.tags === 'string' ? JSON.parse(link.tags) : link.tags,
    }));

    return NextResponse.json({
      export_date: new Date().toISOString(),
      version: '1.0',
      total: links.length,
      links,
    });
  } catch (error) {
    console.error('Error exporting links:', error);
    return NextResponse.json({ error: 'Failed to export links' }, { status: 500 });
  }
}
