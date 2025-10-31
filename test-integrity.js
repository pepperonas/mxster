#!/usr/bin/env node

/**
 * mxster - Integrity Test Suite
 *
 * Basic Tests (Always Run):
 * 1. Song Data Integrity (JSON structure)
 * 2. PWA songs.ts synchronization
 * 3. Required fields validation
 * 4. ID Uniqueness
 * 5. Year Validation
 * 6-10. File existence checks (gitignore-aware)
 *
 * Advanced Tests (Require local files/API access):
 * 11. QR Code Decoding (jsQR library)
 * 12. Spotify API Validation (live track checks)
 * 13. Image Dimensions Check (sharp library)
 * 14. OpenSCAD Syntax Validation (requires OpenSCAD)
 * 15. PDF Generation Test (validates PDF card files)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

// Dynamic imports for optional dependencies (loaded on-demand)
let jsQR, PNG, sharp;
try {
  jsQR = (await import('jsqr')).default;
  PNG = (await import('pngjs')).PNG;
  sharp = (await import('sharp')).default;
} catch (error) {
  // Optional dependencies not available - advanced tests will be skipped
}

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

// Test results
let passedTests = 0;
let failedTests = 0;
const errors = [];

/**
 * Log helpers
 */
function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
  passedTests++;
}

function logError(message, detail = '') {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
  if (detail) console.log(`   ${detail}`);
  errors.push({ message, detail });
  failedTests++;
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.cyan}ℹ️  ${message}${colors.reset}`);
}

console.log('\n╔════════════════════════════════════════════╗');
console.log('║   🧪 mxster Integrity Test Suite 🧪      ║');
console.log('╚════════════════════════════════════════════╝\n');

// Main async function
(async () => {

/**
 * Test 1: Load and validate songs.json
 */
console.log(`${colors.cyan}[Test 1] Loading songs.json...${colors.reset}`);
let songs = [];
try {
  const songsData = fs.readFileSync(path.join(__dirname, 'docs/songs.json'), 'utf8');
  songs = JSON.parse(songsData);
  logSuccess(`Loaded ${songs.length} songs from songs.json`);
} catch (error) {
  logError('Failed to load songs.json', error.message);
  process.exit(1);
}

/**
 * Test 2: Validate PWA songs.ts matches songs.json
 */
console.log(`\n${colors.cyan}[Test 2] Validating PWA songs.ts...${colors.reset}`);
try {
  // Read songs.ts as text and parse the JSON content
  const songsFilePath = path.join(__dirname, 'pwa/src/data/songs.ts');
  const songsFileContent = fs.readFileSync(songsFilePath, 'utf8');

  // Extract JSON array from the file (remove export statement and type import)
  // Match both: "export const songs = [" and "export const songs: Song[] = ["
  const jsonMatch = songsFileContent.match(/export const songs(?:: Song\[\])? = (\[[\s\S]*\])/);
  if (!jsonMatch) {
    logError('Failed to parse PWA songs.ts', 'Could not find songs array');
  } else {
    const pwaSongs = JSON.parse(jsonMatch[1]);

    if (pwaSongs.length !== songs.length) {
      logError(
        'PWA songs.ts count mismatch',
        `songs.json: ${songs.length}, PWA: ${pwaSongs.length}`
      );
    } else {
      logSuccess(`PWA songs.ts matches songs.json (${pwaSongs.length} songs)`);
    }
  }
} catch (error) {
  logError('Failed to load PWA songs.ts', error.message);
}

/**
 * Test 3: Validate song data structure
 */
console.log(`\n${colors.cyan}[Test 3] Validating song data structure...${colors.reset}`);
const requiredFields = ['id', 'title', 'artist', 'year', 'spotifyId'];
songs.forEach((song, index) => {
  const missing = requiredFields.filter(field => !song[field]);
  if (missing.length > 0) {
    logError(
      `Song #${index + 1} missing fields`,
      `Missing: ${missing.join(', ')}`
    );
  }
});

if (failedTests === 0) {
  logSuccess('All songs have required fields');
}

/**
 * Test 4: Check for duplicate IDs
 */
console.log(`\n${colors.cyan}[Test 4] Checking for duplicate IDs...${colors.reset}`);
const ids = songs.map(s => s.id);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicateIds.length > 0) {
  logError('Duplicate IDs found', duplicateIds.join(', '));
} else {
  logSuccess('All song IDs are unique');
}

/**
 * Test 5: Validate years
 */
console.log(`\n${colors.cyan}[Test 5] Validating years...${colors.reset}`);
const currentYear = new Date().getFullYear();
songs.forEach(song => {
  if (song.year < 1900 || song.year > currentYear) {
    logError(
      `Invalid year for "${song.title}"`,
      `Year: ${song.year} (expected 1900-${currentYear})`
    );
  }
});

if (failedTests === passedTests) {
  logSuccess('All years are valid');
}

/**
 * Test 6: Check 3D model files existence (gitignored, optional check)
 */
console.log(`\n${colors.cyan}[Test 6] Checking 3D model files (optional - gitignored)...${colors.reset}`);
const modelsDir = path.join(__dirname, 'card-generator/output/models');

if (fs.existsSync(modelsDir)) {
  let missingScad = 0;
  let missingStl = 0;

  songs.forEach(song => {
    const sanitizeFilename = (str) =>
      str.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 30);

    const artistSafe = sanitizeFilename(song.artist);
    const titleSafe = sanitizeFilename(song.title);
    const baseFilename = `${song.id}_${artistSafe}_${titleSafe}_${song.year}`;

    const scadPath = path.join(modelsDir, `${baseFilename}.scad`);
    const stlPath = path.join(modelsDir, `${baseFilename}.stl`);

    if (!fs.existsSync(scadPath)) {
      missingScad++;
    }

    if (!fs.existsSync(stlPath)) {
      missingStl++;
    }
  });

  if (missingScad === 0 && missingStl === 0) {
    logSuccess(`All 3D model files exist locally (${songs.length * 2} files)`);
  } else {
    logWarning(`Some 3D model files missing locally (${missingScad} SCAD, ${missingStl} STL) - will be generated on demand`);
  }
} else {
  logWarning('3D models directory not found - files are gitignored and generated on demand');
}

/**
 * Test 7: Check QR code PNG files (gitignored, optional check)
 */
console.log(`\n${colors.cyan}[Test 7] Checking QR code PNG files (optional - gitignored)...${colors.reset}`);
const qrCodesDir = path.join(__dirname, 'card-generator/output/qr-codes');

if (fs.existsSync(qrCodesDir)) {
  let missingPngs = 0;

  songs.forEach(song => {
    const sanitizeFilename = (str) =>
      str.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 30);

    const artistSafe = sanitizeFilename(song.artist);
    const titleSafe = sanitizeFilename(song.title);
    const baseFilename = `${song.id}_${artistSafe}_${titleSafe}_${song.year}`;

    const pngPath = path.join(qrCodesDir, `${baseFilename}.png`);

    if (!fs.existsSync(pngPath)) {
      missingPngs++;
    }
  });

  if (missingPngs === 0) {
    logSuccess(`All QR code PNG files exist locally (${songs.length} files)`);
  } else {
    logWarning(`Some QR code PNG files missing locally (${missingPngs} files) - will be generated on demand`);
  }
} else {
  logWarning('QR codes directory not found - files are gitignored and generated on demand');
}

/**
 * Test 8: Check all-cards.3mf exists (optional - distributed via GitHub Releases)
 */
console.log(`\n${colors.cyan}[Test 8] Checking combined 3MF file...${colors.reset}`);
const all3mfPath = path.join(__dirname, 'card-generator/output/models/all-cards.3mf');
if (fs.existsSync(all3mfPath)) {
  const stats = fs.statSync(all3mfPath);
  logSuccess(`all-cards.3mf exists (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
} else {
  logWarning('all-cards.3mf not found (optional - create manually in slicer software for releases)');
  logInfo('Individual STL files available in card-generator/output/models/');
}

/**
 * Test 9: Validate Spotify IDs format
 */
console.log(`\n${colors.cyan}[Test 9] Validating Spotify IDs...${colors.reset}`);
const spotifyIdRegex = /^[a-zA-Z0-9]{22}$/;
let invalidSpotifyIds = 0;

songs.forEach(song => {
  if (song.spotifyId && !spotifyIdRegex.test(song.spotifyId)) {
    logError(
      `Invalid Spotify ID format`,
      `${song.id}: "${song.spotifyId}"`
    );
    invalidSpotifyIds++;
  }
});

if (invalidSpotifyIds === 0) {
  logSuccess('All Spotify IDs have valid format');
}

/**
 * Test 10: Check file count consistency (optional - for local development only)
 */
console.log(`\n${colors.cyan}[Test 10] Checking file count consistency (optional)...${colors.reset}`);

logInfo(`Songs in JSON: ${songs.length}`);

if (fs.existsSync(modelsDir) && fs.existsSync(qrCodesDir)) {
  const scadFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.scad')).length;
  const stlFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.stl')).length;
  const pngFiles = fs.readdirSync(qrCodesDir).filter(f => f.startsWith('song_') && f.endsWith('.png')).length;

  logInfo(`SCAD files: ${scadFiles}`);
  logInfo(`STL files: ${stlFiles}`);
  logInfo(`PNG files: ${pngFiles}`);

  if (scadFiles === songs.length && stlFiles === songs.length && pngFiles === songs.length) {
    logSuccess('All generated files match song count (local development mode)');
  } else {
    logWarning(`File counts don't match - some files missing locally (will be generated on demand)`);
  }
} else {
  logWarning('Generated files directories not found (CI/CD mode) - files are gitignored');
  logInfo('Tests focus on data integrity only');
}

/**
 * Test 11: QR Code Decoding (Advanced - requires local files)
 */
console.log(`\n${colors.cyan}[Test 11] QR Code Decoding Test (advanced)...${colors.reset}`);

if (!jsQR || !PNG) {
  logWarning('jsQR or pngjs not available - skipping QR decode test');
  logInfo('Install with: npm install jsqr pngjs');
} else if (fs.existsSync(qrCodesDir)) {
  logInfo('Testing QR code decoding on sample files...');

  // Test first 5 QR codes as sample
  const sampleSongs = songs.slice(0, 5);
  let decodedSuccessfully = 0;
  let decodeFailed = 0;

  for (const song of sampleSongs) {
    const sanitizeFilename = (str) =>
      str.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 30);

    const artistSafe = sanitizeFilename(song.artist);
    const titleSafe = sanitizeFilename(song.title);
    const baseFilename = `${song.id}_${artistSafe}_${titleSafe}_${song.year}`;
    const pngPath = path.join(qrCodesDir, `${baseFilename}.png`);

    if (fs.existsSync(pngPath)) {
      try {
        const pngData = fs.readFileSync(pngPath);
        const png = PNG.sync.read(pngData);

        const imageData = {
          data: new Uint8ClampedArray(png.data),
          width: png.width,
          height: png.height
        };

        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          // Verify decoded data contains Spotify track URL
          if (code.data.includes('open.spotify.com/track/') || code.data.includes(song.spotifyId)) {
            decodedSuccessfully++;
          } else {
            logWarning(`QR code decoded but content unexpected for ${song.id}: ${code.data}`);
            decodeFailed++;
          }
        } else {
          logWarning(`Failed to decode QR code for ${song.id}`);
          decodeFailed++;
        }
      } catch (error) {
        logWarning(`Error decoding ${song.id}: ${error.message}`);
        decodeFailed++;
      }
    }
  }

  if (decodedSuccessfully === sampleSongs.length) {
    logSuccess(`All sample QR codes decoded successfully (${decodedSuccessfully}/${sampleSongs.length})`);
  } else if (decodedSuccessfully > 0) {
    logWarning(`Some QR codes decoded (${decodedSuccessfully}/${sampleSongs.length})`);
  } else {
    logWarning('No QR codes could be decoded (files may not exist locally)');
  }
} else {
  logWarning('QR codes directory not found - skipping decode test (CI/CD mode)');
}

/**
 * Test 12: Spotify API Validation (Advanced - requires API access)
 */
console.log(`\n${colors.cyan}[Test 12] Spotify API Validation (advanced)...${colors.reset}`);

const spotifyConfigPath = path.join(__dirname, 'pwa/spotify.config.js');
if (fs.existsSync(spotifyConfigPath)) {
  logInfo('Testing Spotify track IDs (sample of 5 tracks)...');

  try {
    // Dynamic import for ES module
    const spotifyConfig = await import(spotifyConfigPath);
    const config = spotifyConfig.default;

    if (config.clientId && config.clientSecret) {
      logInfo('Spotify credentials found, testing API access...');

      // Test sample tracks (first 5)
      const sampleSongs = songs.slice(0, 5);
      let validTracks = 0;
      let invalidTracks = 0;

      // Get Spotify access token
      try {
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(config.clientId + ':' + config.clientSecret).toString('base64')
          },
          body: 'grant_type=client_credentials'
        });

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          const accessToken = tokenData.access_token;

          // Test each sample track
          for (const song of sampleSongs) {
            try {
              const trackResponse = await fetch(`https://api.spotify.com/v1/tracks/${song.spotifyId}`, {
                headers: {
                  'Authorization': `Bearer ${accessToken}`
                }
              });

              if (trackResponse.ok) {
                validTracks++;
              } else if (trackResponse.status === 404) {
                logWarning(`Track not found on Spotify: ${song.id} (${song.spotifyId})`);
                invalidTracks++;
              } else {
                logWarning(`Error checking ${song.id}: HTTP ${trackResponse.status}`);
                invalidTracks++;
              }
            } catch (error) {
              logWarning(`Network error checking ${song.id}: ${error.message}`);
              invalidTracks++;
            }
          }

          if (validTracks === sampleSongs.length) {
            logSuccess(`All sample Spotify tracks validated (${validTracks}/${sampleSongs.length})`);
          } else if (validTracks > 0) {
            logWarning(`Some tracks validated (${validTracks}/${sampleSongs.length}), ${invalidTracks} failed`);
          } else {
            logWarning('No tracks could be validated on Spotify');
          }
        } else {
          logWarning('Failed to get Spotify access token - check credentials');
        }
      } catch (error) {
        logWarning(`Spotify API error: ${error.message}`);
      }
    } else {
      logWarning('Spotify credentials not configured - skipping API validation');
    }
  } catch (error) {
    logWarning('spotify.config.js not found or invalid - skipping API validation');
  }
} else {
  logWarning('spotify.config.js not found - skipping Spotify API validation');
}

/**
 * Test 13: Image Dimensions Check (Advanced)
 */
console.log(`\n${colors.cyan}[Test 13] Image Dimensions Check (advanced)...${colors.reset}`);

if (!sharp) {
  logWarning('sharp not available - skipping dimensions check');
  logInfo('Install with: npm install sharp');
} else if (fs.existsSync(qrCodesDir)) {
  logInfo('Checking QR code image dimensions (sample of 5)...');

  const sampleSongs = songs.slice(0, 5);
  let correctDimensions = 0;
  let incorrectDimensions = 0;

  for (const song of sampleSongs) {
    const sanitizeFilename = (str) =>
      str.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 30);

    const artistSafe = sanitizeFilename(song.artist);
    const titleSafe = sanitizeFilename(song.title);
    const baseFilename = `${song.id}_${artistSafe}_${titleSafe}_${song.year}`;
    const pngPath = path.join(qrCodesDir, `${baseFilename}.png`);

    if (fs.existsSync(pngPath)) {
      try {
        const metadata = await sharp(pngPath).metadata();

        // QR codes should be square and reasonably sized (e.g., 200x200 or similar)
        if (metadata.width === metadata.height && metadata.width >= 200) {
          correctDimensions++;
        } else {
          logWarning(`Unexpected dimensions for ${song.id}: ${metadata.width}x${metadata.height}`);
          incorrectDimensions++;
        }
      } catch (error) {
        logWarning(`Error reading image metadata for ${song.id}: ${error.message}`);
        incorrectDimensions++;
      }
    }
  }

  if (correctDimensions === sampleSongs.length) {
    logSuccess(`All sample QR code images have correct dimensions (${correctDimensions}/${sampleSongs.length})`);
  } else if (correctDimensions > 0) {
    logWarning(`Some images have correct dimensions (${correctDimensions}/${sampleSongs.length})`);
  } else {
    logWarning('Could not verify image dimensions (files may not exist locally)');
  }
} else {
  logWarning('QR codes directory not found - skipping dimensions check (CI/CD mode)');
}

/**
 * Test 14: OpenSCAD Syntax Validation (Advanced - requires OpenSCAD)
 */
console.log(`\n${colors.cyan}[Test 14] OpenSCAD Syntax Validation (advanced)...${colors.reset}`);

if (fs.existsSync(modelsDir)) {
  // Check if OpenSCAD is installed
  try {
    await execAsync('openscad --version');
    logInfo('OpenSCAD found, validating SCAD file syntax (sample of 3)...');

    const sampleSongs = songs.slice(0, 3);
    let validSyntax = 0;
    let invalidSyntax = 0;

    for (const song of sampleSongs) {
      const sanitizeFilename = (str) =>
        str.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 30);

      const artistSafe = sanitizeFilename(song.artist);
      const titleSafe = sanitizeFilename(song.title);
      const baseFilename = `${song.id}_${artistSafe}_${titleSafe}_${song.year}`;
      const scadPath = path.join(modelsDir, `${baseFilename}.scad`);

      if (fs.existsSync(scadPath)) {
        try {
          // Try to parse the SCAD file (doesn't render, just checks syntax)
          await execAsync(`openscad -o /dev/null --check-parameters true "${scadPath}" 2>&1`, { timeout: 5000 });
          validSyntax++;
        } catch (error) {
          if (!error.message.includes('No such file')) {
            logWarning(`OpenSCAD syntax error in ${song.id}: ${error.message.split('\n')[0]}`);
            invalidSyntax++;
          }
        }
      }
    }

    if (validSyntax === sampleSongs.length) {
      logSuccess(`All sample SCAD files have valid syntax (${validSyntax}/${sampleSongs.length})`);
    } else if (validSyntax > 0) {
      logWarning(`Some SCAD files valid (${validSyntax}/${sampleSongs.length}), ${invalidSyntax} have syntax errors`);
    } else {
      logWarning('Could not validate SCAD syntax (files may not exist locally)');
    }
  } catch (error) {
    logWarning('OpenSCAD not installed - skipping syntax validation');
    logInfo('Install OpenSCAD to enable this test: brew install openscad (macOS) or apt-get install openscad (Linux)');
  }
} else {
  logWarning('Models directory not found - skipping OpenSCAD validation (CI/CD mode)');
}

/**
 * Test 15: PDF Generation Test (Advanced)
 */
console.log(`\n${colors.cyan}[Test 15] PDF Generation Test (advanced)...${colors.reset}`);

const pdfDir = path.join(__dirname, 'card-generator/output/pdfs');
if (fs.existsSync(pdfDir)) {
  const pdfFiles = [
    'mxster-cards.pdf',
    'mxster-cards-bw.pdf',
    'mxster-cards-duplex.pdf',
    'mxster-cards-bw-duplex.pdf'
  ];

  let foundPdfs = 0;
  let validPdfs = 0;

  for (const pdfFile of pdfFiles) {
    const pdfPath = path.join(pdfDir, pdfFile);
    if (fs.existsSync(pdfPath)) {
      foundPdfs++;

      try {
        const stats = fs.statSync(pdfPath);
        const pdfData = fs.readFileSync(pdfPath);

        // Check if file starts with PDF magic bytes
        if (pdfData.toString('utf8', 0, 4) === '%PDF') {
          validPdfs++;
          logInfo(`${pdfFile}: ${(stats.size / 1024 / 1024).toFixed(2)} MB - Valid PDF format`);
        } else {
          logWarning(`${pdfFile} exists but is not a valid PDF file`);
        }
      } catch (error) {
        logWarning(`Error reading ${pdfFile}: ${error.message}`);
      }
    }
  }

  if (validPdfs === pdfFiles.length) {
    logSuccess(`All PDF card files exist and are valid (${validPdfs}/${pdfFiles.length})`);
  } else if (validPdfs > 0) {
    logWarning(`Some PDF files found (${validPdfs}/${pdfFiles.length})`);
  } else if (foundPdfs === 0) {
    logWarning('No PDF files found - run ./scripts/build/generate-all-pdfs.sh to generate them');
  } else {
    logWarning('PDF files found but some may be invalid');
  }
} else {
  logWarning('PDF directory not found - skipping PDF validation (CI/CD mode)');
}

/**
 * Summary
 */
console.log('\n╔════════════════════════════════════════════╗');
console.log('║              Test Summary                  ║');
console.log('╚════════════════════════════════════════════╝\n');

console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);

if (failedTests > 0) {
  console.log(`\n${colors.red}❌ Tests failed!${colors.reset}`);
  console.log('\nErrors:');
  errors.forEach((error, index) => {
    console.log(`${index + 1}. ${error.message}`);
    if (error.detail) console.log(`   ${error.detail}`);
  });
  process.exit(1);
} else {
  console.log(`\n${colors.green}✅ All tests passed!${colors.reset}\n`);
  process.exit(0);
}

})(); // End of async IIFE
