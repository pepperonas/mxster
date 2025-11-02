import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec, execSync } from 'child_process'
import { promisify } from 'util'
import QRCode from 'qrcode'
import { qrToScadModule } from './qrToScad.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const execPromise = promisify(exec)

/**
 * Generate XS test print game card (50% width/length, 60% height, convex text)
 * @param {Object} song - Song object with title, artist, year, spotifyId
 * @param {string} outputDir - Directory to save generated files
 */
async function generateCardXS(song, outputDir) {
  const { id, title, artist, year, spotifyId } = song;

  // Ensure output directories exist for XS models
  const qrCodesDir = path.join(__dirname, 'output', 'qr-codes-xs');
  const modelsDir = outputDir || path.join(__dirname, 'output', 'models-xs');

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
  const baseFilename = `${id}_${artistSafe}_${titleSafe}_${year}_XS`;

  // 1. Generate QR code
  // Use Spotify URL for universal compatibility
  const spotifyUrl = `https://open.spotify.com/track/${spotifyId}`;
  const qrCodePath = path.join(qrCodesDir, `${baseFilename}.png`);

  console.log(`📱 Generating XS QR code for: ${title}`);
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

  // 3. Generate OpenSCAD file (dual-sided model with embossed text)
  const scadContent = generateOpenSCADXS(song, qrScadModule);
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
 * Generate OpenSCAD file content for XS test print
 * - 50% width/length
 * - 60% height
 * - Convex (embossed) text instead of engraved
 * - No watermark
 * @param {Object} song - Song object
 * @param {string} qrScadModule - QR code pattern as OpenSCAD module code
 */
function generateOpenSCADXS(song, qrScadModule) {
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

  // XS card: 50% of original width (27mm instead of 54mm)
  const maxTitleWidth = 27; // mm (50% of 54mm)
  const titleFontSize = 3.25; // mm (50% of 6.5mm)

  const titleData = splitLongText(escapeScad(cleanTitle), titleFontSize, maxTitleWidth);
  const artistTruncated = escapeScad(artist).length > 25
      ? escapeScad(artist).substring(0, 22) + '...'
      : escapeScad(artist);

  return `// mxster Game Card XS (Test Print) - ${cleanTitle}
// Generated automatically - do not edit manually
// XS Version: 50% width/length, 60% height, convex text, no watermark

// ========================================
// CARD PARAMETERS (XS SIZE)
// ========================================

// Card dimensions (50% width/length, 60% height of standard)
card_length = 42.8;   // 50% of 85.6mm
card_width = 26.99;   // 50% of 53.98mm
card_height = 0.96;   // 60% of 1.6mm
corner_radius = 1.25; // 50% of 2.5mm

// Song information
song_year = "${year}";
song_title_line1 = "${titleData.line1}";
song_title_line2 = "${titleData.line2}";
song_title_is_split = ${titleData.isSplit ? 'true' : 'false'};
song_artist = "${artistTruncated}";

// QR Code settings (50% size)
qr_code_size = 24;    // 50% of 48mm
qr_code_depth = 0.32; // 60% of card height (0.96mm * 0.33)

// Text settings (50% smaller fonts, embossed instead of engraved)
text_height = 0.36;           // 60% of 0.6mm (embossed height)
year_font_size = 7;           // 50% of 14mm
title_font_size_single = 3.25;// 50% of 6.5mm
title_font_size_split = 2.75; // 50% of 5.5mm
artist_font_size = 3;         // 50% of 6mm
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

// QR Code EMBOSSED on TOP (back side) - convex instead of engraved
module qr_code_embossed() {
    translate([card_length/2 - qr_code_size/2, card_width/2 - qr_code_size/2, card_height]) {
        qr_code_pattern(qr_code_size, qr_code_depth);
    }
}

// Text EMBOSSED on BOTTOM (front side) - convex instead of engraved
// Text grows DOWNWARD from z=0 (into negative Z space)
// Mirrored on X-axis so it's readable from below
module embossed_year() {
    // Year position - moved higher when title is split to make room
    y_pos = song_title_is_split ? card_width * 0.75 : card_width * 0.65;
    translate([card_length/2, y_pos, 0]) {
        mirror([1, 0, 0]) {
            translate([0, 0, -text_height]) {
                linear_extrude(height = text_height) {
                    text(song_year,
                         size = year_font_size,
                         font = font_name,
                         halign = "center",
                         valign = "center");
                }
            }
        }
    }
}

module embossed_title() {
    if (song_title_is_split) {
        // Two-line layout with smaller font and optimal spacing
        // Line 1 (upper)
        translate([card_length/2, card_width * 0.50, 0]) {
            mirror([1, 0, 0]) {
                translate([0, 0, -text_height]) {
                    linear_extrude(height = text_height) {
                        text(song_title_line1,
                             size = title_font_size_split,
                             font = font_name,
                             halign = "center",
                             valign = "center");
                    }
                }
            }
        }
        // Line 2 (lower)
        translate([card_length/2, card_width * 0.34, 0]) {
            mirror([1, 0, 0]) {
                translate([0, 0, -text_height]) {
                    linear_extrude(height = text_height) {
                        text(song_title_line2,
                             size = title_font_size_split,
                             font = font_name,
                             halign = "center",
                             valign = "center");
                    }
                }
            }
        }
    } else {
        // Single line layout with normal font
        translate([card_length/2, card_width * 0.40, 0]) {
            mirror([1, 0, 0]) {
                translate([0, 0, -text_height]) {
                    linear_extrude(height = text_height) {
                        text(song_title_line1,
                             size = title_font_size_single,
                             font = font_name,
                             halign = "center",
                             valign = "center");
                    }
                }
            }
        }
    }
}

module embossed_artist() {
    // Artist position - moved lower when title is split to make room
    y_pos = song_title_is_split ? card_width * 0.18 : card_width * 0.25;
    translate([card_length/2, y_pos, 0]) {
        mirror([1, 0, 0]) {
            translate([0, 0, -text_height]) {
                linear_extrude(height = text_height) {
                    text(song_artist,
                         size = artist_font_size,
                         font = font_name,
                         halign = "center",
                         valign = "center");
                }
            }
        }
    }
}

// ========================================
// MAIN ASSEMBLY - EMBOSSED TEXT (NO WATERMARK)
// ========================================

union() {
    // Base card
    card_base();

    // QR code embossed on top (back side, z=card_height)
    qr_code_embossed();

    // Text embossed on bottom (front side, z=0)
    embossed_year();
    embossed_title();
    embossed_artist();
}
`;
}

/**
 * Generate STL file from OpenSCAD file (requires OpenSCAD CLI)
 * @param {string} scadPath - Path to .scad file
 */
async function generateSTLXS(scadPath) {
  const stlPath = scadPath.replace('.scad', '.stl');

  try {
    // Check if OpenSCAD is installed
    await execPromise('openscad --version');

    console.log(`   🔨 Generating XS STL file...`);

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

export {
  generateCardXS,
  generateSTLXS
}
