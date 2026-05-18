import { NextResponse } from 'next/server';
import { linkDb } from '@/lib/db';

export async function GET() {
  try {
    const result = linkDb.getAll({ limit: 10000 });

    const bookmarks = result.links.map(link => {
      const tags = Array.isArray(link.tags) ? link.tags : [];
      const tagsAttr = tags.length > 0 ? ` TAGS="${tags.join(',')}"` : '';
      const addDate = link.created_at
        ? Math.floor(new Date(link.created_at).getTime() / 1000)
        : Math.floor(Date.now() / 1000);

      return `    <DT><A HREF="${link.url}" ADD_DATE="${addDate}"${tagsAttr}>${link.title || link.url}</A>`;
    }).join('\n');

    const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>LinkVault Bookmarks</TITLE>
<H1>LinkVault Bookmarks</H1>
<DL><p>
${bookmarks}
</DL><p>
`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="linkvault-bookmarks-${new Date().toISOString().split('T')[0]}.html"`,
      },
    });
  } catch (error) {
    console.error('Error exporting HTML:', error);
    return NextResponse.json({ error: 'Failed to export HTML' }, { status: 500 });
  }
}
