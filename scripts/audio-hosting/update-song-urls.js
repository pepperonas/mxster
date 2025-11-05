#!/usr/bin/env node
/**
 * Update Song URLs
 *
 * Updates previewUrl in songs.json and songs.ts to point to self-hosted MP3s
 * Changes from empty "" to "https://mxster.de/audio/song_XXX.mp3"
 *
 * Usage:
 *   node scripts/audio-hosting/update-song-urls.js
 *   node scripts/audio-hosting/update-song-urls.js --dry-run  # Preview changes
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Configuration
const SONGS_JSON_PATH = path.join(__dirname, '../../docs/songs.json')
const SONGS_TS_PATH = path.join(__dirname, '../../pwa/src/data/songs.ts')
const LOCAL_AUDIO_DIR = path.join(__dirname, '../../pwa/public/audio')
const BASE_URL = 'https://mxster.de/audio'

// Parse CLI arguments
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

/**
 * Get list of available MP3 files
 */
function getAvailableMP3s() {
  if (!fs.existsSync(LOCAL_AUDIO_DIR)) {
    return []
  }

  return fs.readdirSync(LOCAL_AUDIO_DIR)
    .filter(f => f.endsWith('.mp3'))
    .map(f => path.basename(f, '.mp3'))
}

/**
 * Create backup of file
 */
function createBackup(filePath) {
  const timestamp = new Date().toISOString().split('T')[0]
  const backupPath = `${filePath}.backup-${timestamp}`

  fs.copyFileSync(filePath, backupPath)
  log(`✅ Backup created: ${path.basename(backupPath)}`, 'green')

  return backupPath
}

/**
 * Update songs.json
 */
function updateSongsJSON(availableMP3s) {
  log('\n📝 Updating songs.json...', 'cyan')

  const songs = JSON.parse(fs.readFileSync(SONGS_JSON_PATH, 'utf-8'))
  let updatedCount = 0
  let missingCount = 0

  songs.forEach(song => {
    const hasMP3 = availableMP3s.includes(song.id)

    if (hasMP3) {
      const newUrl = `${BASE_URL}/${song.id}.mp3`

      if (song.previewUrl !== newUrl) {
        song.previewUrl = newUrl
        updatedCount++
        log(`   ✅ ${song.id}: ${newUrl}`, 'green')
      }
    } else {
      if (!song.previewUrl || song.previewUrl === '') {
        missingCount++
        log(`   ⚠️  ${song.id}: No MP3 file found`, 'yellow')
      }
    }
  })

  if (!dryRun) {
    createBackup(SONGS_JSON_PATH)
    fs.writeFileSync(SONGS_JSON_PATH, JSON.stringify(songs, null, 2))
    log(`\n✅ songs.json updated (${updatedCount} URLs changed)`, 'green')
  } else {
    log(`\n📋 DRY RUN: Would update ${updatedCount} URLs`, 'yellow')
  }

  return { updatedCount, missingCount, songs }
}

/**
 * Update songs.ts
 */
function updateSongsTS(songs) {
  log('\n📝 Updating songs.ts...', 'cyan')

  const songsArray = songs.map(song => {
    return `  {
    "id": "${song.id}",
    "title": "${song.title.replace(/"/g, '\\"')}",
    "artist": "${song.artist.replace(/"/g, '\\"')}",
    "year": ${song.year},
    "spotifyId": "${song.spotifyId}",
    "previewUrl": "${song.previewUrl || ''}",
    "genre": "${song.genre || ''}"
  }`
  }).join(',\n')

  const content = `import type { Song } from '@/types'

export const songs: Song[] = [
${songsArray}
]
`

  if (!dryRun) {
    createBackup(SONGS_TS_PATH)
    fs.writeFileSync(SONGS_TS_PATH, content, 'utf-8')
    log('✅ songs.ts updated', 'green')
  } else {
    log('📋 DRY RUN: Would update songs.ts', 'yellow')
  }
}

/**
 * Generate update statistics
 */
function generateStatistics(songs, availableMP3s) {
  const hasPreviewUrl = songs.filter(s => s.previewUrl && s.previewUrl !== '').length
  const hasMP3 = songs.filter(s => availableMP3s.includes(s.id)).length
  const missing = songs.length - hasMP3

  return {
    total: songs.length,
    withPreviewUrl: hasPreviewUrl,
    withMP3: hasMP3,
    missing,
    percentage: ((hasMP3 / songs.length) * 100).toFixed(1)
  }
}

/**
 * Main function
 */
async function main() {
  log('\n╔══════════════════════════════════════════════════════╗', 'bright')
  log('║      🔗  mxster URL Update Manager  🔗              ║', 'bright')
  log('╚══════════════════════════════════════════════════════╝\n', 'bright')

  if (dryRun) {
    log('⚠️  DRY RUN MODE - No files will be modified\n', 'yellow')
  }

  // Step 1: Get available MP3 files
  log('📂 Checking available MP3 files...', 'cyan')
  const availableMP3s = getAvailableMP3s()

  if (availableMP3s.length === 0) {
    log('❌ No MP3 files found in pwa/public/audio/', 'red')
    log('   Run download-songs.js first\n', 'yellow')
    process.exit(1)
  }

  log(`✅ Found ${availableMP3s.length} MP3 files\n`, 'green')

  // Step 2: Update songs.json
  const { updatedCount, missingCount, songs } = updateSongsJSON(availableMP3s)

  // Step 3: Update songs.ts
  updateSongsTS(songs)

  // Step 4: Generate statistics
  log('\n═'.repeat(60), 'bright')
  log('📊 UPDATE STATISTICS', 'bright')
  log('═'.repeat(60), 'bright')

  const stats = generateStatistics(songs, availableMP3s)

  log(`Total songs:           ${stats.total}`, 'blue')
  log(`With preview URL:      ${stats.withPreviewUrl}`, 'green')
  log(`With MP3 file:         ${stats.withMP3}`, 'green')
  log(`Missing MP3:           ${stats.missing}`, stats.missing > 0 ? 'yellow' : 'green')
  log(`Coverage:              ${stats.percentage}%`, stats.percentage === '100.0' ? 'green' : 'yellow')

  if (!dryRun && updatedCount > 0) {
    log('\n🎉 URL update complete!', 'green')
    log('\n📋 Next steps:', 'bright')
    log('   1. Validate URLs:  node scripts/audio-hosting/validate-audio.js', 'cyan')
    log('   2. Build PWA:      cd pwa && npm run build', 'cyan')
    log('   3. Deploy:         ./scripts/deployment/deploy.sh\n', 'cyan')
  }

  if (missingCount > 0) {
    log(`\n⚠️  ${missingCount} songs are missing MP3 files`, 'yellow')
    log('   These songs will have empty previewUrl and won\'t play', 'yellow')
    log('   Run download-songs.js --resume to download missing files\n', 'yellow')
  }
}

// Run main function
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red')
  console.error(error)
  process.exit(1)
})
