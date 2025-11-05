#!/usr/bin/env node
/**
 * Upload Audio Files to VPS
 *
 * Uploads MP3 files from pwa/public/audio/ to VPS via rsync
 * Target: root@mrx3k1.de:/var/www/html/mxster/audio/
 *
 * Usage:
 *   node scripts/audio-hosting/upload-to-vps.js
 *   node scripts/audio-hosting/upload-to-vps.js --dry-run  # Test without uploading
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Configuration
const LOCAL_AUDIO_DIR = path.join(__dirname, '../../pwa/public/audio/')
const VPS_HOST = 'root@mrx3k1.de'
const VPS_AUDIO_DIR = '/var/www/html/mxster/audio/'
const VPS_NGINX_CONF = '/etc/nginx/sites-available/mxster.de'

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
 * Check if local audio directory exists and has files
 */
function checkLocalFiles() {
  if (!fs.existsSync(LOCAL_AUDIO_DIR)) {
    throw new Error(`Local audio directory not found: ${LOCAL_AUDIO_DIR}`)
  }

  const files = fs.readdirSync(LOCAL_AUDIO_DIR).filter(f => f.endsWith('.mp3'))

  if (files.length === 0) {
    throw new Error('No MP3 files found in local audio directory')
  }

  return files
}

/**
 * Get total size of local MP3 files
 */
function getTotalSize(files) {
  let totalSize = 0

  files.forEach(file => {
    const filePath = path.join(LOCAL_AUDIO_DIR, file)
    const stats = fs.statSync(filePath)
    totalSize += stats.size
  })

  return totalSize
}

/**
 * Check SSH connection to VPS
 */
async function checkSSHConnection() {
  try {
    await execAsync(`ssh ${VPS_HOST} "echo 'Connection OK'"`, { timeout: 10000 })
    return true
  } catch (error) {
    return false
  }
}

/**
 * Create audio directory on VPS if it doesn't exist
 */
async function ensureVPSDirectory() {
  log('📂 Ensuring VPS directory exists...', 'cyan')

  try {
    await execAsync(`ssh ${VPS_HOST} "mkdir -p ${VPS_AUDIO_DIR}"`)
    log('✅ VPS directory ready', 'green')
  } catch (error) {
    throw new Error(`Failed to create VPS directory: ${error.message}`)
  }
}

/**
 * Upload files via rsync
 */
async function uploadFiles() {
  log('📤 Uploading files via rsync...', 'cyan')

  const rsyncCommand = `rsync -avz --progress ${dryRun ? '--dry-run' : ''} \\
    ${LOCAL_AUDIO_DIR} \\
    ${VPS_HOST}:${VPS_AUDIO_DIR}`

  log(`\nCommand: ${rsyncCommand}\n`, 'blue')

  try {
    const { stdout, stderr } = await execAsync(rsyncCommand, {
      maxBuffer: 1024 * 1024 * 10 // 10 MB buffer
    })

    if (stdout) {
      console.log(stdout)
    }

    if (stderr && !dryRun) {
      log(`\n⚠️  Warnings: ${stderr}`, 'yellow')
    }

    return true
  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }
}

/**
 * Set correct permissions on VPS
 */
async function setPermissions() {
  log('🔒 Setting file permissions (644)...', 'cyan')

  try {
    await execAsync(`ssh ${VPS_HOST} "chmod 644 ${VPS_AUDIO_DIR}*.mp3"`)
    log('✅ Permissions set', 'green')
  } catch (error) {
    log(`⚠️  Warning: Could not set permissions: ${error.message}`, 'yellow')
  }
}

/**
 * Check nginx configuration for /audio/ location
 */
async function checkNginxConfig() {
  log('🌐 Checking nginx configuration...', 'cyan')

  try {
    const { stdout } = await execAsync(
      `ssh ${VPS_HOST} "grep -A 5 'location /audio/' ${VPS_NGINX_CONF} || echo 'NOT_FOUND'"`
    )

    if (stdout.includes('NOT_FOUND')) {
      log('⚠️  nginx /audio/ location not configured!', 'yellow')
      log('\n📝 Add this to your nginx configuration:', 'yellow')
      log('─'.repeat(60), 'yellow')
      log(`
location /audio/ {
    alias /var/www/html/mxster/audio/;
    add_header Cache-Control "public, max-age=31536000";
    add_header Access-Control-Allow-Origin "*";
    add_header Content-Type "audio/mpeg";
}
`, 'cyan')
      log('─'.repeat(60), 'yellow')
      log('Then run: sudo nginx -t && sudo systemctl reload nginx\n', 'yellow')
      return false
    } else {
      log('✅ nginx /audio/ location configured', 'green')
      return true
    }
  } catch (error) {
    log(`⚠️  Could not check nginx config: ${error.message}`, 'yellow')
    return false
  }
}

/**
 * Test if audio files are accessible via HTTPS
 */
async function testHTTPSAccess(sampleFile) {
  log('🌐 Testing HTTPS access...', 'cyan')

  const testUrl = `https://mxster.de/audio/${sampleFile}`

  try {
    await execAsync(`curl -I "${testUrl}" | grep "200 OK"`)
    log(`✅ HTTPS access working: ${testUrl}`, 'green')
    return true
  } catch (error) {
    log(`❌ HTTPS access failed: ${testUrl}`, 'red')
    log('   Check nginx configuration and restart nginx', 'yellow')
    return false
  }
}

/**
 * Main function
 */
async function main() {
  log('\n╔══════════════════════════════════════════════════════╗', 'bright')
  log('║       🚀  mxster Audio Upload Manager  🚀           ║', 'bright')
  log('╚══════════════════════════════════════════════════════╝\n', 'bright')

  if (dryRun) {
    log('⚠️  DRY RUN MODE - No files will be uploaded\n', 'yellow')
  }

  // Step 1: Check local files
  log('📁 Checking local files...', 'cyan')
  const localFiles = checkLocalFiles()
  const totalSize = getTotalSize(localFiles)
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2)

  log(`✅ Found ${localFiles.length} MP3 files (${totalSizeMB} MB)\n`, 'green')

  // Step 2: Check SSH connection
  log('🔌 Checking SSH connection to VPS...', 'cyan')
  const hasSSH = await checkSSHConnection()

  if (!hasSSH) {
    log('❌ Cannot connect to VPS', 'red')
    log('   Make sure you can SSH to root@mrx3k1.de', 'yellow')
    log('   Try: ssh root@mrx3k1.de\n', 'yellow')
    process.exit(1)
  }

  log('✅ SSH connection OK\n', 'green')

  // Step 3: Ensure VPS directory exists
  if (!dryRun) {
    await ensureVPSDirectory()
    log('')
  }

  // Step 4: Upload files
  log('📤 Upload Details:', 'bright')
  log(`   Source:      ${LOCAL_AUDIO_DIR}`, 'blue')
  log(`   Destination: ${VPS_HOST}:${VPS_AUDIO_DIR}`, 'blue')
  log(`   Files:       ${localFiles.length} MP3s`, 'blue')
  log(`   Size:        ${totalSizeMB} MB\n`, 'blue')

  const startTime = Date.now()
  await uploadFiles()
  const endTime = Date.now()
  const durationSeconds = ((endTime - startTime) / 1000).toFixed(2)

  if (dryRun) {
    log('\n✅ Dry run complete - no files were uploaded', 'green')
    log('   Run without --dry-run to perform actual upload\n', 'yellow')
    return
  }

  log(`\n✅ Upload complete in ${durationSeconds} seconds!\n`, 'green')

  // Step 5: Set permissions
  await setPermissions()
  log('')

  // Step 6: Check nginx config
  const nginxConfigured = await checkNginxConfig()
  log('')

  // Step 7: Test HTTPS access (if nginx is configured)
  if (nginxConfigured && localFiles.length > 0) {
    await testHTTPSAccess(localFiles[0])
    log('')
  }

  // Show summary
  log('═'.repeat(60), 'bright')
  log('📊 UPLOAD SUMMARY', 'bright')
  log('═'.repeat(60), 'bright')
  log(`Files uploaded:   ${localFiles.length}`, 'green')
  log(`Total size:       ${totalSizeMB} MB`, 'green')
  log(`Upload time:      ${durationSeconds} seconds`, 'green')
  log(`VPS location:     ${VPS_AUDIO_DIR}`, 'blue')
  log(`Public URL base:  https://mxster.de/audio/`, 'blue')

  // Show next steps
  log('\n📋 Next steps:', 'bright')
  log('   1. Update URLs:  node scripts/audio-hosting/update-song-urls.js', 'cyan')
  log('   2. Validate:     node scripts/audio-hosting/validate-audio.js\n', 'cyan')
}

// Run main function
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red')
  console.error(error)
  process.exit(1)
})
