import { describe, it, expect } from 'vitest';
import { cn, formatTimeAgo, isValidUrl, normalizeUrl, decodeHtmlEntities } from './utils';

describe('cn', () => {
  it('merges tailwind classes correctly', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', true && 'block')).toBe('base block');
  });
});

describe('formatTimeAgo', () => {
  it('returns "just now" for recent dates', () => {
    // formatTimeAgo expects SQLite datetime format (no Z suffix)
    const now = new Date().toISOString().replace('Z', '').replace('T', ' ');
    expect(formatTimeAgo(now)).toBe('just now');
  });

  it('returns minutes ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      .toISOString()
      .replace('Z', '')
      .replace('T', ' ');
    expect(formatTimeAgo(fiveMinutesAgo)).toBe('5m ago');
  });
});

describe('isValidUrl', () => {
  it('returns true for valid URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://localhost:3000')).toBe(true);
  });

  it('returns false for invalid URLs', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
    expect(isValidUrl('')).toBe(false);
  });
});

describe('normalizeUrl', () => {
  it('strips query params and hash', () => {
    expect(normalizeUrl('https://example.com?foo=bar#section')).toBe('https://example.com/');
  });

  it('returns original on invalid URL', () => {
    expect(normalizeUrl('not-a-url')).toBe('not-a-url');
  });
});

describe('decodeHtmlEntities', () => {
  it('decodes common entities', () => {
    expect(decodeHtmlEntities('&amp;')).toBe('&');
    expect(decodeHtmlEntities('&lt;')).toBe('<');
    expect(decodeHtmlEntities('&quot;')).toBe('"');
  });

  it('decodes multiple entities', () => {
    expect(decodeHtmlEntities('&amp; &lt; &gt;')).toBe('& < >');
  });
});
