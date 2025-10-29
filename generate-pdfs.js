#!/usr/bin/env node

/**
 * Generate printable PDF files from card images
 * Creates 4 variants: normal, black-white, duplex, black-white-duplex
 */

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Card dimensions (ISO/IEC 7810 - credit card size)
const CARD_WIDTH_MM = 85.6;
const CARD_HEIGHT_MM = 53.98;
const MM_TO_PT = 2.83465; // Convert mm to PostScript points

const CARD_WIDTH = CARD_WIDTH_MM * MM_TO_PT;
const CARD_HEIGHT = CARD_HEIGHT_MM * MM_TO_PT;

// Page settings (A4 landscape for optimal card layout)
const PAGE_WIDTH = 842; // A4 landscape width in points
const PAGE_HEIGHT = 595; // A4 landscape height in points

// Margins and spacing
const MARGIN = 20;
const SPACING = 10;

// Calculate cards per page (3x3 grid fits well on A4 landscape)
const CARDS_PER_ROW = 3;
const CARDS_PER_COL = 2;
const CARDS_PER_PAGE = CARDS_PER_ROW * CARDS_PER_COL;

/**
 * Get all card images sorted by ID
 */
function getCardImages() {
  const docsDir = path.join(__dirname, 'docs');
  const files = fs.readdirSync(docsDir)
    .filter(f => f.startsWith('song_') && f.endsWith('.png'))
    .sort((a, b) => {
      const idA = parseInt(a.match(/song_(\d+)/)[1]);
      const idB = parseInt(b.match(/song_(\d+)/)[1]);
      return idA - idB;
    });

  return files.map(f => path.join(docsDir, f));
}

/**
 * Convert image to grayscale
 */
function convertToGrayscale(imagePath, outputPath) {
  const { exec } = require('child_process');
  return new Promise((resolve, reject) => {
    // Use ImageMagick convert command
    exec(`convert "${imagePath}" -colorspace Gray "${outputPath}"`, (error) => {
      if (error) {
        console.warn(`⚠️  Could not convert to grayscale: ${path.basename(imagePath)}`);
        // Fallback: use original image
        fs.copyFileSync(imagePath, outputPath);
      }
      resolve(outputPath);
    });
  });
}

/**
 * Generate PDF with cards
 */
async function generatePDF(outputPath, images, options = {}) {
  const { blackWhite = false, duplex = false } = options;

  console.log(`📄 Generating ${path.basename(outputPath)}...`);

  const doc = new PDFDocument({
    size: [PAGE_WIDTH, PAGE_HEIGHT],
    margin: MARGIN,
    autoFirstPage: false
  });

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  const tempDir = path.join(__dirname, '.temp-pdf');
  if (blackWhite && !fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Process images
  const processedImages = [];
  if (blackWhite) {
    console.log('   Converting to grayscale...');
    for (const img of images) {
      const tempPath = path.join(tempDir, path.basename(img));
      await convertToGrayscale(img, tempPath);
      processedImages.push(tempPath);
    }
  } else {
    processedImages.push(...images);
  }

  // Calculate card positions
  const availableWidth = PAGE_WIDTH - (2 * MARGIN);
  const availableHeight = PAGE_HEIGHT - (2 * MARGIN);

  const totalSpacingX = (CARDS_PER_ROW - 1) * SPACING;
  const totalSpacingY = (CARDS_PER_COL - 1) * SPACING;

  const cardWidth = (availableWidth - totalSpacingX) / CARDS_PER_ROW;
  const cardHeight = (availableHeight - totalSpacingY) / CARDS_PER_COL;

  // Generate pages
  let pageNum = 0;
  for (let i = 0; i < processedImages.length; i += CARDS_PER_PAGE) {
    pageNum++;

    // Front side
    doc.addPage();

    // Add page number and instructions
    doc.fontSize(8)
       .fillColor('#666666')
       .text(`Seite ${pageNum}/${Math.ceil(processedImages.length / CARDS_PER_PAGE)}`, MARGIN, 10);

    const pageCards = processedImages.slice(i, i + CARDS_PER_PAGE);

    pageCards.forEach((img, idx) => {
      const row = Math.floor(idx / CARDS_PER_ROW);
      const col = idx % CARDS_PER_ROW;

      const x = MARGIN + (col * (cardWidth + SPACING));
      const y = MARGIN + 20 + (row * (cardHeight + SPACING));

      try {
        doc.image(img, x, y, {
          width: cardWidth,
          height: cardHeight,
          fit: [cardWidth, cardHeight],
          align: 'center',
          valign: 'center'
        });

        // Draw cut line
        doc.strokeColor('#cccccc')
           .lineWidth(0.5)
           .rect(x, y, cardWidth, cardHeight)
           .stroke();
      } catch (error) {
        console.error(`❌ Error adding image ${path.basename(img)}:`, error.message);
      }
    });

    // Back side for duplex printing
    if (duplex && pageCards.length > 0) {
      doc.addPage();
      doc.fontSize(8)
         .fillColor('#666666')
         .text(`Seite ${pageNum} - Rückseite (Duplex)`, MARGIN, 10);

      // Add mxster logo/watermark on back
      doc.fontSize(48)
         .fillColor('#eeeeee')
         .text('mxster', PAGE_WIDTH / 2, PAGE_HEIGHT / 2, {
           width: PAGE_WIDTH,
           align: 'center'
         });
    }
  }

  doc.end();

  return new Promise((resolve) => {
    stream.on('finish', () => {
      console.log(`   ✅ ${path.basename(outputPath)} created`);

      // Cleanup temp files
      if (blackWhite && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }

      resolve(outputPath);
    });
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('🎵 mxster Card PDF Generator\n');

  const images = getCardImages();
  console.log(`📸 Found ${images.length} card images\n`);

  const outputDir = __dirname;

  // Generate all 4 variants
  await generatePDF(
    path.join(outputDir, 'mxster-cards.pdf'),
    images,
    { blackWhite: false, duplex: false }
  );

  await generatePDF(
    path.join(outputDir, 'mxster-cards-bw.pdf'),
    images,
    { blackWhite: true, duplex: false }
  );

  await generatePDF(
    path.join(outputDir, 'mxster-cards-duplex.pdf'),
    images,
    { blackWhite: false, duplex: true }
  );

  await generatePDF(
    path.join(outputDir, 'mxster-cards-bw-duplex.pdf'),
    images,
    { blackWhite: true, duplex: true }
  );

  console.log('\n✨ All PDF files generated successfully!');
  console.log('\n📦 Files created:');
  console.log('   - mxster-cards.pdf (Color, Single-sided)');
  console.log('   - mxster-cards-bw.pdf (Black & White, Single-sided)');
  console.log('   - mxster-cards-duplex.pdf (Color, Double-sided)');
  console.log('   - mxster-cards-bw-duplex.pdf (Black & White, Double-sided)');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
