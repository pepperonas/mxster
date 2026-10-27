#!/usr/bin/env node

/**
 * Download Single Song Utility
 * Downloads a single song from YouTube and uploads it to VPS (plus covers via
 * uploadFile). Used by add-song.js and exchange-song.js.
 */

import { execSync, execFileSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { AUDIO_DIR, AUDIO_EXT, audioFile, encodeForGame, probeSeconds } from './encode.js'

// Configuration
const VPS_HOST = 'root@69.62.121.168'
const VPS_AUDIO_PATH = '/var/www/html/mxtape/audio'
const SELF_HOSTED_BASE_URL = 'https://mxtape.celox.io/audio'


/**
 * Check if yt-dlp is installed
 */
function checkYtDlp() {
  try {
    execSync('yt-dlp --version', { stdio: 'ignore' })
    return true
  } catch {
    console.error('❌ yt-dlp not found. Please install:')
    console.error('   brew install yt-dlp')
    console.error('   or visit: https://github.com/yt-dlp/yt-dlp')
    return false
  }
}

/**
 * Check if rsync is available
 */
function checkRsync() {
  try {
    execSync('rsync --version', { stdio: 'ignore' })
    return true
  } catch {
    console.error('❌ rsync not found. Please install:')
    console.error('   brew install rsync')
    return false
  }
}

/**
 * Download song from YouTube via yt-dlp (arguments as a list — titles with
 * quotes or apostrophes never reach a shell), then encode it into the game
 * format (encode.js: AAC 96 kbit/s, max 4:00). Overwrites an existing file.
 * @param {Object} song - Song object with id, title, artist
 * @returns {Promise<boolean>} Success status
 */
async function downloadFromYouTube(song) {
  const outputPath = audioFile(song.id)
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mxtape-dl-'))
  const searchQuery = `${song.artist} - ${song.title} audio`

  console.log(`🔍 Searching YouTube: "${searchQuery}"`)

  try {
    fs.mkdirSync(AUDIO_DIR, { recursive: true })
    execFileSync(
      'yt-dlp',
      [
        '--format', 'bestaudio',
        '--output', path.join(tmpDir, 'source.%(ext)s'),
        '--no-playlist',
        '--quiet',
        '--no-warnings',
        `ytsearch1:${searchQuery}`
      ],
      { stdio: 'inherit' }
    )
    const source = fs.readdirSync(tmpDir).find((f) => f.startsWith('source.'))
    if (!source) {
      console.error('❌ Download failed: file not created')
      return false
    }
    // Judge the length of the download, not of the (capped) game file
    const seconds = probeSeconds(path.join(tmpDir, source))
    encodeForGame(path.join(tmpDir, source), outputPath)

    const sizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2)
    console.log(`✅ Downloaded: ${path.basename(outputPath)} (${sizeMB} MB${seconds ? `, original ${formatLength(seconds)}` : ''})`)
    if (seconds && (seconds < 90 || seconds > 600)) {
      console.warn(`⚠️  Unusual length ${formatLength(seconds)} — probably not the original recording. Listen before using it.`)
    }
    return true
  } catch (error) {
    console.error(`❌ Download error: ${error.message}`)
    return false
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

function formatLength(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Upload any local file into the audio folder on the VPS (subdir e.g. 'covers'). */
export function uploadFile(localPath, subdir = '') {
  const remoteDir = subdir ? `${VPS_AUDIO_PATH}/${subdir}` : VPS_AUDIO_PATH
  try {
    execFileSync('ssh', [VPS_HOST, `mkdir -p ${remoteDir}`], { stdio: 'ignore' })
    execFileSync('rsync', ['-az', localPath, `${VPS_HOST}:${remoteDir}/`], { stdio: 'inherit' })
    execFileSync('ssh', [VPS_HOST, `chown www-data:www-data ${remoteDir}/${path.basename(localPath)} && chmod 644 ${remoteDir}/${path.basename(localPath)}`], {
      stdio: 'ignore'
    })
    console.log(`✅ Uploaded: ${subdir ? `${subdir}/` : ''}${path.basename(localPath)}`)
    return true
  } catch (error) {
    console.error(`❌ Upload error: ${error.message}`)
    return false
  }
}

/** Upload the song's audio file to the VPS. */
async function uploadToVPS(song) {
  const localPath = audioFile(song.id)
  if (!fs.existsSync(localPath)) {
    console.error(`❌ Local file not found: ${localPath}`)
    return false
  }
  console.log(`📤 Uploading to VPS: ${path.basename(localPath)}`)
  return uploadFile(localPath)
}

/**
 * Download song from YouTube and upload to VPS
 * Returns self-hosted URL on success, null on failure
 *
 * @param {Object} song - Song object with id, title, artist
 * @returns {Promise<string|null>} Self-hosted URL or null on failure
 */
export async function downloadAndUploadSong(song, { upload = true } = {}) {
  console.log(`\n🎵 Processing audio for: ${song.artist} - ${song.title}`)

  // Check dependencies
  if (!checkYtDlp()) {
    console.error('⚠️  Skipping audio download (yt-dlp not installed)')
    return null
  }

  if (!checkRsync()) {
    console.error('⚠️  Skipping VPS upload (rsync not available)')
    return null
  }

  // Download from YouTube
  const downloadSuccess = await downloadFromYouTube(song)
  if (!downloadSuccess) {
    console.error('⚠️  Download failed')
    return null
  }

  if (!upload) return `${SELF_HOSTED_BASE_URL}/${song.id}.${AUDIO_EXT}`

  // Upload to VPS
  const uploadSuccess = await uploadToVPS(song)
  if (!uploadSuccess) {
    console.error('⚠️  Upload failed')
    return null
  }

  // Return self-hosted URL
  const selfHostedUrl = `${SELF_HOSTED_BASE_URL}/${song.id}.${AUDIO_EXT}`
  console.log(`✅ Self-hosted URL: ${selfHostedUrl}`)
  return selfHostedUrl
}

/**
 * CLI usage (optional - for manual testing)
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSong = {
    id: 'song_999',
    title: 'Billie Jean',
    artist: 'Michael Jackson'
  }

  downloadAndUploadSong(testSong)
    .then(url => {
      console.log('\n' + '='.repeat(60))
      if (url) {
        console.log('✅ Success! Self-hosted URL:', url)
      } else {
        console.log('❌ Failed to download/upload song')
      }
      console.log('='.repeat(60))
    })
    .catch(error => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}
