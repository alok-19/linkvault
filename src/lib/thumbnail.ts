import fs from 'fs';
import path from 'path';

const THUMBS_DIR = path.join(process.cwd(), 'public', 'thumbs');

if (!fs.existsSync(THUMBS_DIR)) {
  fs.mkdirSync(THUMBS_DIR, { recursive: true });
}

export async function fetchThumbnail(url: string): Promise<{
  thumbnail_url: string | null;
  thumbnail_type: 'og' | 'fallback';
}> {
  const fallback = await generateFallback(url);
  return { thumbnail_url: fallback, thumbnail_type: 'fallback' };
}

export async function generateFallback(url: string): Promise<string> {
  const domain = extractDomain(url);
  const initials = domain.split('.')[0].slice(0, 2).toUpperCase();

  const hash = hashCode(domain);
  const hue1 = hash % 360;
  const hue2 = (hash + 40) % 360;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue1}, 65%, 55%)" />
          <stop offset="100%" style="stop-color:hsl(${hue2}, 65%, 45%)" />
        </linearGradient>
      </defs>
      <rect width="400" height="225" fill="url(#g)" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
            font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="700"
            fill="white" opacity="0.85" letter-spacing="2">
        ${initials}
      </text>
    </svg>
  `.trim();

  const filename = `fallback-${Buffer.from(domain).toString('base64url').slice(0, 30)}.svg`;
  const filePath = path.join(THUMBS_DIR, filename);

  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
  } catch {
    await fs.promises.writeFile(filePath, svg);
  }

  return `/thumbs/${filename}`;
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
