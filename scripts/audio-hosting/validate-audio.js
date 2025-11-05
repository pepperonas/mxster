#!/usr/bin/env node
/**
 * Validate Audio Files
 *
 * Validates that all audio files are accessible via HTTPS
 * Checks HTTP status, content-type, and file size
 *
 * Usage:
 *   node scripts/audio-hosting/validate-audio.js
 *   node scripts/audio-hosting/validate-audio.js --full  # Check all songs (slow)
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
const VALIDATION_REPORT_PATH = path.join(__dirname, '../../docs/validation-report.json')
const SAMPLE_SIZE = 10 // Quick validation tests N songs
const CONCURRENT_CHECKS = 5

// Parse CLI arguments
const args = process.argv.slice(2)
const fullCheck = args.includes('--full')

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
 * Validate single URL via curl
 */
async function validateURL(url, songId) {
  try {
    // Get headers using curl
    const { stdout } = await execAsync(
      `curl -I -s "${url}" --max-time 10`,
      { timeout: 15000 }
    )

    // Parse response
    const lines = stdout.split('\n')
    const statusLine = lines[0]
    const headers = {}

    lines.forEach(line => {
      const match = line.match(/^([^:]+):\s*(.+)/)
      if (match) {
        headers[match[1].toLowerCase()] = match[2].trim()
      }
    })

    // Check HTTP status (supports both HTTP/1.1 and HTTP/2)
    const statusMatch = statusLine.match(/HTTP\/[\d.]+\s+(\d+)/)
    const statusCode = statusMatch ? parseInt(statusMatch[1]) : 0

    if (statusCode !== 200) {
      return {
        success: false,
        songId,
        url,
        statusCode,
        error: `HTTP ${statusCode}`
      }
    }

    // Check content-type
    const contentType = headers['content-type'] || ''
    if (!contentType.includes('audio') && !contentType.includes('mpeg')) {
      return {
        success: false,
        songId,
        url,
        statusCode,
        contentType,
        error: `Invalid content-type: ${contentType}`
      }
    }

    // Check content-length
    const contentLength = parseInt(headers['content-length'] || '0')
    const sizeMB = (contentLength / 1024 / 1024).toFixed(2)

    // Warn if file is too small (< 1 MB) or too large (> 15 MB)
    let warning = null
    if (contentLength < 1024 * 1024) {
      warning = `File too small: ${sizeMB} MB`
    } else if (contentLength > 15 * 1024 * 1024) {
      warning = `File too large: ${sizeMB} MB`
    }

    return {
      success: true,
      songId,
      url,
      statusCode,
      contentType,
      contentLength,
      sizeMB,
      warning
    }

  } catch (error) {
    return {
      success: false,
      songId,
      url,
      error: error.message
    }
  }
}

/**
 * Validate URLs in batches
 */
async function validateBatch(songsToValidate) {
  const results = []

  for (let i = 0; i < songsToValidate.length; i += CONCURRENT_CHECKS) {
    const batch = songsToValidate.slice(i, i + CONCURRENT_CHECKS)
    const batchNumber = Math.floor(i / CONCURRENT_CHECKS) + 1
    const totalBatches = Math.ceil(songsToValidate.length / CONCURRENT_CHECKS)

    log(`\n📦 Batch ${batchNumber}/${totalBatches} (${i + 1}-${Math.min(i + CONCURRENT_CHECKS, songsToValidate.length)})`, 'blue')

    const batchPromises = batch.map(song => validateURL(song.previewUrl, song.id))
    const batchResults = await Promise.all(batchPromises)

    batchResults.forEach(result => {
      if (result.success) {
        log(`   ✅ ${result.songId}: ${result.sizeMB} MB`, 'green')
        if (result.warning) {
          log(`      ⚠️  ${result.warning}`, 'yellow')
        }
      } else {
        log(`   ❌ ${result.songId}: ${result.error}`, 'red')
      }
    })

    results.push(...batchResults)

    // Show progress
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    log(`   Progress: ${successful} ✅ | ${failed} ❌ | ${results.length}/${songsToValidate.length}`, 'blue')
  }

  return results
}

/**
 * Generate validation report
 */
function generateReport(results, totalSongs) {
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  const withWarnings = results.filter(r => r.success && r.warning)

  const totalSize = successful.reduce((sum, r) => sum + (r.contentLength || 0), 0)
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2)
  const avgSizeMB = successful.length > 0 ? (totalSize / successful.length / 1024 / 1024).toFixed(2) : '0'

  const report = {
    timestamp: new Date().toISOString(),
    fullCheck: fullCheck,
    summary: {
      totalSongs,
      validated: results.length,
      successful: successful.length,
      failed: failed.length,
      warnings: withWarnings.length,
      successRate: `${((successful.length / results.length) * 100).toFixed(1)}%`,
      totalSizeMB,
      avgSizeMB
    },
    successful: successful.map(r => ({
      songId: r.songId,
      url: r.url,
      sizeMB: r.sizeMB,
      warning: r.warning || null
    })),
    failed: failed.map(r => ({
      songId: r.songId,
      url: r.url,
      error: r.error
    })),
    warnings: withWarnings.map(r => ({
      songId: r.songId,
      warning: r.warning
    }))
  }

  fs.writeFileSync(VALIDATION_REPORT_PATH, JSON.stringify(report, null, 2))

  return report
}

/**
 * Main function
 */
async function main() {
  log('\n╔══════════════════════════════════════════════════════╗', 'bright')
  log('║     ✅  mxster Audio Validation Manager  ✅         ║', 'bright')
  log('╚══════════════════════════════════════════════════════╝\n', 'bright')

  // Load songs
  log('📚 Loading songs.json...', 'cyan')
  const songs = JSON.parse(fs.readFileSync(SONGS_JSON_PATH, 'utf-8'))
  const songsWithPreview = songs.filter(s => s.previewUrl && s.previewUrl !== '')

  log(`✅ Loaded ${songs.length} songs`, 'green')
  log(`   ${songsWithPreview.length} have preview URLs\n`, 'blue')

  if (songsWithPreview.length === 0) {
    log('❌ No songs with preview URLs found', 'red')
    log('   Run update-song-urls.js first\n', 'yellow')
    process.exit(1)
  }

  // Determine which songs to validate
  let songsToValidate
  if (fullCheck) {
    songsToValidate = songsWithPreview
    log(`🔍 FULL CHECK: Validating all ${songsToValidate.length} URLs\n`, 'yellow')
  } else {
    songsToValidate = songsWithPreview.slice(0, SAMPLE_SIZE)
    log(`🔍 QUICK CHECK: Validating ${Math.min(SAMPLE_SIZE, songsWithPreview.length)} sample URLs`, 'yellow')
    log(`   Use --full to check all ${songsWithPreview.length} URLs\n`, 'blue')
  }

  // Start validation
  const startTime = Date.now()
  const results = await validateBatch(songsToValidate)
  const endTime = Date.now()
  const durationSeconds = ((endTime - startTime) / 1000).toFixed(2)

  // Generate report
  log('\n═'.repeat(60), 'bright')
  const report = generateReport(results, songs.length)

  log('📊 VALIDATION REPORT', 'bright')
  log('═'.repeat(60), 'bright')
  log(`Total songs:         ${report.summary.totalSongs}`, 'blue')
  log(`Validated:           ${report.summary.validated}`, 'blue')
  log(`✅ Successful:        ${report.summary.successful}`, 'green')
  log(`❌ Failed:            ${report.summary.failed}`, report.summary.failed > 0 ? 'red' : 'green')
  log(`⚠️  Warnings:          ${report.summary.warnings}`, report.summary.warnings > 0 ? 'yellow' : 'green')
  log(`Success rate:        ${report.summary.successRate}`, report.summary.successful === report.summary.validated ? 'green' : 'yellow')
  log(`Total size:          ${report.summary.totalSizeMB} MB`, 'cyan')
  log(`Average size:        ${report.summary.avgSizeMB} MB`, 'cyan')
  log(`Validation time:     ${durationSeconds} seconds`, 'cyan')
  log(`\n📄 Full report: ${VALIDATION_REPORT_PATH}\n`, 'blue')

  // Show failed URLs
  if (report.failed.length > 0) {
    log('❌ Failed URLs:', 'red')
    report.failed.slice(0, 10).forEach(f => {
      log(`   ${f.songId}: ${f.error}`, 'red')
    })
    if (report.failed.length > 10) {
      log(`   ... and ${report.failed.length - 10} more (see report)`, 'red')
    }
    log('')
  }

  // Show warnings
  if (report.warnings.length > 0) {
    log('⚠️  Warnings:', 'yellow')
    report.warnings.slice(0, 5).forEach(w => {
      log(`   ${w.songId}: ${w.warning}`, 'yellow')
    })
    if (report.warnings.length > 5) {
      log(`   ... and ${report.warnings.length - 5} more (see report)`, 'yellow')
    }
    log('')
  }

  // Final verdict
  if (report.summary.failed === 0 && report.summary.warnings === 0) {
    log('🎉 All checks passed! Audio hosting is working correctly.', 'green')
  } else if (report.summary.failed === 0) {
    log('✅ All URLs accessible, but some have warnings.', 'yellow')
  } else {
    log(`⚠️  ${report.summary.failed} URLs are not accessible.`, 'red')
    log('   Check your VPS nginx configuration and file permissions.\n', 'yellow')
  }
}

// Run main function
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red')
  console.error(error)
  process.exit(1)
})
