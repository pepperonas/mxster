import spotifyAuth from './spotifyAuth'

/**
 * Spotify SDK Player State
 */
interface SpotifyPlayerState {
  paused: boolean
  position: number
  duration: number
  track_window: {
    current_track: {
      id: string
      name: string
      uri: string
    }
  }
}

/**
 * Spotify Player Error
 */
interface SpotifyPlayerError {
  message: string
}

/**
 * Spotify Player Device
 */
interface SpotifyPlayerDevice {
  device_id: string
}

/**
 * Spotify Web Playback SDK Player
 */
interface SpotifyWebPlaybackPlayer {
  connect(): Promise<boolean>
  disconnect(): void
  addListener(event: string, callback: (data: any) => void): void
  pause(): Promise<void>
  resume(): Promise<void>
  togglePlay(): Promise<void>
  seek(positionMs: number): Promise<void>
  getCurrentState(): Promise<SpotifyPlayerState | null>
}

/**
 * Spotify SDK
 */
interface SpotifySDK {
  Player: new (config: {
    name: string
    getOAuthToken: (cb: (token: string | null) => void) => void
    volume: number
  }) => SpotifyWebPlaybackPlayer
}

// Extend Window interface for Spotify SDK
declare global {
  interface Window {
    Spotify?: SpotifySDK
    onSpotifyWebPlaybackSDKReady?: () => void
  }
}

class SpotifyPlayer {
  private player: SpotifyWebPlaybackPlayer | null = null
  private deviceId: string | null = null
  private isReady: boolean = false
  private currentTrackUri: string | null = null
  private currentTrackId: string | null = null
  private accessToken: string | null = null

  /**
   * Get current token (with automatic refresh if needed)
   */
  async getCurrentToken(): Promise<string | null> {
    // Check if token is still valid
    const isValid = await spotifyAuth.isLoggedIn()
    if (!isValid) {
      console.error('❌ Token ungültig und konnte nicht refreshed werden')
      return null
    }
    // Get fresh token
    return spotifyAuth.getAccessToken()
  }

  /**
   * Initialize Spotify Web Playback SDK
   */
  async initialize(accessToken: string): Promise<string> {
    this.accessToken = accessToken
    return new Promise((resolve, reject) => {
      // Load Spotify SDK Script
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

  /**
   * Create Player Instance
   */
  private createPlayer(
    accessToken: string,
    resolve: (value: string) => void,
    reject: (reason?: any) => void
  ): void {
    console.log('🎵 Erstelle Spotify Player...')

    if (!window.Spotify) {
      reject(new Error('Spotify SDK not loaded'))
      return
    }

    this.player = new window.Spotify.Player({
      name: 'mxster Game Player',
      getOAuthToken: async cb => {
        // Always get current token from spotifyAuth
        // If token expired, it will be refreshed automatically
        const token = await this.getCurrentToken()
        cb(token)
      },
      volume: 0.8
    })

    // Error handling
    this.player.addListener('initialization_error', ({ message }: SpotifyPlayerError) => {
      console.error('❌ Initialization Error:', message)
      reject(new Error(message))
    })

    this.player.addListener('authentication_error', ({ message }: SpotifyPlayerError) => {
      console.error('❌ Authentication Error:', message)
      reject(new Error(message))
    })

    this.player.addListener('account_error', ({ message }: SpotifyPlayerError) => {
      console.error('❌ Account Error:', message)
      console.error('⚠️  Spotify Premium wird benötigt!')
      reject(new Error('Spotify Premium Account erforderlich'))
    })

    this.player.addListener('playback_error', ({ message }: SpotifyPlayerError) => {
      console.error('❌ Playback Error:', message)
    })

    // Player Ready
    this.player.addListener('ready', ({ device_id }: SpotifyPlayerDevice) => {
      console.log('✅ Spotify Player Ready! Device ID:', device_id)
      this.deviceId = device_id
      this.isReady = true
      resolve(device_id)
    })

    // Player Not Ready
    this.player.addListener('not_ready', ({ device_id }: SpotifyPlayerDevice) => {
      console.log('⚠️  Device ID has gone offline:', device_id)
      this.isReady = false
    })

    // Player State Changed
    this.player.addListener('player_state_changed', (state: SpotifyPlayerState | null) => {
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
              if (token && window.beatAnimator) {
                window.beatAnimator.loadTrackAnalysis(trackId, token).then(() => {
                  if (!state.paused) {
                    window.beatAnimator!.start(state.position)
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

    // Connect Player
    this.player.connect().then(success => {
      if (success) {
        console.log('✅ Player erfolgreich verbunden')
      } else {
        reject(new Error('Player konnte nicht verbunden werden'))
      }
    })
  }

  /**
   * Play Track
   */
  async playTrack(trackUri: string, accessToken: string | null = null): Promise<boolean> {
    if (!this.isReady || !this.deviceId) {
      console.error('❌ Player nicht bereit')
      return false
    }

    try {
      console.log('▶️ Spiele Track:', trackUri)

      // Use current token if none provided
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

  /**
   * Play Track with start position (optimized for immediate start)
   */
  async playTrackWithPosition(
    trackUri: string,
    positionMs: number,
    accessToken: string | null = null
  ): Promise<boolean> {
    if (!this.isReady || !this.deviceId) {
      console.error('❌ Player nicht bereit')
      return false
    }

    try {
      console.log('▶️ Spiele Track mit Position:', trackUri, 'Position:', positionMs)

      // Use current token if none provided
      const token = accessToken || await this.getCurrentToken()
      if (!token) {
        console.error('❌ Kein gültiges Token verfügbar')
        return false
      }

      // Play track directly with start position
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: [trackUri],
          position_ms: positionMs
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

  /**
   * Pause
   */
  async pause(): Promise<void> {
    if (!this.player) return
    await this.player.pause()
  }

  /**
   * Resume
   */
  async resume(): Promise<void> {
    if (!this.player) return
    await this.player.resume()
  }

  /**
   * Toggle Play/Pause
   */
  async togglePlay(): Promise<void> {
    if (!this.player) return
    await this.player.togglePlay()
  }

  /**
   * Seek to position (ms)
   */
  async seek(positionMs: number): Promise<void> {
    if (!this.player) return
    await this.player.seek(positionMs)
  }

  /**
   * Get current state
   */
  async getState(): Promise<SpotifyPlayerState | null> {
    if (!this.player) return null
    return await this.player.getCurrentState()
  }

  /**
   * Get track duration from Spotify API
   */
  async getTrackDuration(trackId: string, accessToken: string | null = null): Promise<number | null> {
    try {
      const token = accessToken || await this.getCurrentToken()
      if (!token) {
        console.error('❌ Kein gültiges Token verfügbar')
        return null
      }

      const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        console.error('❌ Track Info Error:', response.status)
        return null
      }

      const data = await response.json()
      return data.duration_ms
    } catch (error) {
      console.error('❌ Get Track Duration Failed:', error)
      return null
    }
  }

  /**
   * Disconnect Player
   */
  disconnect(): void {
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
