import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Spotify Credentials
const CLIENT_ID = '8c3134ff3ccf423a8dfdb41320b866f2'
const CLIENT_SECRET = 'cdd5fb120f02417f8c8887c88e84f3fc'

async function getAccessToken() {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token',
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
    console.error('❌ Authentifizierung fehlgeschlagen:', error.message)
    return null
  }
}

async function getTrackPreviewUrl(trackId, accessToken) {
  try {
    const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    return response.data.preview_url
  } catch (error) {
    console.error(`❌ Fehler beim Laden von Track ${trackId}:`, error.message)
    return null
  }
}

async function updateSongs() {
  console.log('🔑 Authentifiziere mit Spotify...')
  const accessToken = await getAccessToken()

  if (!accessToken) {
    console.error('❌ Konnte kein Access Token erhalten')
    return
  }

  console.log('✅ Authentifiziert')

  // Lade aktuelle songs.json
  const songsPath = path.join(__dirname, '../docs/songs.json')
  const songs = JSON.parse(fs.readFileSync(songsPath, 'utf-8'))

  console.log(`\n📥 Lade Preview-URLs für ${songs.length} Songs...\n`)

  for (const song of songs) {
    if (song.spotifyId) {
      const previewUrl = await getTrackPreviewUrl(song.spotifyId, accessToken)
      if (previewUrl) {
        song.previewUrl = previewUrl
        console.log(`✅ ${song.title} - ${song.artist}`)
        console.log(`   ${previewUrl}`)
      } else {
        song.previewUrl = ''
        console.log(`⚠️  ${song.title} - ${song.artist} (kein Preview verfügbar)`)
      }
    }
    // Kurze Pause um Rate Limits zu vermeiden
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // Speichere aktualisierte songs.json
  fs.writeFileSync(songsPath, JSON.stringify(songs, null, 2))
  console.log(`\n✅ songs.json aktualisiert: ${songsPath}`)

  // Aktualisiere auch songs.js für die Web-App
  const songsJsPath = path.join(__dirname, 'src/data/songs.js')
  const songsJs = `export const songs = ${JSON.stringify(songs, null, 2)}\n`
  fs.writeFileSync(songsJsPath, songsJs)
  console.log(`✅ songs.js aktualisiert: ${songsJsPath}`)

  console.log('\n🎉 Fertig! Starte die App neu um die Änderungen zu sehen.')
}

updateSongs()
