const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'public', 'icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

const sizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

async function generate() {
  for (const { size, name } of sizes) {
    const outputPath = path.join(__dirname, '..', 'public', name);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated ${name} (${size}x${size})`);
  }
}

generate().catch(err => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
