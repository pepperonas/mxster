#!/usr/bin/env node
/**
 * Download Songs via yt-dlp
 *
 * Downloads full songs (128 kbps MP3) from YouTube based on songs.json
 * Saves to pwa/public/audio/ directory
 *
 * Usage:
 *   node scripts/audio-hosting/download-songs.js
 *   node scripts/audio-hosting/download-songs.js --limit 10  # Test mit 10 Songs
 *   node scripts/audio-hosting/download-songs.js --resume    # Nur fehlende Songs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Configuration
const SONGS_JSON_PATH = path.join(__dirname, '../../docs/songs.json')
const OUTPUT_DIR = path.join(__dirname, '../../pwa/public/audio')
const REPORT_PATH = path.join(__dirname, '../../docs/download-report.json')
const CONCURRENT_DOWNLOADS = 3 // Parallel downloads
const MAX_RETRIES = 3
const AUDIO_QUALITY = '128' // 128 kbps MP3

// Parse CLI arguments
const args = process.argv.slice(2)
const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null
const resume = args.includes('--resume')

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
 * Check if yt-dlp is installed
 */
async function checkYtDlp() {
  try {
    await execAsync('yt-dlp --version')
    return true
  } catch (error) {
    return false
  }
}

/**
 * Download single song via yt-dlp
 */
async function downloadSong(song, attempt = 1) {
  const fileName = `${song.id}.mp3`
  const outputPath = path.join(OUTPUT_DIR, fileName)

  // Skip if file already exists (resume mode)
  if (resume && fs.existsSync(outputPath)) {
    log(`⏭️  Skipping ${song.id} (already exists)`, 'yellow')
    return { success: true, skipped: true, path: outputPath }
  }

  const searchQuery = `${song.artist} - ${song.title}`.replace(/"/g, '\\"')

  try {
    log(`📥 Downloading [${attempt}/${MAX_RETRIES}]: ${song.artist} - ${song.title}`, 'cyan')

    // yt-dlp command for YouTube Music
    const command = `yt-dlp \\
      --extract-audio \\
      --audio-format mp3 \\
      --audio-quality ${AUDIO_QUALITY} \\
      --format "bestaudio" \\
      --output "${outputPath}" \\
      --no-playlist \\
      --quiet \\
      --no-warnings \\
      "ytsearch1:${searchQuery}"`

    const { stdout, stderr } = await execAsync(command, {
      timeout: 60000 // 60 second timeout per download
    })

    // Check if file was created
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath)
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
      log(`✅ Success: ${song.id} (${sizeMB} MB)`, 'green')

      return {
        success: true,
        path: outputPath,
        size: stats.size,
        sizeMB
      }
    } else {
      throw new Error('File not created')
    }

  } catch (error) {
    log(`❌ Error [${attempt}/${MAX_RETRIES}]: ${error.message}`, 'red')

    // Retry logic
    if (attempt < MAX_RETRIES) {
      log(`🔄 Retrying in 2 seconds...`, 'yellow')
      await new Promise(resolve => setTimeout(resolve, 2000))
      return downloadSong(song, attempt + 1)
    }

    return {
      success: false,
      error: error.message,
      attempts: attempt
    }
  }
}

/**
 * Download songs in batches with concurrency control
 */
async function downloadBatch(songs) {
  const results = []

  for (let i = 0; i < songs.length; i += CONCURRENT_DOWNLOADS) {
    const batch = songs.slice(i, i + CONCURRENT_DOWNLOADS)
    const batchNumber = Math.floor(i / CONCURRENT_DOWNLOADS) + 1
    const totalBatches = Math.ceil(songs.length / CONCURRENT_DOWNLOADS)

    log(`\n${'='.repeat(60)}`, 'blue')
    log(`📦 Batch ${batchNumber}/${totalBatches} (Songs ${i + 1}-${Math.min(i + CONCURRENT_DOWNLOADS, songs.length)})`, 'bright')
    log(`${'='.repeat(60)}\n`, 'blue')

    const batchPromises = batch.map(song => downloadSong(song))
    const batchResults = await Promise.all(batchPromises)

    results.push(...batch.map((song, idx) => ({
      ...song,
      downloadResult: batchResults[idx]
    })))

    // Show progress
    const completed = results.filter(r => r.downloadResult.success).length
    const failed = results.filter(r => !r.downloadResult.success && !r.downloadResult.skipped).length
    const skipped = results.filter(r => r.downloadResult.skipped).length

    log(`\n📊 Progress: ${completed} ✅ | ${failed} ❌ | ${skipped} ⏭️  | ${results.length}/${songs.length} total\n`, 'blue')
  }

  return results
}

/**
 * Generate download report
 */
function generateReport(results) {
  const successful = results.filter(r => r.downloadResult.success && !r.downloadResult.skipped)
  const skipped = results.filter(r => r.downloadResult.skipped)
  const failed = results.filter(r => !r.downloadResult.success)

  const totalSize = successful.reduce((sum, r) => sum + (r.downloadResult.size || 0), 0)
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2)

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      successful: successful.length,
      skipped: skipped.length,
      failed: failed.length,
      totalSizeMB,
      quality: `${AUDIO_QUALITY} kbps MP3`
    },
    successful: successful.map(r => ({
      id: r.id,
      title: r.title,
      artist: r.artist,
      sizeMB: r.downloadResult.sizeMB
    })),
    failed: failed.map(r => ({
      id: r.id,
      title: r.title,
      artist: r.artist,
      error: r.downloadResult.error,
      attempts: r.downloadResult.attempts
    }))
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))

  log(`\n${'='.repeat(60)}`, 'bright')
  log('📊 DOWNLOAD REPORT', 'bright')
  log(`${'='.repeat(60)}\n`, 'bright')
  log(`Total Songs:      ${report.summary.total}`, 'blue')
  log(`✅ Successful:     ${report.summary.successful}`, 'green')
  log(`⏭️  Skipped:        ${report.summary.skipped}`, 'yellow')
  log(`❌ Failed:         ${report.summary.failed}`, 'red')
  log(`💾 Total Size:     ${report.summary.totalSizeMB} MB`, 'cyan')
  log(`🎵 Quality:        ${report.summary.quality}`, 'cyan')
  log(`\n📄 Full report: ${REPORT_PATH}\n`, 'blue')

  return report
}

/**
 * Main function
 */
async function main() {
  log('\n╔══════════════════════════════════════════════════════╗', 'bright')
  log('║     🎵  mxster Audio Download Manager  🎵           ║', 'bright')
  log('╚══════════════════════════════════════════════════════╝\n', 'bright')

  // Check yt-dlp installation
  log('🔍 Checking yt-dlp installation...', 'cyan')
  const hasYtDlp = await checkYtDlp()

  if (!hasYtDlp) {
    log('\n❌ yt-dlp not found!', 'red')
    log('\n📦 Install via:', 'yellow')
    log('   pip install yt-dlp', 'yellow')
    log('   OR', 'yellow')
    log('   npm install -g yt-dlp\n', 'yellow')
    process.exit(1)
  }

  log('✅ yt-dlp found\n', 'green')

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    log(`✅ Created output directory: ${OUTPUT_DIR}\n`, 'green')
  }

  // Load songs.json
  log('📚 Loading songs.json...', 'cyan')
  const songs = JSON.parse(fs.readFileSync(SONGS_JSON_PATH, 'utf-8'))
  log(`✅ Loaded ${songs.length} songs\n`, 'green')

  // Apply limit if specified
  const songsToDownload = limit ? songs.slice(0, limit) : songs

  if (limit) {
    log(`⚠️  LIMIT MODE: Downloading first ${limit} songs only\n`, 'yellow')
  }

  if (resume) {
    log(`⚠️  RESUME MODE: Skipping already downloaded songs\n`, 'yellow')
  }

  // Confirm before starting
  log(`📥 Ready to download ${songsToDownload.length} songs (${AUDIO_QUALITY} kbps MP3)`, 'cyan')
  log(`📂 Output: ${OUTPUT_DIR}`, 'cyan')
  log(`🔄 Concurrency: ${CONCURRENT_DOWNLOADS} parallel downloads`, 'cyan')
  log(`🔁 Max retries: ${MAX_RETRIES} per song\n`, 'cyan')

  // Start download
  const startTime = Date.now()
  const results = await downloadBatch(songsToDownload)
  const endTime = Date.now()
  const durationMinutes = ((endTime - startTime) / 1000 / 60).toFixed(2)

  // Generate report
  const report = generateReport(results)

  log(`⏱️  Total time: ${durationMinutes} minutes\n`, 'cyan')

  // Show next steps
  if (report.summary.successful > 0) {
    log('🎉 Download complete!', 'green')
    log('\n📋 Next steps:', 'bright')
    log('   1. Upload to VPS:     node scripts/audio-hosting/upload-to-vps.js', 'cyan')
    log('   2. Update URLs:       node scripts/audio-hosting/update-song-urls.js', 'cyan')
    log('   3. Validate:          node scripts/audio-hosting/validate-audio.js\n', 'cyan')
  }

  if (report.summary.failed > 0) {
    log('⚠️  Some downloads failed. Check the report for details.', 'yellow')
    log('   Run with --resume to retry failed songs.\n', 'yellow')
  }
}

// Run main function
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red')
  console.error(error)
  process.exit(1)
})
