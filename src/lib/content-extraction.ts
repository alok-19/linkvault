import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export interface ExtractedContent {
  title: string;
  content: string;
  textContent: string;
  length: number;
  excerpt: string;
  byline: string;
  dir: string;
  siteName: string;
  readingTime: number;
}

export async function extractArticleContent(url: string, html?: string): Promise<ExtractedContent | null> {
  try {
    let htmlContent = html;

    if (!htmlContent) {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        return null;
      }

      htmlContent = await response.text();
    }

    const dom = new JSDOM(htmlContent, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      return null;
    }

    // Calculate reading time (average 200 WPM)
    const textContent = article.textContent || '';
    const wordCount = textContent.trim().split(/\s+/).filter(w => w.length > 0).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    return {
      title: article.title || '',
      content: article.content || '',
      textContent: textContent,
      length: article.length || 0,
      excerpt: article.excerpt || '',
      byline: article.byline || '',
      dir: article.dir || '',
      siteName: article.siteName || '',
      readingTime,
    };
  } catch (error) {
    console.error('Content extraction failed for', url, error);
    return null;
  }
}
