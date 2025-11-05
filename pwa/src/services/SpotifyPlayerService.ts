/**
 * Spotify Web Playback SDK Service
 * Handles Spotify player initialization, track playback, and state management
 */

import { SpotifyAuthService } from './SpotifyAuthService'
import type { SpotifyPlayer } from '@/types/spotify'

// ============================================================================
// Types
// ============================================================================

export interface SpotifyPlayerState {
  paused: boolean
  position: number
  duration: number
  track_window: {
    current_track: {
      id: string
      name: string
      uri: string
      artists: Array<{ name: string }>
      album: { name: string; images: Array<{ url: string }> }
    }
  }
}

export interface PlaybackError {
  message: string
}

// Extend beatAnimator to Window (Spotify types are in @/types/spotify.ts)
declare global {
  interface Window {
    beatAnimator?: {
      loadTrackAnalysis: (trackId: string, token: string) => Promise<void>
      start: (position: number) => void
      pause: () => void
      updatePosition: (position: number) => void
    }
  }
}

// ============================================================================
// Spotify Player Service
// ============================================================================

class SpotifyPlayerServiceClass {
  private player: SpotifyPlayer | null = null
  private deviceId: string | null = null
  private isReady: boolean = false
  private currentTrackUri: string | null = null
  private currentTrackId: string | null = null
  private accessToken: string | null = null
  private stateChangeCallbacks: Array<(state: SpotifyPlayerState) => void> = []

  // Public callback properties for MusicPlayerService
  public onStateChange?: (state: 'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'error') => void
  public onProgress?: (progress: number) => void
  public onEnd?: () => void
  public onError?: (error: string) => void

  /**
   * Get current access token (with automatic refresh if needed)
   */
  private async getCurrentToken(): Promise<string | null> {
    // Check if token is still valid
    const tokens = this.getStoredTokens()
    if (!tokens || !tokens.accessToken) {
      console.error('❌ No tokens available')
      return null
    }

    // Check if token needs refresh
    if (SpotifyAuthService.needsRefresh(tokens.expiresAt)) {
      console.log('🔄 Token expiring soon, refreshing...')
      const refreshed = await SpotifyAuthService.refreshAccessToken(tokens.refreshToken)
      if (refreshed) {
        this.saveTokens(refreshed)
        return refreshed.accessToken
      }
      console.error('❌ Token refresh failed')
      return null
    }

    return tokens.accessToken
  }

  /**
   * Get stored tokens from localStorage
   * Uses the same storage key as AuthContext for consistency
   */
  private getStoredTokens() {
    try {
      const stored = localStorage.getItem('spotify_auth_tokens')
      if (!stored) {
        console.log('⚠️ No tokens found in localStorage')
        return null
      }

      const tokens = JSON.parse(stored)

      if (!tokens.accessToken || !tokens.expiresAt) {
        console.error('❌ Invalid token structure')
        return null
      }

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || '',
        expiresAt: tokens.expiresAt
      }
    } catch (error) {
      console.error('❌ Error loading tokens:', error)
      return null
    }
  }

  /**
   * Save tokens to localStorage
   * Uses the same storage key as AuthContext for consistency
   */
  private saveTokens(tokens: { accessToken: string; refreshToken: string; expiresAt: number }) {
    try {
      const tokenData = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        tokenType: 'Bearer',
        scope: ''
      }
      localStorage.setItem('spotify_auth_tokens', JSON.stringify(tokenData))
      console.log('💾 Tokens saved to localStorage')
    } catch (error) {
      console.error('❌ Error saving tokens:', error)
    }
  }

  /**
   * Initialize Spotify Web Playback SDK
   */
  async initialize(accessToken: string): Promise<string> {
    this.accessToken = accessToken

    return new Promise((resolve, reject) => {
      // Load Spotify SDK script if not already loaded
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
    resolve: (deviceId: string) => void,
    reject: (error: Error) => void
  ) {
    console.log('🎵 Creating Spotify Player...')

    if (!window.Spotify) {
      reject(new Error('Spotify SDK not loaded'))
      return
    }

    this.player = new window.Spotify.Player({
      name: 'mxster Game Player',
      getOAuthToken: async (cb) => {
        const token = await this.getCurrentToken()
        cb(token || '')
      },
      volume: 0.8
    })

    // Error Handlers
    this.player.addListener('initialization_error', ({ message }: PlaybackError) => {
      console.error('❌ Initialization Error:', message)
      reject(new Error(message))
    })

    this.player.addListener('authentication_error', ({ message }: PlaybackError) => {
      console.error('❌ Authentication Error:', message)
      reject(new Error(message))
    })

    this.player.addListener('account_error', ({ message }: PlaybackError) => {
      console.error('❌ Account Error:', message)
      console.error('⚠️ Spotify Premium required!')
      reject(new Error('Spotify Premium Account required'))
    })

    this.player.addListener('playback_error', ({ message }: PlaybackError) => {
      console.error('❌ Playback Error:', message)
    })

    // Player Ready
    this.player.addListener('ready', ({ device_id }: { device_id: string }) => {
      console.log('✅ Spotify Player Ready! Device ID:', device_id)
      this.deviceId = device_id
      this.isReady = true
      resolve(device_id)
    })

    // Player Not Ready
    this.player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
      console.log('⚠️ Device ID has gone offline:', device_id)
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

      // Notify registered callbacks
      this.stateChangeCallbacks.forEach((callback) => callback(state))

      // Notify beat animator of state changes
      if (window.beatAnimator) {
        const trackId = state.track_window.current_track.id

        // Track changed
        if (this.currentTrackId !== trackId) {
          console.log('🔄 Track changed, loading beat analysis...')
          this.currentTrackId = trackId

          // Load new track analysis for beat sync
          this.getCurrentToken().then((token) => {
            if (token) {
              window.beatAnimator!.loadTrackAnalysis(trackId, token).then(() => {
                if (!state.paused) {
                  window.beatAnimator!.start(state.position)
                }
              })
            }
          })
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
    this.player.connect().then((success) => {
      if (success) {
        console.log('✅ Player successfully connected')
      } else {
        reject(new Error('Player could not be connected'))
      }
    })
  }

  /**
   * Transfer playback to this device
   */
  private async transferPlayback(token: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_ids: [this.deviceId],
          play: false
        })
      })

      if (!response.ok && response.status !== 204) {
        console.warn('⚠️ Device transfer failed, but continuing...')
        return false
      }

      console.log('✅ Playback transferred to device')
      return true
    } catch (error) {
      console.warn('⚠️ Device transfer error:', error)
      return false
    }
  }

  /**
   * Play song by Spotify ID (convenience method for MusicPlayerService)
   * @param spotifyId Spotify track ID (without "spotify:track:" prefix)
   * @param startPosition Start position in seconds (optional)
   */
  async play(spotifyId: string, startPosition: number = 0): Promise<void> {
    const trackUri = `spotify:track:${spotifyId}`

    // Notify loading state
    this.onStateChange?.('loading')

    if (startPosition > 0) {
      const success = await this.playTrackWithPosition(trackUri, startPosition * 1000)
      if (!success) {
        this.onError?.('Failed to play track')
        throw new Error('Playback failed')
      }
    } else {
      const success = await this.playTrack(trackUri)
      if (!success) {
        this.onError?.('Failed to play track')
        throw new Error('Playback failed')
      }
    }

    // Notify playing state
    this.onStateChange?.('playing')
  }

  /**
   * Play Track
   */
  async playTrack(trackUri: string, accessToken?: string): Promise<boolean> {
    if (!this.isReady || !this.deviceId) {
      console.error('❌ Player not ready')
      return false
    }

    try {
      console.log('▶️ Playing Track:', trackUri)

      const token = accessToken || (await this.getCurrentToken())
      if (!token) {
        console.error('❌ No valid token available')
        return false
      }

      // First, try to transfer playback to our device
      await this.transferPlayback(token)

      // Small delay to let transfer complete
      await new Promise(resolve => setTimeout(resolve, 500))

      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: [trackUri]
          })
        }
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }))
        console.error('❌ Playback Error:', error)

        // If 404, device might not be available - suggest user to check Premium status
        if (response.status === 404) {
          console.error('❌ Device not found. Please ensure you have Spotify Premium and the device is available.')
        }

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
   * Play Track with Start Position
   */
  async playTrackWithPosition(
    trackUri: string,
    positionMs: number,
    accessToken?: string
  ): Promise<boolean> {
    if (!this.isReady || !this.deviceId) {
      console.error('❌ Player not ready')
      return false
    }

    try {
      console.log('▶️ Playing Track with Position:', trackUri, 'Position:', positionMs)

      const token = accessToken || (await this.getCurrentToken())
      if (!token) {
        console.error('❌ No valid token available')
        return false
      }

      // Transfer playback to our device
      await this.transferPlayback(token)

      // Small delay to let transfer complete
      await new Promise(resolve => setTimeout(resolve, 500))

      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: [trackUri],
            position_ms: positionMs
          })
        }
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }))
        console.error('❌ Playback Error:', error)

        if (response.status === 404) {
          console.error('❌ Device not found. Please ensure you have Spotify Premium and the device is available.')
        }

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
   * Pause playback
   */
  async pause() {
    if (!this.player) return
    await this.player.pause()
    this.onStateChange?.('paused')
  }

  /**
   * Resume playback
   */
  async resume() {
    if (!this.player) return
    await this.player.resume()
    this.onStateChange?.('playing')
  }

  /**
   * Stop playback
   */
  stop() {
    if (!this.player) return
    this.player.pause()
    this.onStateChange?.('stopped')
  }

  /**
   * Toggle Play/Pause
   */
  async togglePlay() {
    if (!this.player) return
    await this.player.togglePlay()
  }

  /**
   * Seek to position (seconds) - MusicPlayerService compatible
   */
  seek(positionSeconds: number) {
    if (!this.player) return
    this.player.seek(positionSeconds * 1000)
  }

  /**
   * Get current playback position in seconds
   */
  getCurrentTime(): number {
    // Not available directly from SDK, return 0 for now
    // Position tracking would require polling getCurrentState()
    return 0
  }

  /**
   * Get duration in seconds
   */
  getDuration(): number {
    // Duration would need to be fetched from track info
    // Return estimated 3.5 minutes (210s) as default
    return 210
  }

  /**
   * Get current playback state (compatible with PreviewPlayer)
   */
  getState(): 'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'error' {
    if (!this.isReady) return 'idle'
    // This is simplified - full state would require polling getCurrentState()
    return 'playing'
  }

  /**
   * Get current playback state (original Spotify format)
   */
  async getSpotifyState(): Promise<SpotifyPlayerState | null> {
    if (!this.player) return null
    return await this.player.getCurrentState()
  }

  /**
   * Check if currently playing
   */
  isPlaying(): boolean {
    return this.isReady && this.currentTrackUri !== null
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  async setVolume(volume: number) {
    if (!this.player) return
    await this.player.setVolume(volume)
  }

  /**
   * Get current volume (estimated)
   */
  getVolume(): number {
    // Volume is set in player initialization to 0.8
    return 0.8
  }

  /**
   * Destroy/cleanup player
   */
  destroy() {
    this.disconnect()
  }

  /**
   * Get track duration from Spotify API
   */
  async getTrackDuration(trackId: string, accessToken?: string): Promise<number | null> {
    try {
      const token = accessToken || (await this.getCurrentToken())
      if (!token) {
        console.error('❌ No valid token available')
        return null
      }

      const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: {
          Authorization: `Bearer ${token}`
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
   * Check if player is ready
   */
  isPlayerReady(): boolean {
    return this.isReady
  }

  /**
   * Get device ID
   */
  getDeviceId(): string | null {
    return this.deviceId
  }

  /**
   * Disconnect Player
   */
  disconnect() {
    if (this.player) {
      this.player.disconnect()
      this.player = null
      this.isReady = false
      this.deviceId = null
      this.stateChangeCallbacks = []
      console.log('🔌 Player disconnected')
    }
  }
}

// Export singleton instance
export const SpotifyPlayerService = new SpotifyPlayerServiceClass()
