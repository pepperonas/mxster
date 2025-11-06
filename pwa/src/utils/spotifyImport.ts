/**
 * Spotify Playlist Importer
 *
 * @deprecated This file is only used in Node.js build scripts, not in the browser.
 * Should be moved to /scripts directory. Node.js imports (fs, path, Buffer) are intentional.
 */

// @ts-ignore - Node.js imports for build scripts only
import axios from 'axios'
// @ts-ignore - Node.js imports for build scripts only
import fs from 'fs'
// @ts-ignore - Node.js imports for build scripts only
import path from 'path'

class SpotifyImporter {
  private clientId: string
  private clientSecret: string
  private accessToken: string | null

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.accessToken = null
  }

  async authenticate() {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')

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
      this.accessToken = response.data.access_token
      console.log('✅ Spotify authentifiziert')
      return true
    } catch (error: any) {
      console.error('❌ Authentifizierung fehlgeschlagen:', error.message)
      return false
    }
  }

  async getPlaylistTracks(playlistId: string) {
    if (!this.accessToken) {
      await this.authenticate()
    }

    try {
      const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      const tracks = response.data.items.map((item: any, index: number) => {
        const track = item.track
        return {
          id: `song_${String(index + 1).padStart(3, '0')}`,
          title: track.name,
          artist: track.artists[0].name,
          year: new Date(track.album.release_date).getFullYear(),
          previewUrl: track.preview_url,
          spotifyId: track.id,
          albumCover: track.album.images[0]?.url
        }
      })

      console.log(`✅ ${tracks.length} Songs von Playlist geladen`)
      return tracks
    } catch (error: any) {
      console.error('❌ Fehler beim Laden der Playlist:', error.message)
      return []
    }
  }

  async searchTrack(title: string, artist: string) {
    if (!this.accessToken) {
      await this.authenticate()
    }

    try {
      const query = encodeURIComponent(`track:${title} artist:${artist}`)
      const response = await axios.get(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      if (response.data.tracks.items.length > 0) {
        const track = response.data.tracks.items[0]
        return {
          title: track.name,
          artist: track.artists[0].name,
          year: new Date(track.album.release_date).getFullYear(),
          previewUrl: track.preview_url,
          spotifyId: track.id,
          albumCover: track.album.images[0]?.url
        }
      }
      return null
    } catch (error: any) {
      console.error('❌ Suche fehlgeschlagen:', error.message)
      return null
    }
  }

  saveSongsToFile(songs: any[], outputPath: string) {
    const songsJs = `export const songs = ${JSON.stringify(songs, null, 2)}`
    fs.writeFileSync(outputPath, songsJs, 'utf-8')
    console.log(`✅ Songs gespeichert in: ${outputPath}`)
  }
}

// CLI Usage
async function main() {
  // Config laden
  let config
  try {
    // @ts-ignore - Dynamic import for build script
    const configModule = await import('../../../spotify.config.js')
    config = configModule.default
  } catch (error: any) {
    console.error('❌ spotify.config.js nicht gefunden')
    process.exit(1)
  }

  const importer = new SpotifyImporter(config.clientId, config.clientSecret)

  if (config.playlistId) {
    console.log('📥 Importiere Playlist...')
    const songs = await importer.getPlaylistTracks(config.playlistId)

    if (songs.length > 0) {
      const outputPath = path.join(process.cwd(), 'src', 'data', 'songs.ts')
      importer.saveSongsToFile(songs, outputPath)

      // Auch als JSON für QR-Code Generator speichern
      const jsonPath = path.join(process.cwd(), '..', 'docs', 'songs.json')
      fs.writeFileSync(jsonPath, JSON.stringify(songs, null, 2))
      console.log(`✅ Songs auch gespeichert als JSON: ${jsonPath}`)
    }
  } else {
    console.log('ℹ️  Keine Playlist-ID konfiguriert')
    console.log('Füge in spotify.config.js eine playlistId hinzu und starte erneut')
  }
}

// Nur ausführen wenn direkt aufgerufen
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export default SpotifyImporter
