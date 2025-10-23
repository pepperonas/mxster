import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import { songs } from './src/data/songs.js';

// Configuration: Set to true for black & white printing (no backgrounds)
const BLACK_AND_WHITE = process.argv.includes('--bw') || process.argv.includes('--black-white');
// Configuration: Set to true for duplex printing (fronts and backs on separate pages)
const DUPLEX_MODE = process.argv.includes('--duplex');

/**
 * Entfernt typische Track-Suffixe wie "12 Extended Remix", "Club Mix", etc.
 * Identisch zur Funktion in card-generator/generateCard.js und pwa/src/utils/textMatcher.js
 */
function removeTrackSuffixes(text) {
  if (!text) return '';

  const suffixPatterns = [
    // Klammern/Brackets mit Remix-Info (ZUERST, bevor andere Patterns)
    /\s*[-–—]\s*\(.*?(remix|mix|edit|version|cut|extended|radio|club|vocal|instrumental|remaster).*?\)\s*$/i,
    /\s*[-–—]\s*\[.*?(remix|mix|edit|version|cut|extended|radio|club|vocal|instrumental|remaster).*?\]\s*$/i,
    /\s*\(.*?(remix|mix|edit|version|cut|extended|radio|club|vocal|instrumental|remaster).*?\)\s*$/i,
    /\s*\[.*?(remix|mix|edit|version|cut|extended|radio|club|vocal|instrumental|remaster).*?\]\s*$/i,

    // "- 12" Extended Remix" Format (spezifisch für diese Schreibweise)
    /\s*[-–—]\s*\d{1,2}["'']?\s+(extended|radio|club|vocal|instrumental|original)\s+(remix|mix|edit|version)?\s*$/i,

    // Komplexe Kombinationen mit Bindestrich (z.B. "- Radio Cut", "- Club Mix")
    /\s*[-–—]\s*(radio|club|extended|vocal|instrumental)\s+(cut|mix|version|edit|remix)\s*$/i,

    // Standard Suffix mit Bindestrich
    /\s*[-–—]\s*(extended|radio|club|vocal|instrumental|original|remix|mix|edit|version|cut|remaster|remastered|live)\s*$/i,

    // Suffix ohne Bindestrich (am Ende)
    /\s+(extended|radio|club|vocal|instrumental|original|remix|mix|edit|version|cut|remaster|remastered|live)\s*$/i,

    // Jahr + Remaster
    /\s*[-–—]?\s*\d{4}\s*(remaster|remastered)\s*$/i,
    /\s*[-–—]?\s*(remaster|remastered)\s*\d{4}\s*$/i,

    // Vinyl-Formate
    /\s*[-–—]?\s*(12|7)["'']?\s*(single|version|mix|edit)?\s*$/i,

    // Album/Single Versionen
    /\s*[-–—]?\s*(single|album)\s+(version|edit|mix)\s*$/i,
  ];

  let cleaned = text;
  for (const pattern of suffixPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  return cleaned.trim();
}

// Card dimensions in points (1 inch = 72 points)
// Credit card size: 85.6mm x 53.98mm
const CARD_WIDTH = 85.6 * 2.83465;  // ~243 points
const CARD_HEIGHT = 53.98 * 2.83465; // ~153 points
const MARGIN = 15;
const CARD_GAP = 10; // Gap between front and back

// A4 page size
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;

// Cards per page layout: Front + Back side by side in rows
const CARDS_PER_PAGE = 4; // 4 rows per page for better distribution

async function generateQRCode(data) {
  try {
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 120,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrDataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    return null;
  }
}

function drawCardFront(doc, song, x, y, qrDataUrl) {
  // Background (only if color mode)
  if (!BLACK_AND_WHITE) {
    doc.rect(x, y, CARD_WIDTH, CARD_HEIGHT)
       .fillColor('#1A1C27')
       .fill();
  }

  // Card border
  doc.rect(x, y, CARD_WIDTH, CARD_HEIGHT)
     .lineWidth(1)
     .strokeColor(BLACK_AND_WHITE ? '#000000' : '#4A90E2')
     .stroke();

  // Title at top
  doc.fontSize(12)
     .fillColor(BLACK_AND_WHITE ? '#000000' : '#FFFFFF')
     .font('Helvetica-Bold')
     .text('mxster', x + 10, y + 8, {
       width: CARD_WIDTH - 20,
       align: 'center'
     });

  // QR Code in center
  if (qrDataUrl) {
    const qrSize = 100;
    const qrX = x + (CARD_WIDTH - qrSize) / 2;
    const qrY = y + 25;
    doc.image(qrDataUrl, qrX, qrY, { width: qrSize, height: qrSize });
  }

  // Instructions at bottom
  doc.fontSize(6)
     .fillColor(BLACK_AND_WHITE ? '#000000' : '#B0B3C1')
     .font('Helvetica')
     .text('Scanne mit mxster App', x + 10, y + CARD_HEIGHT - 18, {
       width: CARD_WIDTH - 20,
       align: 'center'
     });

  // Song ID at very bottom
  doc.fontSize(5)
     .fillColor('#666')
     .text(song.id, x + 10, y + CARD_HEIGHT - 10, {
       width: CARD_WIDTH - 20,
       align: 'center'
     });
}

function drawCardBack(doc, song, x, y) {
  // Background (only if color mode)
  if (!BLACK_AND_WHITE) {
    doc.rect(x, y, CARD_WIDTH, CARD_HEIGHT)
       .fillColor('#2C2E3B')
       .fill();
  }

  // Card border
  doc.rect(x, y, CARD_WIDTH, CARD_HEIGHT)
     .lineWidth(1)
     .strokeColor(BLACK_AND_WHITE ? '#000000' : '#FF6B35')
     .stroke();

  // Vertikale Zentrierung: Berechne Gesamthöhe aller Elemente
  const yearFontSize = 36;
  const titleFontSize = 13;  // Vergrößert von 11 auf 13
  const artistFontSize = 11; // Vergrößert von 9 auf 11
  const gapBetweenElements = 15; // Abstand zwischen Jahr, Titel und Interpret

  const totalContentHeight = yearFontSize + gapBetweenElements + titleFontSize + gapBetweenElements + artistFontSize;
  const startY = y + (CARD_HEIGHT - totalContentHeight) / 2;

  // Year (large, prominent) - vertikal zentriert
  const yearY = startY;
  doc.fontSize(yearFontSize)
     .fillColor(BLACK_AND_WHITE ? '#000000' : '#4A90E2')
     .font('Helvetica-Bold')
     .text(song.year.toString(), x + 10, yearY, {
       width: CARD_WIDTH - 20,
       align: 'center'
     });

  // Song title (ohne Suffixe wie "12 Extended Remix", "Club Mix", etc.)
  const cleanTitle = removeTrackSuffixes(song.title);
  const titleY = yearY + yearFontSize + gapBetweenElements;
  doc.fontSize(titleFontSize)
     .fillColor(BLACK_AND_WHITE ? '#000000' : '#FFFFFF')
     .font('Helvetica-Bold')
     .text(cleanTitle, x + 10, titleY, {
       width: CARD_WIDTH - 20,
       align: 'center',
       lineGap: 2
     });

  // Artist
  const artistY = titleY + titleFontSize + gapBetweenElements;
  doc.fontSize(artistFontSize)
     .fillColor(BLACK_AND_WHITE ? '#333333' : '#B0B3C1')
     .font('Helvetica')
     .text(song.artist, x + 10, artistY, {
       width: CARD_WIDTH - 20,
       align: 'center'
     });

  // Decorative line entfernt (wie gewünscht)
}

async function generateCardsPDF() {
  console.log('🎵 Generiere mxster Spielkarten PDF...');
  console.log(`📊 Anzahl Songs: ${songs.length}`);
  console.log(`🎨 Modus: ${BLACK_AND_WHITE ? 'Schwarz-Weiß' : 'Farbig'}${DUPLEX_MODE ? ' (Duplex)' : ''}`);

  const doc = new PDFDocument({
    size: 'A4',
    margin: MARGIN,
    info: {
      Title: 'mxster - Spielkarten',
      Author: 'mxster',
      Subject: 'Music Timeline Game Cards',
      Keywords: 'mxster, music, game, cards'
    }
  });

  // Create output stream
  let outputPath = BLACK_AND_WHITE ? './mxster-cards-bw.pdf' : './mxster-cards.pdf';
  if (DUPLEX_MODE) {
    outputPath = outputPath.replace('.pdf', '-duplex.pdf');
  }
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Generate QR codes for all songs first
  console.log('  Generiere QR-Codes...');
  const qrCodes = [];
  for (const song of songs) {
    const spotifyUrl = `https://open.spotify.com/track/${song.spotifyId}`;
    const qrDataUrl = await generateQRCode(spotifyUrl);
    qrCodes.push(qrDataUrl);
  }

  // Calculate total pages
  let totalPages;

  if (DUPLEX_MODE) {
    // DUPLEX MODE: Separate pages for fronts and backs
    totalPages = Math.ceil(songs.length / CARDS_PER_PAGE) * 2; // Double pages for front+back

    console.log(`  Layout: Duplex-Druck, ${CARDS_PER_PAGE} Karten pro Seite`);
    console.log(`  Seiten: ${totalPages} (${totalPages/2} Vorderseiten + ${totalPages/2} Rückseiten)`);

    // FIRST: Print all FRONTS
    let cardIndex = 0;
    let pageNumber = 0;

    while (cardIndex < songs.length) {
      if (pageNumber > 0) {
        doc.addPage();
      }
      pageNumber++;

      console.log(`  Seite ${pageNumber}/${totalPages} (Vorderseiten)...`);

      // Page title
      doc.fontSize(10)
         .fillColor('#333')
         .font('Helvetica')
         .text(`Vorderseiten ${pageNumber}/${totalPages/2} • mxster ${BLACK_AND_WHITE ? '(S/W)' : ''}`, MARGIN, MARGIN - 5);

      // Draw front cards in a grid (2 columns)
      const cardsOnPage = Math.min(CARDS_PER_PAGE, songs.length - cardIndex);
      const cols = 2;
      const rows = Math.ceil(cardsOnPage / cols);

      for (let i = 0; i < cardsOnPage; i++) {
        const song = songs[cardIndex];
        const qrDataUrl = qrCodes[cardIndex];

        const row = Math.floor(i / cols);
        const col = i % cols;

        const x = MARGIN + col * (CARD_WIDTH + CARD_GAP);
        const y = MARGIN + 20 + row * (CARD_HEIGHT + CARD_GAP);

        drawCardFront(doc, song, x, y, qrDataUrl);
        cardIndex++;
      }

      // Draw cut lines
      doc.strokeColor('#CCC')
         .lineWidth(0.5)
         .dash(2, { space: 2 });

      // Grid lines
      for (let r = 0; r <= rows; r++) {
        const y = MARGIN + 20 + r * (CARD_HEIGHT + CARD_GAP);
        doc.moveTo(MARGIN, y)
           .lineTo(MARGIN + cols * CARD_WIDTH + (cols - 1) * CARD_GAP, y)
           .stroke();
      }

      for (let c = 0; c <= cols; c++) {
        const x = MARGIN + c * (CARD_WIDTH + CARD_GAP);
        doc.moveTo(x, MARGIN + 20)
           .lineTo(x, MARGIN + 20 + rows * (CARD_HEIGHT + CARD_GAP))
           .stroke();
      }

      doc.undash();
    }

    // SECOND: Print all BACKS (mirrored for duplex)
    cardIndex = 0;

    while (cardIndex < songs.length) {
      doc.addPage();
      pageNumber++;

      console.log(`  Seite ${pageNumber}/${totalPages} (Rückseiten)...`);

      // Page title
      doc.fontSize(10)
         .fillColor('#333')
         .font('Helvetica')
         .text(`Rückseiten ${pageNumber - totalPages/2}/${totalPages/2} • mxster ${BLACK_AND_WHITE ? '(S/W)' : ''}`, MARGIN, MARGIN - 5);

      // Draw back cards in a grid (2 columns, MIRRORED)
      const cardsOnPage = Math.min(CARDS_PER_PAGE, songs.length - cardIndex);
      const cols = 2;
      const rows = Math.ceil(cardsOnPage / cols);

      for (let i = 0; i < cardsOnPage; i++) {
        const song = songs[cardIndex];

        const row = Math.floor(i / cols);
        const col = (cols - 1) - (i % cols); // MIRROR HORIZONTALLY

        const x = MARGIN + col * (CARD_WIDTH + CARD_GAP);
        const y = MARGIN + 20 + row * (CARD_HEIGHT + CARD_GAP);

        drawCardBack(doc, song, x, y);
        cardIndex++;
      }

      // Draw cut lines
      doc.strokeColor('#CCC')
         .lineWidth(0.5)
         .dash(2, { space: 2 });

      // Grid lines
      for (let r = 0; r <= rows; r++) {
        const y = MARGIN + 20 + r * (CARD_HEIGHT + CARD_GAP);
        doc.moveTo(MARGIN, y)
           .lineTo(MARGIN + cols * CARD_WIDTH + (cols - 1) * CARD_GAP, y)
           .stroke();
      }

      for (let c = 0; c <= cols; c++) {
        const x = MARGIN + c * (CARD_WIDTH + CARD_GAP);
        doc.moveTo(x, MARGIN + 20)
           .lineTo(x, MARGIN + 20 + rows * (CARD_HEIGHT + CARD_GAP))
           .stroke();
      }

      doc.undash();
    }
  } else {
    // STANDARD MODE: Front + Back side by side
    totalPages = Math.ceil(songs.length / CARDS_PER_PAGE);

    console.log(`  Layout: Vorderseite + Rückseite nebeneinander, ${CARDS_PER_PAGE} Karten pro Seite`);
    console.log(`  Seiten: ${totalPages}`);

    let cardIndex = 0;
    let pageNumber = 0;

    // Process each page
    while (cardIndex < songs.length) {
      if (pageNumber > 0) {
        doc.addPage();
      }
      pageNumber++;

      console.log(`  Seite ${pageNumber}/${totalPages}...`);

      // Page title
      doc.fontSize(10)
         .fillColor('#333')
         .font('Helvetica')
         .text(`Seite ${pageNumber}/${totalPages} • mxster Spielkarten ${BLACK_AND_WHITE ? '(S/W)' : ''}`, MARGIN, MARGIN - 5);

      // Draw cards row by row (front + back side by side)
      for (let row = 0; row < CARDS_PER_PAGE && cardIndex < songs.length; row++) {
        const song = songs[cardIndex];
        const qrDataUrl = qrCodes[cardIndex];

        // Calculate Y position for this row
        const y = MARGIN + 20 + row * (CARD_HEIGHT + CARD_GAP);

        // Front side (left)
        const frontX = MARGIN;
        drawCardFront(doc, song, frontX, y, qrDataUrl);

        // Back side (right)
        const backX = MARGIN + CARD_WIDTH + CARD_GAP;
        drawCardBack(doc, song, backX, y);

        cardIndex++;
      }

      // Draw cut lines
      doc.strokeColor('#CCC')
         .lineWidth(0.5)
         .dash(2, { space: 2 });

      // Horizontal cut lines
      const rowsOnPage = Math.min(CARDS_PER_PAGE, songs.length - (pageNumber - 1) * CARDS_PER_PAGE);
      for (let row = 0; row <= rowsOnPage; row++) {
        const y = MARGIN + 20 + row * (CARD_HEIGHT + CARD_GAP);
        if (y < PAGE_HEIGHT - MARGIN) {
          doc.moveTo(MARGIN, y)
             .lineTo(MARGIN + CARD_WIDTH * 2 + CARD_GAP, y)
             .stroke();
        }
      }

      // Vertical cut lines (3 lines: left, middle, right)
      const verticalLines = [
        MARGIN,                              // Left edge
        MARGIN + CARD_WIDTH,                 // Between front and back
        MARGIN + CARD_WIDTH * 2 + CARD_GAP   // Right edge
      ];

      verticalLines.forEach(x => {
        if (x < PAGE_WIDTH - MARGIN) {
          doc.moveTo(x, MARGIN + 20)
             .lineTo(x, MARGIN + 20 + rowsOnPage * (CARD_HEIGHT + CARD_GAP))
             .stroke();
        }
      });

      doc.undash();
    }
  }

  // Instructions page
  doc.addPage();
  doc.fontSize(20)
     .fillColor(BLACK_AND_WHITE ? '#000000' : '#4A90E2')
     .font('Helvetica-Bold')
     .text('Anleitung', MARGIN, MARGIN + 20);

  const instructions = DUPLEX_MODE ? [
    '1. DRUCKEN (DUPLEX):',
    '   • Duplex-Druck (beidseitig)',
    '   • Erst alle Vorderseiten drucken',
    '   • Dann Papier umdrehen und Rückseiten drucken',
    '   • Papier: mindestens 200g/m² oder Karton',
    '   • ' + CARDS_PER_PAGE + ' Karten pro Seite (2x2 Grid)',
    '',
    '2. AUSSCHNEIDEN:',
    '   • Schneide entlang der gestrichelten Linien',
    '   • Die Karten sind bereits beidseitig bedruckt',
    '   • Vorder- und Rückseiten passen automatisch zusammen',
    '',
    '3. OPTIONAL:',
    '   • Laminiere für längere Haltbarkeit',
    '   • Oder klebe auf dickeren Karton',
    '',
    '4. SPIELREGELN:',
    '   • DJ scannt QR-Code mit mxster App',
    '   • Spieler raten Song, Artist und Jahr',
    '   • Korrekte Eingabe: +1 Token',
    '   • Karte wird automatisch chronologisch eingefügt',
    '   • Gewinner: Erste Person mit 10 Karten',
    '',
    'Viel Spaß beim Spielen! 🎵',
    '',
    'mxster.de'
  ] : [
    '1. DRUCKEN:',
    '   • Einfacher Druck (keine Duplex nötig!)',
    '   • Vorder- und Rückseite stehen nebeneinander',
    '   • Papier: mindestens 200g/m² oder Karton',
    '   • ' + CARDS_PER_PAGE + ' Karten pro Seite',
    '',
    '2. AUSSCHNEIDEN:',
    '   • Schneide entlang der gestrichelten Linien',
    '   • Zuerst horizontal zwischen den Zeilen',
    '   • Dann vertikal in der Mitte (zwischen Vorder-/Rückseite)',
    '   • Falte Vorder- und Rückseite aufeinander',
    '',
    '3. ZUSAMMENKLEBEN:',
    '   • Klebe Vorder- und Rückseite zusammen',
    '   • Oder laminiere für längere Haltbarkeit',
    '',
    '4. SPIELREGELN:',
    '   • DJ scannt QR-Code mit mxster App',
    '   • Spieler raten Song, Artist und Jahr',
    '   • Korrekte Eingabe: +1 Token',
    '   • Karte wird automatisch chronologisch eingefügt',
    '   • Gewinner: Erste Person mit 10 Karten',
    '',
    'Viel Spaß beim Spielen! 🎵',
    '',
    'mxster.de'
  ];

  let y = MARGIN + 80;
  doc.fontSize(10)
     .fillColor('#333')
     .font('Helvetica');

  instructions.forEach(line => {
    if (line === '') {
      y += 8;
    } else {
      doc.text(line, MARGIN, y, { width: PAGE_WIDTH - 2 * MARGIN });
      y += 16;
    }
  });

  // Finish PDF
  doc.end();

  await new Promise((resolve) => {
    stream.on('finish', () => {
      console.log('✅ PDF erfolgreich generiert!');
      console.log(`📄 Datei: ${outputPath}`);
      console.log(`📏 Format: A4`);
      console.log(`🎴 Kartengröße: 85.6mm x 54mm (Kreditkartengröße)`);
      console.log(`📐 Layout: Vorderseite + Rückseite nebeneinander, ${CARDS_PER_PAGE} Karten pro Seite`);
      console.log(`📦 Gesamt: ${songs.length} Karten auf ${totalPages} Seiten`);
      console.log(`🎨 Modus: ${BLACK_AND_WHITE ? 'Schwarz-Weiß (druckerfreundlich)' : 'Farbig'}`);
      console.log(`\n💡 Tipp: Ausschneiden, falten, zusammenkleben!`);
      resolve();
    });
  });
}

// Run the generator
generateCardsPDF().catch(err => {
  console.error('❌ Fehler beim Generieren des PDFs:', err);
  process.exit(1);
});
