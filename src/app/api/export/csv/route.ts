import { NextResponse } from 'next/server';
import { linkDb } from '@/lib/db';

export async function GET() {
  try {
    const result = linkDb.getAll({ limit: 10000 });

    const headers = ['id', 'url', 'title', 'description', 'category', 'tags', 'domain', 'click_count', 'created_at'];
    const rows = result.links.map(link => [
      link.id,
      link.url,
      `"${(link.title || '').replace(/"/g, '""')}"`,
      `"${(link.description || '').replace(/"/g, '""')}"`,
      link.category,
      `"${Array.isArray(link.tags) ? link.tags.join(', ') : link.tags}"`,
      link.domain,
      link.click_count,
      link.created_at,
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="linkvault-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 });
  }
}
