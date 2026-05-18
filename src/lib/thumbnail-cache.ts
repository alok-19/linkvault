import fs from 'fs';
import path from 'path';

const THUMBS_DIR = path.join(process.cwd(), 'public', 'thumbs');

// Ensure thumbs directory exists
if (!fs.existsSync(THUMBS_DIR)) {
  fs.mkdirSync(THUMBS_DIR, { recursive: true });
}

export function getThumbPath(url: string): string {
  const hash = Buffer.from(url).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
  return path.join(THUMBS_DIR, `${hash}.jpg`);
}

export function getThumbPublicPath(url: string): string {
  const hash = Buffer.from(url).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
  return `/thumbs/${hash}.jpg`;
}

export async function downloadThumbnail(imageUrl: string, linkUrl: string): Promise<string | null> {
  if (!imageUrl || imageUrl.startsWith('data:')) {
    return null;
  }

  const thumbPath = getThumbPath(linkUrl);
  const publicPath = getThumbPublicPath(linkUrl);

  // Already cached
  if (fs.existsSync(thumbPath)) {
    return publicPath;
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Only cache if reasonable size (< 2MB)
    if (buffer.length > 2 * 1024 * 1024) {
      return null;
    }

    fs.writeFileSync(thumbPath, buffer);
    return publicPath;
  } catch (error) {
    console.error('Failed to download thumbnail:', error);
    return null;
  }
}

export function getLocalThumbnail(linkUrl: string): string | null {
  const thumbPath = getThumbPath(linkUrl);
  if (fs.existsSync(thumbPath)) {
    return getThumbPublicPath(linkUrl);
  }
  return null;
}
