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
 * 6. Spotify ID format (optional legacy key; newer songs have none)
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
const requiredFields = ['id', 'title', 'artist', 'year', 'previewUrl'];
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
let invalidYears = 0;
songs.forEach(song => {
  if (song.year < 1900 || song.year > currentYear) {
    invalidYears++;
    logError(
      `Invalid year for "${song.title}"`,
      `Year: ${song.year} (expected 1900-${currentYear})`
    );
  }
});

if (invalidYears === 0) {
  logSuccess('All years are valid');
}

/**
 * Test 6: Validate Spotify IDs format
 */
console.log(`\n${colors.cyan}[Test 6] Validating Spotify IDs (where present)...${colors.reset}`);
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
