import spotifyAuth from './spotifyAuth.js'

class SpotifyPlayer {
  constructor() {
    this.player = null
    this.deviceId = null
    this.isReady = false
    this.currentTrackUri = null
    this.accessToken = null
  }

  // Hole aktuelles Token (mit automatischem Refresh falls nötig)
  async getCurrentToken() {
    // Prüfe ob Token noch gültig ist
    const isValid = await spotifyAuth.isLoggedIn()
    if (!isValid) {
      console.error('❌ Token ungültig und konnte nicht refreshed werden')
      return null
    }
    // Hole frisches Token
    return spotifyAuth.getAccessToken()
  }

  // Initialisiere Spotify Web Playback SDK
  async initialize(accessToken) {
    this.accessToken = accessToken
    return new Promise((resolve, reject) => {
      // Lade Spotify SDK Script
      if (!window.Spotify) {
        const script = document.createElement('script')
        script.src = 'https://sdk.scdn.co/spotify-player.js'
        script.async = true
        document.body.appendChild(script)

        // SDK Ready Callback
        window.onSpotifyWebPlaybackSDKReady = () => {
          this.createPlayer(accessToken, resolve, reject)
        }
      } else {
        this.createPlayer(accessToken, resolve, reject)
      }
    })
  }

  // Erstelle Player Instance
  createPlayer(accessToken, resolve, reject) {
    console.log('🎵 Erstelle Spotify Player...')

    this.player = new window.Spotify.Player({
      name: 'mxster Game Player',
      getOAuthToken: async cb => {
        // Hole immer das aktuelle Token von spotifyAuth
        // Falls Token abgelaufen, wird es automatisch refreshed
        const token = await this.getCurrentToken()
        cb(token)
      },
      volume: 0.8
    })

    // Fehlerbehandlung
    this.player.addListener('initialization_error', ({ message }) => {
      console.error('❌ Initialization Error:', message)
      reject(new Error(message))
    })

    this.player.addListener('authentication_error', ({ message }) => {
      console.error('❌ Authentication Error:', message)
      reject(new Error(message))
    })

    this.player.addListener('account_error', ({ message }) => {
      console.error('❌ Account Error:', message)
      console.error('⚠️  Spotify Premium wird benötigt!')
      reject(new Error('Spotify Premium Account erforderlich'))
    })

    this.player.addListener('playback_error', ({ message }) => {
      console.error('❌ Playback Error:', message)
    })

    // Player Ready
    this.player.addListener('ready', ({ device_id }) => {
      console.log('✅ Spotify Player Ready! Device ID:', device_id)
      this.deviceId = device_id
      this.isReady = true
      resolve(device_id)
    })

    // Player Not Ready
    this.player.addListener('not_ready', ({ device_id }) => {
      console.log('⚠️  Device ID has gone offline:', device_id)
      this.isReady = false
    })

    // Player State Changed
    this.player.addListener('player_state_changed', state => {
      if (!state) return

      console.log('🎵 Player State:', {
        paused: state.paused,
        position: state.position,
        duration: state.duration,
        track: state.track_window.current_track.name
      })

      // Notify beat animator of state changes
      if (window.beatAnimator) {
        const trackId = state.track_window.current_track.id

        // Track changed
        if (this.currentTrackId !== trackId) {
          console.log('🔄 Track changed, loading beat analysis...')
          this.currentTrackId = trackId

          // Load new track analysis for beat sync
          if (window.game && window.game.beatSyncEnabled) {
            this.getCurrentToken().then(token => {
              if (token) {
                window.beatAnimator.loadTrackAnalysis(trackId, token).then(() => {
                  if (!state.paused) {
                    window.beatAnimator.start(state.position)
                  }
                })
              }
            })
          }
        }

        // Pause/Resume beat sync
        if (state.paused) {
          window.beatAnimator.pause()
        } else {
          // Update position for sync
          window.beatAnimator.updatePosition(state.position)
        }
      }
    })

    // Verbinde Player
    this.player.connect().then(success => {
      if (success) {
        console.log('✅ Player erfolgreich verbunden')
      } else {
        reject(new Error('Player konnte nicht verbunden werden'))
      }
    })
  }

  // Spiele Track ab
  async playTrack(trackUri, accessToken = null) {
    if (!this.isReady || !this.deviceId) {
      console.error('❌ Player nicht bereit')
      return false
    }

    try {
      console.log('▶️ Spiele Track:', trackUri)

      // Verwende aktuelles Token falls keins übergeben wurde
      const token = accessToken || await this.getCurrentToken()
      if (!token) {
        console.error('❌ Kein gültiges Token verfügbar')
        return false
      }

      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: [trackUri]
        })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ Playback Error:', error)
        return false
      }

      this.currentTrackUri = trackUri
      return true
    } catch (error) {
      console.error('❌ Play Track Failed:', error)
      return false
    }
  }

  // Pause
  async pause() {
    if (!this.player) return
    await this.player.pause()
  }

  // Resume
  async resume() {
    if (!this.player) return
    await this.player.resume()
  }

  // Toggle Play/Pause
  async togglePlay() {
    if (!this.player) return
    await this.player.togglePlay()
  }

  // Seek to position (ms)
  async seek(positionMs) {
    if (!this.player) return
    await this.player.seek(positionMs)
  }

  // Get current state
  async getState() {
    if (!this.player) return null
    return await this.player.getCurrentState()
  }

  // Disconnect Player
  disconnect() {
    if (this.player) {
      this.player.disconnect()
      this.player = null
      this.isReady = false
      this.deviceId = null
      console.log('🔌 Player disconnected')
    }
  }
}

export default new SpotifyPlayer()
