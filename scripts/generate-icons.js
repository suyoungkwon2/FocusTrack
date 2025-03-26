const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 48, 128];
const sourceFile = path.join(__dirname, '../src/icons/icon.svg');
const outputDir = path.join(__dirname, '../src/icons');

async function generateIcons() {
  for (const size of sizes) {
    await sharp(sourceFile)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon${size}.png`));
    console.log(`Generated ${size}x${size} icon`);
  }
}

generateIcons().catch(console.error); 