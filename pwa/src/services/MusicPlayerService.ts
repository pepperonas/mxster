/**
 * Music Player Service (Abstraction Layer)
 * Orchestrates Spotify Premium + Preview fallback
 * Auto-detects best available player and manages playback
 */

import type { Song } from '@/types'
import { SpotifyPlayerService } from './SpotifyPlayerService'
import { PreviewPlayerService, type PlayerState } from './PreviewPlayerService'

export type AudioMode = 'spotify' | 'preview' | 'none'

interface MusicPlayerConfig {
  onStateChange?: (state: PlayerState) => void
  onProgress?: (progress: number) => void
  onEnd?: () => void
  onError?: (error: string) => void
  onModeChange?: (mode: AudioMode) => void
}

export class MusicPlayerService {
  private spotifyPlayer: typeof SpotifyPlayerService | null = null
  private previewPlayer: PreviewPlayerService
  private currentMode: AudioMode = 'none'
  public config: MusicPlayerConfig = {} // Public so MusicPlayer component can set callbacks
  private preferredMode: AudioMode = 'preview' // Default to preview for unlimited users

  constructor(config: MusicPlayerConfig = {}) {
    this.config = config
    this.previewPlayer = new PreviewPlayerService({
      onStateChange: config.onStateChange,
      onProgress: config.onProgress,
      onEnd: config.onEnd,
      onError: config.onError
    })
  }

  /**
   * Initialize Spotify player (Premium mode)
   * Call this after successful Spotify login
   */
  async initializeSpotifyPlayer(accessToken: string): Promise<void> {
    try {
      // Use singleton instance
      this.spotifyPlayer = SpotifyPlayerService
      await this.spotifyPlayer.initialize(accessToken)

      // Set up callbacks
      this.spotifyPlayer.onStateChange = this.config.onStateChange || (() => {})
      this.spotifyPlayer.onProgress = this.config.onProgress || (() => {})
      this.spotifyPlayer.onEnd = this.config.onEnd || (() => {})
      this.spotifyPlayer.onError = this.config.onError || (() => {})

      console.log('✅ Spotify Premium mode initialized')
      this.preferredMode = 'spotify'
      this.setMode('spotify')
    } catch (error) {
      console.error('❌ Failed to initialize Spotify player:', error)
      this.config.onError?.('Failed to initialize Spotify player')

      // Fallback to preview mode
      this.preferredMode = 'preview'
      this.setMode('preview')
    }
  }

  /**
   * Play a song using best available player
   * Auto-fallback: Spotify → Preview
   */
  async play(song: Song, startTime: number = 0): Promise<void> {
    // CRITICAL: Stop any currently playing track first
    console.log('🛑 Stopping current playback before playing new song')
    this.stop()

    // Small delay to ensure stop completes
    await new Promise(resolve => setTimeout(resolve, 100))

    // Try Spotify first if available and preferred
    if (this.preferredMode === 'spotify' && this.spotifyPlayer && song.spotifyId) {
      try {
        await this.spotifyPlayer.play(song.spotifyId, startTime)
        this.setMode('spotify')
        console.log(`▶️ Playing via Spotify: ${song.title}`)
        return
      } catch (error) {
        console.warn('⚠️ Spotify playback failed, falling back to preview:', error)
        // Fall through to preview mode
      }
    }

    // Fallback to preview mode
    if (song.previewUrl) {
      try {
        await this.previewPlayer.play(song, startTime)
        this.setMode('preview')
        console.log(`▶️ Playing via Preview (128 kbps MP3): ${song.title}`)
        return
      } catch (error) {
        console.error('❌ Preview playback failed:', error)
        this.setMode('none')
        this.config.onError?.('No audio available for this song')
        throw error
      }
    } else {
      // No preview URL available
      this.setMode('none')
      this.config.onError?.('No audio available for this song')
      throw new Error(`No audio available for: ${song.title}`)
    }
  }

  /**
   * Pause current playback
   */
  pause(): void {
    if (this.currentMode === 'spotify' && this.spotifyPlayer) {
      this.spotifyPlayer.pause()
    } else if (this.currentMode === 'preview') {
      this.previewPlayer.pause()
    }
  }

  /**
   * Resume playback
   */
  resume(): void {
    if (this.currentMode === 'spotify' && this.spotifyPlayer) {
      this.spotifyPlayer.resume()
    } else if (this.currentMode === 'preview') {
      this.previewPlayer.resume()
    }
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (this.currentMode === 'spotify' && this.spotifyPlayer) {
      this.spotifyPlayer.stop()
    } else if (this.currentMode === 'preview') {
      this.previewPlayer.stop()
    }
    // Note: Don't set mode to 'none' here - let play() set the new mode
  }

  /**
   * Seek to position (seconds)
   */
  seek(position: number): void {
    if (this.currentMode === 'spotify' && this.spotifyPlayer) {
      this.spotifyPlayer.seek(position)
    } else if (this.currentMode === 'preview') {
      this.previewPlayer.seek(position)
    }
  }

  /**
   * Get current playback position (seconds)
   */
  getCurrentTime(): number {
    if (this.currentMode === 'spotify' && this.spotifyPlayer) {
      return this.spotifyPlayer.getCurrentTime()
    } else if (this.currentMode === 'preview') {
      return this.previewPlayer.getCurrentTime()
    }
    return 0
  }

  /**
   * Get total duration (seconds)
   */
  getDuration(): number {
    if (this.currentMode === 'spotify' && this.spotifyPlayer) {
      return this.spotifyPlayer.getDuration()
    } else if (this.currentMode === 'preview') {
      return this.previewPlayer.getDuration()
    }
    return 0
  }

  /**
   * Get current audio mode
   */
  getMode(): AudioMode {
    return this.currentMode
  }

  /**
   * Get preferred mode (user choice)
   */
  getPreferredMode(): AudioMode {
    return this.preferredMode
  }

  /**
   * Set preferred mode (user choice)
   * @param mode 'spotify' or 'preview'
   */
  setPreferredMode(mode: AudioMode): void {
    if (mode === 'spotify' && !this.spotifyPlayer) {
      console.warn('⚠️ Cannot set Spotify mode: Player not initialized')
      return
    }
    this.preferredMode = mode
    console.log(`✅ Preferred mode set to: ${mode}`)
  }

  /**
   * Check if Spotify Premium is available
   */
  isSpotifyAvailable(): boolean {
    return this.spotifyPlayer !== null
  }

  /**
   * Check if currently playing
   */
  isPlaying(): boolean {
    if (this.currentMode === 'spotify' && this.spotifyPlayer) {
      return this.spotifyPlayer.isPlaying()
    } else if (this.currentMode === 'preview') {
      return this.previewPlayer.isPlaying()
    }
    return false
  }

  /**
   * Get current state
   */
  getState(): PlayerState {
    if (this.currentMode === 'spotify' && this.spotifyPlayer) {
      return this.spotifyPlayer.getState()
    } else if (this.currentMode === 'preview') {
      return this.previewPlayer.getState()
    }
    return 'idle'
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    if (this.currentMode === 'spotify' && this.spotifyPlayer) {
      this.spotifyPlayer.setVolume(volume)
    } else if (this.currentMode === 'preview') {
      this.previewPlayer.setVolume(volume)
    }
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    if (this.currentMode === 'spotify' && this.spotifyPlayer) {
      return this.spotifyPlayer.getVolume()
    } else if (this.currentMode === 'preview') {
      return this.previewPlayer.getVolume()
    }
    return 0.8
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.spotifyPlayer) {
      this.spotifyPlayer.destroy()
      this.spotifyPlayer = null
    }
    this.previewPlayer.destroy()
    this.setMode('none')
    this.config = {}
  }

  // Private methods

  private setMode(mode: AudioMode): void {
    if (this.currentMode !== mode) {
      this.currentMode = mode
      this.config.onModeChange?.(mode)
      console.log(`🎵 Audio mode: ${mode}`)
    }
  }
}

// Singleton instance
let musicPlayerInstance: MusicPlayerService | null = null

export function getMusicPlayer(): MusicPlayerService {
  if (!musicPlayerInstance) {
    musicPlayerInstance = new MusicPlayerService()
  }
  return musicPlayerInstance
}

/**
 * Reset singleton (useful for testing)
 */
export function resetMusicPlayer(): void {
  if (musicPlayerInstance) {
    musicPlayerInstance.destroy()
    musicPlayerInstance = null
  }
}
