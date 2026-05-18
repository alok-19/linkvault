import { NextRequest, NextResponse } from 'next/server';
import { linkDb } from '@/lib/db';
import { CATEGORIES } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category: categoryParam } = await params;
    const category = decodeURIComponent(categoryParam);
    const validCategory = CATEGORIES.find(c => c.name === category);

    if (!validCategory) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const result = linkDb.getAll({
      category,
      limit: 100,
      sort: 'newest',
    });

    // Generate simple SVG social card
    const count = result.total;
    const svg = generateSocialCard(validCategory.label, validCategory.color, count);

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error generating social card:', error);
    return NextResponse.json({ error: 'Failed to generate card' }, { status: 500 });
  }
}

function generateSocialCard(label: string, color: string, count: number): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a1a2e;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#grad)" />
  <rect x="50" y="50" width="1100" height="530" rx="20" fill="rgba(255,255,255,0.1)" />
  <text x="600" y="280" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="bold" fill="white">${label}</text>
  <text x="600" y="360" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="36" fill="rgba(255,255,255,0.8)">Collection</text>
  <text x="600" y="440" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="600" fill="white">${count} links</text>
  <text x="600" y="540" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="rgba(255,255,255,0.6)">LinkVault — Visual Link Dashboard</text>
</svg>`;
}
