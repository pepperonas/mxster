import fs from 'fs'
import axios from 'axios'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Lade Spotify Credentials aus spotify.config.js
async function loadConfig() {
  try {
    const config = await import('./spotify.config.js')
    return config.default
  } catch (error) {
    console.error('❌ Konnte spotify.config.js nicht laden:', error.message)
    process.exit(1)
  }
}

async function getSpotifyToken(clientId, clientSecret) {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )
    return response.data.access_token
  } catch (error) {
    console.error('❌ Spotify Authentifizierung fehlgeschlagen:', error.message)
    return null
  }
}

async function checkPreviewUrl(spotifyId, token) {
  try {
    const response = await axios.get(
      `https://api.spotify.com/v1/tracks/${spotifyId}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )
    return response.data.preview_url
  } catch (error) {
    console.error(`❌ Fehler bei Song ${spotifyId}:`, error.message)
    return null
  }
}

async function filterSongs() {
  console.log('🎵 Song-Bereinigung: Nur Songs mit Preview-URLs behalten\n')

  // Lade Config
  console.log('🔧 Lade Spotify Config...')
  const config = await loadConfig()

  // Lade songs.json
  console.log('🔍 Lade songs.json...')
  const songsPath = path.join(__dirname, '../docs/songs.json')

  if (!fs.existsSync(songsPath)) {
    console.error(`❌ songs.json nicht gefunden: ${songsPath}`)
    process.exit(1)
  }

  const songsData = JSON.parse(fs.readFileSync(songsPath, 'utf8'))

  // Erstelle Backup
  const timestamp = new Date().toISOString().split('T')[0]
  const backupPath = `${songsPath}.backup-${timestamp}`
  fs.writeFileSync(backupPath, JSON.stringify(songsData, null, 2))
  console.log(`💾 Backup erstellt: ${backupPath}`)

  // Hole Spotify Access Token
  console.log('🔑 Authentifiziere mit Spotify...')
  const token = await getSpotifyToken(config.clientId, config.clientSecret)

  if (!token) {
    console.error('❌ Konnte kein Access Token erhalten')
    process.exit(1)
  }

  console.log('✅ Authentifiziert\n')

  const validSongs = []
  const invalidSongs = []
  const noSpotifyId = []

  console.log(`📊 Prüfe ${songsData.length} Songs...\n`)

  for (let i = 0; i < songsData.length; i++) {
    const song = songsData[i]
    console.log(`[${i+1}/${songsData.length}] Prüfe: ${song.artist} - ${song.title}`)

    // Prüfe ob Spotify-ID vorhanden
    if (!song.spotifyId || song.spotifyId === '') {
      noSpotifyId.push(song)
      console.log(`  ⚠️  Keine Spotify-ID → entfernt`)
      continue
    }

    // Prüfe Preview-URL
    const previewUrl = await checkPreviewUrl(song.spotifyId, token)

    if (previewUrl) {
      song.previewUrl = previewUrl
      validSongs.push(song)
      console.log(`  ✅ Preview verfügbar`)
    } else {
      invalidSongs.push(song)
      console.log(`  ❌ Keine Preview verfügbar → entfernt`)
    }

    // Rate limiting - 50ms Pause zwischen Requests
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  console.log(`\n📈 Ergebnis:`)
  console.log(`  ✅ ${validSongs.length} Songs MIT Preview (behalten)`)
  console.log(`  ❌ ${invalidSongs.length} Songs OHNE Preview (entfernt)`)
  console.log(`  ⚠️  ${noSpotifyId.length} Songs OHNE Spotify-ID (entfernt)`)

  // Speichere bereinigte Liste
  fs.writeFileSync(
    songsPath,
    JSON.stringify(validSongs, null, 2)
  )
  console.log(`\n✅ songs.json aktualisiert (${validSongs.length} Songs)`)

  // Speichere entfernte Songs zur Info
  const removedSongs = [...invalidSongs, ...noSpotifyId]
  if (removedSongs.length > 0) {
    const removedPath = path.join(__dirname, '../docs/songs_removed.json')
    fs.writeFileSync(
      removedPath,
      JSON.stringify(removedSongs, null, 2)
    )
    console.log(`📋 Entfernte Songs gespeichert: songs_removed.json`)
  }

  // Aktualisiere PWA songs.js
  const songsJsPath = path.join(__dirname, 'src/data/songs.js')
  fs.writeFileSync(
    songsJsPath,
    `export const songs = ${JSON.stringify(validSongs, null, 2)}\n`
  )
  console.log(`✅ PWA songs.js aktualisiert`)

  console.log(`\n🎉 Fertig! Nächste Schritte:`)
  console.log(`   1. QR-Codes neu generieren: cd ../cards && ./venv/bin/python generate_cards.py ../docs/songs.json`)
  console.log(`   2. PWA neu starten: npm run dev`)
}

filterSongs().catch(error => {
  console.error('❌ Fehler:', error)
  process.exit(1)
})
