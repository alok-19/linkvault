const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const svgPath = path.join(__dirname, 'icon-master.svg');
  const iconsDir = path.join(__dirname, 'icons');

  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const svgBuffer = fs.readFileSync(svgPath);
  const sizes = [16, 48, 128];

  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size, { kernel: sharp.kernel.lanczos3 })
      .png({ compressionLevel: 9, palette: true })
      .toFile(path.join(iconsDir, `${size}.png`));
    console.log(`Generated ${size}.png`);
  }

  console.log('All icons generated successfully.');
}

generateIcons().catch(err => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
