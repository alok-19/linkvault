import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

const MAX_HTML_SIZE = 50_000;
const FETCH_TIMEOUT = 8000;

const NON_ARTICLE_DOMAINS = new Set([
  'youtube.com', 'youtu.be', 'vimeo.com', 'twitch.tv',
  'github.com', 'gitlab.com', 'bitbucket.org',
  'twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'tiktok.com',
  'linkedin.com', 'reddit.com',
  'amazon.com', 'ebay.com', 'etsy.com',
  'spotify.com', 'soundcloud.com',
  'maps.google.com', 'google.com/maps',
  'stackoverflow.com',
  'npmjs.com',
  'docs.google.com',
  'drive.google.com',
  'calendar.google.com',
]);

export interface ParsedPage {
  html: string;
  title: string;
  description: string;
  ogImage: string | null;
  favicon: string | null;
  content: string;
  textContent: string;
  excerpt: string;
  readingTime: number;
  isArticle: boolean;
}

export interface MetadataOnly {
  title: string;
  description: string;
  ogImage: string | null;
  favicon: string | null;
  html: string;
}

export function isLikelyArticle(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    if (NON_ARTICLE_DOMAINS.has(domain)) return false;
    for (const nonArticle of NON_ARTICLE_DOMAINS) {
      if (domain.endsWith('.' + nonArticle)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });

    if (!response.ok) {
      // 403, 404, etc. — site blocks bots. Return null gracefully.
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return await response.text();
    }

    const chunks: Uint8Array[] = [];
    let totalSize = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalSize += value.length;
      if (totalSize >= MAX_HTML_SIZE) {
        break;
      }
    }

    const combined = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    const decoder = new TextDecoder();
    return decoder.decode(combined);
  } catch {
    // Timeout, DNS error, network failure, etc.
    return null;
  }
}

function extractMetadata(html: string, url: string): {
  title: string;
  description: string;
  ogImage: string | null;
  favicon: string | null;
} {
  const title = decodeHtml(extractTag(html, 'title') || extractMeta(html, 'og:title') || '');
  const description = decodeHtml(extractMeta(html, 'description') || extractMeta(html, 'og:description') || '');
  const ogImage = extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image') || null;
  const favicon = extractFavicon(html, url) || extractFaviconFromLink(html, url);

  return { title, description, ogImage, favicon };
}

function extractContent(html: string, url: string): {
  content: string;
  textContent: string;
  excerpt: string;
  readingTime: number;
} {
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      return { content: '', textContent: '', excerpt: '', readingTime: 0 };
    }

    const textContent = article.textContent || '';
    const wordCount = textContent.trim().split(/\s+/).filter(w => w.length > 0).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    return {
      content: article.content || '',
      textContent,
      excerpt: article.excerpt || '',
      readingTime,
    };
  } catch {
    return { content: '', textContent: '', excerpt: '', readingTime: 0 };
  }
}

export async function parsePage(url: string, extractContentFlag = true): Promise<ParsedPage> {
  const html = await fetchHtml(url);

  if (!html) {
    // Site blocked us or fetch failed — return empty metadata, still save the link
    return {
      html: '',
      title: '',
      description: '',
      ogImage: null,
      favicon: null,
      content: '',
      textContent: '',
      excerpt: '',
      readingTime: 0,
      isArticle: false,
    };
  }

  const metadata = extractMetadata(html, url);

  let contentResult = { content: '', textContent: '', excerpt: '', readingTime: 0 };
  if (extractContentFlag && isLikelyArticle(url)) {
    contentResult = extractContent(html, url);
  }

  return {
    html,
    title: metadata.title,
    description: metadata.description,
    ogImage: metadata.ogImage,
    favicon: metadata.favicon,
    ...contentResult,
    isArticle: !!contentResult.textContent,
  };
}

export async function parseMetadataOnly(url: string): Promise<MetadataOnly> {
  const html = await fetchHtml(url);

  if (!html) {
    return { html: '', title: '', description: '', ogImage: null, favicon: null };
  }

  const metadata = extractMetadata(html, url);
  return { html, ...metadata };
}

export function extractContentFromHtml(html: string, url: string) {
  return extractContent(html, url);
}

function decodeHtml(str: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&ndash;': '–',
    '&mdash;': '—',
    '&hellip;': '…',
  };
  let result = str;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'g'), char);
  }
  return result;
}

function extractTag(html: string, tag: string): string | null {
  const match = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i'));
  return match ? match[1].trim() : null;
}

function extractMeta(html: string, name: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractFavicon(html: string, baseUrl: string): string | null {
  const match = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i);
  if (!match) return null;

  let href = match[1];
  if (href.startsWith('//')) {
    href = 'https:' + href;
  } else if (href.startsWith('/')) {
    const urlObj = new URL(baseUrl);
    href = `${urlObj.origin}${href}`;
  } else if (!href.startsWith('http')) {
    href = `${baseUrl}/${href}`;
  }
  return href;
}

function extractFaviconFromLink(html: string, baseUrl: string): string | null {
  const match = html.match(/<link[^>]+rel=["']icon["'][^>]+href=["']([^"']+)["']/i);
  if (!match) return null;

  let href = match[1];
  if (href.startsWith('//')) {
    href = 'https:' + href;
  } else if (href.startsWith('/')) {
    const urlObj = new URL(baseUrl);
    href = `${urlObj.origin}${href}`;
  }
  return href;
}
