const fs = require('fs').promises;
const { PNG } = require('pngjs');

/**
 * Convert QR code PNG to OpenSCAD module with individual cubes for each black pixel
 * @param {string} qrImagePath - Path to QR code PNG file
 * @returns {string} OpenSCAD module code
 */
async function qrToScadModule(qrImagePath) {
  const data = await fs.readFile(qrImagePath);
  const png = PNG.sync.read(data);

  const width = png.width;
  const height = png.height;
  const threshold = 128; // Brightness threshold for black/white

  // Sample every N pixels to reduce complexity (QR codes have large modules)
  const sampleRate = Math.floor(width / 50); // Target ~50x50 grid

  let scadCode = `// QR Code pattern generated from image\n`;
  scadCode += `module qr_code_pattern(size, depth) {\n`;
  scadCode += `    scale([size/${Math.ceil(width/sampleRate)}, size/${Math.ceil(height/sampleRate)}, 1]) {\n`;

  for (let y = 0; y < height; y += sampleRate) {
    for (let x = 0; x < width; x += sampleRate) {
      const idx = (width * y + x) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const brightness = (r + g + b) / 3;

      // If pixel is black (dark), create a cube
      if (brightness < threshold) {
        const gridX = Math.floor(x / sampleRate);
        const gridY = Math.floor(y / sampleRate);
        scadCode += `        translate([${gridX}, ${gridY}, 0]) cube([1, 1, depth]);\n`;
      }
    }
  }

  scadCode += `    }\n`;
  scadCode += `}\n`;

  return scadCode;
}

module.exports = { qrToScadModule };
