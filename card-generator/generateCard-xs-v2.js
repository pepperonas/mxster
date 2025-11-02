import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec, execSync } from 'child_process'
import { promisify } from 'util'
import QRCode from 'qrcode'
import { qrToScad2DModule } from './qrToScad2D.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const execPromise = promisify(exec)

/**
 * Generate XS-V2 flat color-based game card (50% width/length, 60% height, embedded colors in 3MF)
 * @param {Object} song - Song object with title, artist, year, spotifyId
 * @param {string} outputDir - Directory to save generated files
 */
async function generateCardXSV2(song, outputDir) {
  const { id, title, artist, year, spotifyId } = song;

  // Ensure output directories exist for XS-V2 models
  const qrCodesDir = path.join(__dirname, 'output', 'qr-codes-xs-v2');
  const modelsDir = outputDir || path.join(__dirname, 'output', 'models-xs-v2');

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
  const baseFilename = `${id}_${artistSafe}_${titleSafe}_${year}_XS-V2`;

  // 1. Generate QR code
  const spotifyUrl = `https://open.spotify.com/track/${spotifyId}`;
  const qrCodePath = path.join(qrCodesDir, `${baseFilename}.png`);

  console.log(`📱 Generating XS-V2 QR code for: ${title}`);
  console.log(`   Spotify URL: ${spotifyUrl}`);
  await QRCode.toFile(qrCodePath, spotifyUrl, {
    width: 1000,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
  console.log(`   ✅ QR code saved: ${qrCodePath}`);

  // 2. Convert QR code to OpenSCAD 2D pattern
  console.log(`   🔄 Converting QR code to 2D pattern...`);
  const qrScad2DModule = await qrToScad2DModule(qrCodePath);

  // 3. Generate OpenSCAD file (flat design with embedded colors)
  const scadContent = generateOpenSCADXSV2(song, qrScad2DModule);
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
 * Entfernt typische Track-Suffixe
 */
function removeTrackSuffixes(text) {
  if (!text) return '';

  const suffixPatterns = [
    /\s*[-–—]\s*\(.*?(remix|mix|edit|version|cut|extended|radio|club|vocal|instrumental|remaster).*?\)\s*$/i,
    /\s*[-–—]\s*\[.*?(remix|mix|edit|version|cut|extended|radio|club|vocal|instrumental|remaster).*?\]\s*$/i,
    /\s*\(.*?(remix|mix|edit|version|cut|extended|radio|club|vocal|instrumental|remaster).*?\)\s*$/i,
    /\s*\[.*?(remix|mix|edit|version|cut|extended|radio|club|vocal|instrumental|remaster).*?\]\s*$/i,
    /\s*[-–—]\s*\d{1,2}["'']?\s+(extended|radio|club|vocal|instrumental|original)\s+(remix|mix|edit|version)?\s*$/i,
    /\s*[-–—]\s*(radio|club|extended|vocal|instrumental)\s+(cut|mix|version|edit|remix)\s*$/i,
    /\s*[-–—]\s*(extended|radio|club|vocal|instrumental|original|remix|mix|edit|version|cut|remaster|remastered|live)\s*$/i,
    /\s+(extended|radio|club|vocal|instrumental|original|remix|mix|edit|version|cut|remaster|remastered|live)\s*$/i,
    /\s*[-–—]?\s*\d{4}\s*(remaster|remastered)\s*$/i,
    /\s*[-–—]?\s*(remaster|remastered)\s*\d{4}\s*$/i,
    /\s*[-–—]?\s*(12|7)["'']?\s*(single|version|mix|edit)?\s*$/i,
    /\s*[-–—]?\s*(single|album)\s+(version|edit|mix)\s*$/i,
  ];

  let cleaned = text;
  for (const pattern of suffixPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  return cleaned.trim();
}

/**
 * Generate OpenSCAD file content for XS-V2 (flat color-based design)
 * @param {Object} song - Song object
 * @param {string} qrScad2DModule - QR code 2D pattern as OpenSCAD module code
 */
function generateOpenSCADXSV2(song, qrScad2DModule) {
  const { title, artist, year } = song;

  const cleanTitle = removeTrackSuffixes(title);
  const escapeScad = (str) => str.replace(/"/g, '\\"');

  const estimateTextWidth = (text, fontSize) => {
    const charWidths = {
      'i': 0.3, 'l': 0.3, 'I': 0.3, 'j': 0.3, 'f': 0.35, 't': 0.4, 'r': 0.4,
      '!': 0.35, '.': 0.3, ',': 0.3, ':': 0.3, ';': 0.3, '\'': 0.25, '"': 0.45,
      'a': 0.55, 'b': 0.6, 'c': 0.55, 'd': 0.6, 'e': 0.55, 'g': 0.6, 'h': 0.6,
      'k': 0.55, 'n': 0.6, 'o': 0.6, 'p': 0.6, 'q': 0.6, 's': 0.5, 'u': 0.6,
      'v': 0.55, 'x': 0.55, 'y': 0.55, 'z': 0.5,
      'm': 0.9, 'w': 0.8, 'M': 0.75, 'W': 0.85,
      'A': 0.65, 'B': 0.65, 'C': 0.65, 'D': 0.7, 'E': 0.6, 'F': 0.55, 'G': 0.7,
      'H': 0.7, 'J': 0.5, 'K': 0.65, 'L': 0.55, 'N': 0.7, 'O': 0.75, 'P': 0.6,
      'Q': 0.75, 'R': 0.65, 'S': 0.6, 'T': 0.6, 'U': 0.7, 'V': 0.65, 'X': 0.65,
      'Y': 0.6, 'Z': 0.6,
      '0': 0.6, '1': 0.6, '2': 0.6, '3': 0.6, '4': 0.6, '5': 0.6,
      '6': 0.6, '7': 0.6, '8': 0.6, '9': 0.6,
      ' ': 0.3, '-': 0.35, '(': 0.4, ')': 0.4, '&': 0.7, '/': 0.35,
    };

    let totalWidth = 0;
    for (const char of text) {
      const charWidth = charWidths[char] || 0.6;
      totalWidth += charWidth * fontSize;
    }

    return totalWidth;
  };

  const splitLongText = (text, fontSize, maxWidth) => {
    const textWidth = estimateTextWidth(text, fontSize);

    if (textWidth <= maxWidth) {
      return {
        isSplit: false,
        line1: text,
        line2: ''
      };
    }

    const words = text.split(' ');
    let line1 = '';
    let line2 = '';
    let currentWidth = 0;
    const targetWidth = textWidth / 2;

    for (let i = 0; i < words.length; i++) {
      const wordWithSpace = (line1 ? ' ' : '') + words[i];
      const newWidth = estimateTextWidth(line1 + wordWithSpace, fontSize);

      if (newWidth > targetWidth && line1.length > 0) {
        line2 = words.slice(i).join(' ');
        break;
      }

      line1 += wordWithSpace;
      currentWidth = newWidth;
    }

    if (!line2) {
      const lastSpaceIndex = text.lastIndexOf(' ');
      if (lastSpaceIndex > 0) {
        line1 = text.substring(0, lastSpaceIndex);
        line2 = text.substring(lastSpaceIndex + 1);
      } else {
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

  const maxTitleWidth = 27; // mm (50% of 54mm)
  const titleFontSize = 3.25; // mm (50% of 6.5mm)

  const titleData = splitLongText(escapeScad(cleanTitle), titleFontSize, maxTitleWidth);
  const artistTruncated = escapeScad(artist).length > 25
      ? escapeScad(artist).substring(0, 22) + '...'
      : escapeScad(artist);

  return `// mxster Game Card XS-V2 (Flat Multi-Color) - ${cleanTitle}
// Generated automatically - do not edit manually
// XS-V2: 50% width/length, 60% height, flat surface with embedded colors in 3MF

// ========================================
// CARD PARAMETERS (XS-V2 SIZE)
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

// QR Code settings (50% size, flat)
qr_code_size = 24;    // 50% of 48mm

// Text settings (50% smaller fonts, flat with color)
year_font_size = 7;           // 50% of 14mm
title_font_size_single = 3.25;// 50% of 6.5mm
title_font_size_split = 2.75; // 50% of 5.5mm
artist_font_size = 3;         // 50% of 6mm
font_name = "Liberation Sans:style=Bold";

// Color layer thickness (very thin, just for color definition)
color_layer_thickness = 0.02; // 0.02mm (minimal but visible to slicer)

// ========================================
// MODULES
// ========================================

${qrScad2DModule}

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

// QR Code as flat colored layer on TOP surface
module flat_qr_code() {
    translate([card_length/2 - qr_code_size/2, card_width/2 - qr_code_size/2, card_height - 0.01]) {
        linear_extrude(height = color_layer_thickness) {
            qr_code_pattern_2d(qr_code_size);
        }
    }
}

// Text as flat colored layers on BOTTOM surface (mirrored for readability)
module flat_year() {
    y_pos = song_title_is_split ? card_width * 0.75 : card_width * 0.65;
    translate([card_length/2, y_pos, -0.01]) {
        mirror([1, 0, 0]) {
            linear_extrude(height = color_layer_thickness) {
                text(song_year,
                     size = year_font_size,
                     font = font_name,
                     halign = "center",
                     valign = "center");
            }
        }
    }
}

module flat_title() {
    if (song_title_is_split) {
        // Two-line layout
        // Line 1 (upper)
        translate([card_length/2, card_width * 0.50, -0.01]) {
            mirror([1, 0, 0]) {
                linear_extrude(height = color_layer_thickness) {
                    text(song_title_line1,
                         size = title_font_size_split,
                         font = font_name,
                         halign = "center",
                         valign = "center");
                }
            }
        }
        // Line 2 (lower)
        translate([card_length/2, card_width * 0.34, -0.01]) {
            mirror([1, 0, 0]) {
                linear_extrude(height = color_layer_thickness) {
                    text(song_title_line2,
                         size = title_font_size_split,
                         font = font_name,
                         halign = "center",
                         valign = "center");
                }
            }
        }
    } else {
        // Single line layout
        translate([card_length/2, card_width * 0.40, -0.01]) {
            mirror([1, 0, 0]) {
                linear_extrude(height = color_layer_thickness) {
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

module flat_artist() {
    y_pos = song_title_is_split ? card_width * 0.18 : card_width * 0.25;
    translate([card_length/2, y_pos, -0.01]) {
        mirror([1, 0, 0]) {
            linear_extrude(height = color_layer_thickness) {
                text(song_artist,
                     size = artist_font_size,
                     font = font_name,
                     halign = "center",
                     valign = "center");
            }
        }
    }
}

// ========================================
// MAIN ASSEMBLY - FLAT MULTI-COLOR DESIGN
// ========================================

// White base card
color("white")
    card_base();

// Black QR code on top surface (back side)
color("black")
    flat_qr_code();

// Black text on bottom surface (front side)
color("black") {
    flat_year();
    flat_title();
    flat_artist();
}
`;
}

/**
 * Generate 3MF file from OpenSCAD file (requires OpenSCAD CLI)
 * 3MF format preserves color information for multi-material printing
 * @param {string} scadPath - Path to .scad file
 */
async function generate3MF(scadPath) {
  const mfPath = scadPath.replace('.scad', '.3mf');

  try {
    // Check if OpenSCAD is installed
    await execPromise('openscad --version');

    console.log(`   🔨 Generating 3MF file with embedded colors...`);

    // Generate 3MF with color information
    await execPromise(
        `openscad -o "${mfPath}" "${scadPath}"`
    );
    console.log(`   ✅ 3MF saved: ${mfPath}`);

    return { mfPath };
  } catch (error) {
    if (error.message.includes('openscad')) {
      console.log(`   ⚠️  OpenSCAD not found. Install from https://openscad.org/`);
      console.log(`   💡 You can manually open ${scadPath} in OpenSCAD to export 3MF`);
    } else {
      console.error(`   ❌ 3MF generation failed: ${error.message}`);
    }
    return null;
  }
}

export {
  generateCardXSV2,
  generate3MF
}
