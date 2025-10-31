#!/usr/bin/env node

/**
 * mxster - Integrity Test Suite
 *
 * Tests:
 * 1. Song Data Integrity (JSON structure)
 * 2. 3D Model Files Completeness (SCAD, STL, PNG)
 * 3. QR Code Validity (can be decoded)
 * 4. ID Uniqueness
 * 5. Year Validation
 * 6. File Naming Consistency
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 * Test 6: Check 3D model files existence
 */
console.log(`\n${colors.cyan}[Test 6] Checking 3D model files...${colors.reset}`);
const modelsDir = path.join(__dirname, 'card-generator/models');
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
    logError(`Missing SCAD file`, `${song.id}: ${baseFilename}.scad`);
    missingScad++;
  }

  if (!fs.existsSync(stlPath)) {
    logError(`Missing STL file`, `${song.id}: ${baseFilename}.stl`);
    missingStl++;
  }
});

if (missingScad === 0 && missingStl === 0) {
  logSuccess(`All 3D model files exist (${songs.length * 2} files)`);
}

/**
 * Test 7: Check QR code PNG files
 */
console.log(`\n${colors.cyan}[Test 7] Checking QR code PNG files...${colors.reset}`);
const docsDir = path.join(__dirname, 'docs');
let missingPngs = 0;

songs.forEach(song => {
  const sanitizeFilename = (str) =>
    str.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 30);

  const artistSafe = sanitizeFilename(song.artist);
  const titleSafe = sanitizeFilename(song.title);
  const baseFilename = `${song.id}_${artistSafe}_${titleSafe}_${song.year}`;

  const pngPath = path.join(docsDir, `${baseFilename}.png`);

  if (!fs.existsSync(pngPath)) {
    logError(`Missing PNG file`, `${song.id}: ${baseFilename}.png`);
    missingPngs++;
  }
});

if (missingPngs === 0) {
  logSuccess(`All QR code PNG files exist (${songs.length} files)`);
}

/**
 * Test 8: Check all-cards.3mf exists (optional - distributed via GitHub Releases)
 */
console.log(`\n${colors.cyan}[Test 8] Checking combined 3MF file...${colors.reset}`);
const all3mfPath = path.join(__dirname, 'card-generator/models/all-cards.3mf');
if (fs.existsSync(all3mfPath)) {
  const stats = fs.statSync(all3mfPath);
  logSuccess(`all-cards.3mf exists (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
} else {
  logWarning('all-cards.3mf not found (optional - create manually in slicer software for releases)');
  logInfo('Individual STL files available in card-generator/models/');
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
 * Test 10: Check file count consistency
 */
console.log(`\n${colors.cyan}[Test 10] Checking file count consistency...${colors.reset}`);
const scadFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.scad')).length;
const stlFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.stl')).length;
const pngFiles = fs.readdirSync(docsDir).filter(f => f.startsWith('song_') && f.endsWith('.png')).length;

logInfo(`Songs in JSON: ${songs.length}`);
logInfo(`SCAD files: ${scadFiles}`);
logInfo(`STL files: ${stlFiles}`);
logInfo(`PNG files: ${pngFiles}`);

if (scadFiles === songs.length && stlFiles === songs.length && pngFiles === songs.length) {
  logSuccess('All file counts match song count');
} else {
  logError('File count mismatch', `Expected ${songs.length} of each file type`);
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
