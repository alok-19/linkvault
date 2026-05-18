import { NextRequest, NextResponse } from 'next/server';
import { parsePage } from '@/lib/page-parser';
import { extractDomain } from '@/lib/metadata';
import { autoCategorize, suggestTags } from '@/lib/auto-categorize';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let targetUrl = url;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    const parsed = await parsePage(targetUrl, false);
    const domain = extractDomain(targetUrl);

    const title = parsed.title || domain;
    const description = parsed.description || '';

    const categorySuggestion = autoCategorize(targetUrl, title, description);
    const suggestedTags = suggestTags(targetUrl, title, description);

    return NextResponse.json({
      url: targetUrl,
      title,
      description,
      favicon: parsed.favicon,
      ogImage: parsed.ogImage,
      domain,
      category: categorySuggestion.confidence >= 0.6 ? categorySuggestion.category : 'uncategorized',
      categoryConfidence: categorySuggestion.confidence,
      suggestedTags,
    });
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return NextResponse.json({ error: 'Failed to extract metadata' }, { status: 500 });
  }
}
