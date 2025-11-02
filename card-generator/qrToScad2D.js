import fs from 'fs/promises'
import { PNG } from 'pngjs'

/**
 * Convert QR code PNG to OpenSCAD 2D module with squares for each black pixel
 * Used for flat color-based designs (XS-V2) instead of embossed 3D cubes
 * @param {string} qrImagePath - Path to QR code PNG file
 * @returns {string} OpenSCAD module code for 2D pattern
 */
async function qrToScad2DModule(qrImagePath) {
  const data = await fs.readFile(qrImagePath);
  const png = PNG.sync.read(data);

  const width = png.width;
  const height = png.height;
  const threshold = 128; // Brightness threshold for black/white

  // Sample every N pixels to reduce complexity (QR codes have large modules)
  const sampleRate = Math.floor(width / 50); // Target ~50x50 grid

  let scadCode = `// QR Code 2D pattern generated from image (for color-based flat design)\n`;
  scadCode += `module qr_code_pattern_2d(size) {\n`;
  scadCode += `    scale([size/${Math.ceil(width/sampleRate)}, size/${Math.ceil(height/sampleRate)}, 1]) {\n`;

  for (let y = 0; y < height; y += sampleRate) {
    for (let x = 0; x < width; x += sampleRate) {
      const idx = (width * y + x) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const brightness = (r + g + b) / 3;

      // If pixel is black (dark), create a 2D square
      if (brightness < threshold) {
        const gridX = Math.floor(x / sampleRate);
        const gridY = Math.floor(y / sampleRate);
        scadCode += `        translate([${gridX}, ${gridY}, 0]) square([1, 1]);\n`;
      }
    }
  }

  scadCode += `    }\n`;
  scadCode += `}\n`;

  return scadCode;
}

export { qrToScad2DModule }
