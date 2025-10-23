const fs = require('fs').promises;
const path = require('path');
const QRCode = require('qrcode');
const { qrToScadModule } = require('./qrToScad');

/**
 * Generate a 3D printable game card for a song
 * @param {Object} song - Song object with title, artist, year, spotifyId
 * @param {string} outputDir - Directory to save generated files
 */
async function generateCard(song, outputDir = './card-generator/models') {
  const { id, title, artist, year, spotifyId } = song;

  // Ensure output directories exist
  const qrCodesDir = path.join('./card-generator/qr-codes');
  const modelsDir = outputDir;

  await fs.mkdir(qrCodesDir, { recursive: true });
  await fs.mkdir(modelsDir, { recursive: true });

  // Create filename-safe versions of artist and title
  const sanitizeFilename = (str) => {
    return str
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, '_')            // Replace spaces with underscore
      .substring(0, 30);                // Limit length
  };

  const artistSafe = sanitizeFilename(artist);
  const titleSafe = sanitizeFilename(title);
  const baseFilename = `${id}_${artistSafe}_${titleSafe}_${year}`;

  // 1. Generate QR code
  // Use Spotify URL for universal compatibility
  const spotifyUrl = `https://open.spotify.com/track/${spotifyId}`;
  const qrCodePath = path.join(qrCodesDir, `${baseFilename}.png`);

  console.log(`📱 Generating QR code for: ${title}`);
  console.log(`   Spotify URL: ${spotifyUrl}`);
  await QRCode.toFile(qrCodePath, spotifyUrl, {
    width: 1000, // High resolution for 3D printing
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
  console.log(`   ✅ QR code saved: ${qrCodePath}`);

  // 2. Convert QR code to OpenSCAD pattern
  console.log(`   🔄 Converting QR code to 3D pattern...`);
  const qrScadModule = await qrToScadModule(qrCodePath);

  // 3. Generate OpenSCAD file (dual-sided model)
  const scadContent = generateOpenSCAD(song, qrScadModule);
  const scadPath = path.join(modelsDir, `${baseFilename}.scad`);

  await fs.writeFile(scadPath, scadContent, 'utf8');
  console.log(`   ✅ OpenSCAD file saved: ${scadPath}`);

  return {
    qrCodePath,
    scadPath,
    songId: id,
    filename: baseFilename
  };
}

/**
 * Entfernt typische Track-Suffixe wie "12 Extended Remix", "Club Mix", etc.
 * Identisch zur Funktion in pwa/src/utils/textMatcher.js
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

/**
 * Generate OpenSCAD file content
 * @param {Object} song - Song object
 * @param {string} qrScadModule - QR code pattern as OpenSCAD module code
 */
function generateOpenSCAD(song, qrScadModule) {
  const { title, artist, year } = song;

  // Entferne Track-Suffixe vom Titel für sauberere Kartendarstellung
  const cleanTitle = removeTrackSuffixes(title);

  // Escape special characters in strings for OpenSCAD
  const escapeScad = (str) => str.replace(/"/g, '\\"');

  /**
   * Estimate text width based on character widths
   * Uses approximate width factors for Liberation Sans Bold
   */
  const estimateTextWidth = (text, fontSize) => {
    // Approximate relative widths for common characters in Liberation Sans Bold
    const charWidths = {
      // Narrow characters
      'i': 0.3, 'l': 0.3, 'I': 0.3, 'j': 0.3, 'f': 0.35, 't': 0.4, 'r': 0.4,
      // Medium-narrow characters
      '!': 0.35, '.': 0.3, ',': 0.3, ':': 0.3, ';': 0.3, '\'': 0.25, '"': 0.45,
      // Regular characters
      'a': 0.55, 'b': 0.6, 'c': 0.55, 'd': 0.6, 'e': 0.55, 'g': 0.6, 'h': 0.6,
      'k': 0.55, 'n': 0.6, 'o': 0.6, 'p': 0.6, 'q': 0.6, 's': 0.5, 'u': 0.6,
      'v': 0.55, 'x': 0.55, 'y': 0.55, 'z': 0.5,
      // Wide characters
      'm': 0.9, 'w': 0.8, 'M': 0.75, 'W': 0.85,
      // Uppercase regular
      'A': 0.65, 'B': 0.65, 'C': 0.65, 'D': 0.7, 'E': 0.6, 'F': 0.55, 'G': 0.7,
      'H': 0.7, 'J': 0.5, 'K': 0.65, 'L': 0.55, 'N': 0.7, 'O': 0.75, 'P': 0.6,
      'Q': 0.75, 'R': 0.65, 'S': 0.6, 'T': 0.6, 'U': 0.7, 'V': 0.65, 'X': 0.65,
      'Y': 0.6, 'Z': 0.6,
      // Numbers
      '0': 0.6, '1': 0.6, '2': 0.6, '3': 0.6, '4': 0.6, '5': 0.6,
      '6': 0.6, '7': 0.6, '8': 0.6, '9': 0.6,
      // Special characters
      ' ': 0.3, '-': 0.35, '(': 0.4, ')': 0.4, '&': 0.7, '/': 0.35,
    };

    let totalWidth = 0;
    for (const char of text) {
      // Use specific width if available, otherwise default to 0.6
      const charWidth = charWidths[char] || 0.6;
      totalWidth += charWidth * fontSize;
    }

    return totalWidth;
  };

  /**
   * Smart text splitting based on actual rendered width
   * @param {string} text - Text to potentially split
   * @param {number} fontSize - Font size in mm
   * @param {number} maxWidth - Maximum width in mm before splitting
   */
  const splitLongText = (text, fontSize, maxWidth) => {
    const textWidth = estimateTextWidth(text, fontSize);

    if (textWidth <= maxWidth) {
      return {
        isSplit: false,
        line1: text,
        line2: ''
      };
    }

    // Need to split - find best split point
    const words = text.split(' ');
    let line1 = '';
    let line2 = '';

    // Build line1 by adding words until we exceed half the total width
    let currentWidth = 0;
    const targetWidth = textWidth / 2;

    for (let i = 0; i < words.length; i++) {
      const wordWithSpace = (line1 ? ' ' : '') + words[i];
      const newWidth = estimateTextWidth(line1 + wordWithSpace, fontSize);

      if (newWidth > targetWidth && line1.length > 0) {
        // This word would exceed target, start line 2
        line2 = words.slice(i).join(' ');
        break;
      }

      line1 += wordWithSpace;
      currentWidth = newWidth;
    }

    // Fallback: if line2 is empty, force split at last word
    if (!line2) {
      const lastSpaceIndex = text.lastIndexOf(' ');
      if (lastSpaceIndex > 0) {
        line1 = text.substring(0, lastSpaceIndex);
        line2 = text.substring(lastSpaceIndex + 1);
      } else {
        // No spaces at all - split in middle
        const middle = Math.floor(text.length / 2);
        line1 = text.substring(0, middle);
        line2 = text.substring(middle);
      }
    }

    return {
      isSplit: true,
      line1: line1.trim(),
      line2: line2.trim()
    };
  };

  // Card width is 85.6mm, leave margins on both sides
  // Single-line title should fit within ~54mm (centered with comfortable margins)
  // This allows titles like "Tell It to My Heart" (47mm) and "Bohemian Rhapsody" (53mm) to stay on one line
  // while splitting longer titles like "Smells Like Teen Spirit" (60mm)
  const maxTitleWidth = 54; // mm
  const titleFontSize = 6.5; // mm - Vergrößert von 5.5

  const titleData = splitLongText(escapeScad(cleanTitle), titleFontSize, maxTitleWidth);
  const artistTruncated = escapeScad(artist).length > 25
    ? escapeScad(artist).substring(0, 22) + '...'
    : escapeScad(artist);

  return `// mxster Game Card - ${cleanTitle}
// Generated automatically - do not edit manually

// ========================================
// CARD PARAMETERS
// ========================================

// Card dimensions (ISO/IEC 7810 standard - credit card size)
card_length = 85.6;
card_width = 53.98;
card_height = 1.6;  // Increased from 1.2mm (133% thicker for better durability)
corner_radius = 2.5;

// Song information
song_year = "${year}";
song_title_line1 = "${titleData.line1}";
song_title_line2 = "${titleData.line2}";
song_title_is_split = ${titleData.isSplit ? 'true' : 'false'};
song_artist = "${artistTruncated}";

// QR Code settings
qr_code_size = 48;  // Increased from 35 for better camera recognition
qr_code_depth = 0.53;  // Increased from 0.4mm (proportional to card thickness)

// Text settings
text_height = 0.6;  // Deeper engraving for more tactile feel (was 0.33mm)
watermark_height = 0.4;  // Deeper watermark engraving (was 0.15mm)
year_font_size = 14;
title_font_size_single = 6.5;  // Vergrößert von 5.5
title_font_size_split = 5.5;  // Vergrößert von 4.5 (Smaller font for two-line titles)
artist_font_size = 6;  // Vergrößert von 5
font_name = "Liberation Sans:style=Bold";

// ========================================
// MODULES
// ========================================

${qrScadModule}

module rounded_rect(length, width, height, radius) {
    hull() {
        translate([radius, radius, 0])
            cylinder(h=height, r=radius, $fn=50);
        translate([length-radius, radius, 0])
            cylinder(h=height, r=radius, $fn=50);
        translate([radius, width-radius, 0])
            cylinder(h=height, r=radius, $fn=50);
        translate([length-radius, width-radius, 0])
            cylinder(h=height, r=radius, $fn=50);
    }
}

module card_base() {
    rounded_rect(card_length, card_width, card_height, corner_radius);
}

// QR Code engraving on BOTTOM (front)
module qr_code_engraving() {
    translate([card_length/2 - qr_code_size/2, card_width/2 - qr_code_size/2, -0.05]) {
        qr_code_pattern(qr_code_size, qr_code_depth + 0.1);
    }
}

// Text engraving on TOP (back) - vertieft statt erhaben
module engraved_year() {
    // Year position - moved higher when title is split to make room
    y_pos = song_title_is_split ? card_width * 0.75 : card_width * 0.65;  // Weiter nach oben verschoben von 0.70 auf 0.75
    translate([card_length/2, y_pos, card_height - text_height + 0.05]) {
        linear_extrude(height = text_height + 0.1) {
            text(song_year,
                 size = year_font_size,
                 font = font_name,
                 halign = "center",
                 valign = "center");
        }
    }
}

module engraved_title() {
    if (song_title_is_split) {
        // Two-line layout with smaller font and optimal spacing
        // Line 1 (upper)
        translate([card_length/2, card_width * 0.50, card_height - text_height + 0.05]) {  // Verschoben von 0.46 auf 0.50
            linear_extrude(height = text_height + 0.1) {
                text(song_title_line1,
                     size = title_font_size_split,
                     font = font_name,
                     halign = "center",
                     valign = "center");
            }
        }
        // Line 2 (lower)
        translate([card_length/2, card_width * 0.34, card_height - text_height + 0.05]) {  // Verschoben von 0.36 auf 0.34 (größerer Abstand zwischen Zeilen)
            linear_extrude(height = text_height + 0.1) {
                text(song_title_line2,
                     size = title_font_size_split,
                     font = font_name,
                     halign = "center",
                     valign = "center");
            }
        }
    } else {
        // Single line layout with normal font
        translate([card_length/2, card_width * 0.40, card_height - text_height + 0.05]) {
            linear_extrude(height = text_height + 0.1) {
                text(song_title_line1,
                     size = title_font_size_single,
                     font = font_name,
                     halign = "center",
                     valign = "center");
            }
        }
    }
}

module engraved_artist() {
    // Artist position - moved lower when title is split to make room
    y_pos = song_title_is_split ? card_width * 0.18 : card_width * 0.25;  // Weiter nach unten verschoben von 0.22 auf 0.18
    translate([card_length/2, y_pos, card_height - text_height + 0.05]) {
        linear_extrude(height = text_height + 0.1) {
            text(song_artist,
                 size = artist_font_size,
                 font = font_name,
                 halign = "center",
                 valign = "center");
        }
    }
}

module watermark() {
    translate([card_length - 22, 3, card_height - watermark_height + 0.05]) {  // Verschoben von -15 nach -22 (weiter nach links)
        linear_extrude(height = watermark_height + 0.1) {
            text("mxster",
                 size = 4,  // Vergrößert von 3
                 font = "Liberation Sans:style=Bold",
                 halign = "left",
                 valign = "bottom");
        }
    }
}

// ========================================
// MAIN ASSEMBLY - BEIDSEITIG GRAVIERT
// ========================================

difference() {
    // Basis-Karte
    card_base();

    // QR-Code auf Unterseite (Vorderseite)
    qr_code_engraving();

    // Text auf Oberseite (Rückseite) - alle graviert
    engraved_year();
    engraved_title();
    engraved_artist();
    watermark();
}
`;
}

/**
 * Generate STL file from OpenSCAD file (requires OpenSCAD CLI)
 * @param {string} scadPath - Path to .scad file
 */
async function generateSTL(scadPath) {
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);

  const stlPath = scadPath.replace('.scad', '.stl');

  try {
    // Check if OpenSCAD is installed
    await execPromise('openscad --version');

    console.log(`   🔨 Generating STL file...`);

    // Generate single dual-sided STL
    await execPromise(
      `openscad -o "${stlPath}" "${scadPath}"`
    );
    console.log(`   ✅ STL saved: ${stlPath}`);

    return { stlPath };
  } catch (error) {
    if (error.message.includes('openscad')) {
      console.log(`   ⚠️  OpenSCAD not found. Install from https://openscad.org/`);
      console.log(`   💡 You can manually open ${scadPath} in OpenSCAD to export STL`);
    } else {
      console.error(`   ❌ STL generation failed: ${error.message}`);
    }
    return null;
  }
}

module.exports = {
  generateCard,
  generateSTL
};
