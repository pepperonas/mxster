/**
 * Preview Player Service
 * Handles self-hosted audio playback using Howler.js
 * No authentication required - uses self-hosted MP3 files (128 kbps)
 */

import { Howl } from 'howler'
import type { Song } from '@/types'

export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'error'

interface PreviewPlayerConfig {
  onStateChange?: (state: PlayerState) => void
  onProgress?: (progress: number) => void
  onEnd?: () => void
  onError?: (error: string) => void
  /** The browser blocked autoplay; playback starts on the next tap. */
  onBlocked?: () => void
}

/**
 * Songs list absolute URLs (https://mxster.celox.io/audio/…). Playback always
 * goes to the same origin: /audio/ is behind the login (nginx auth_request),
 * so the session cookie must travel with the request.
 */
export function audioSrc(previewUrl: string): string {
  try {
    return new URL(previewUrl, window.location.origin).pathname
  } catch {
    return previewUrl
  }
}

export class PreviewPlayerService {
  private sound: Howl | null = null
  private currentSong: Song | null = null
  private state: PlayerState = 'idle'
  private config: PreviewPlayerConfig = {}
  private progressInterval: number | null = null

  constructor(config: PreviewPlayerConfig = {}) {
    this.config = config
  }

  setConfig(config: PreviewPlayerConfig): void {
    this.config = config
  }

  /**
   * Play a song's preview (30 seconds)
   * @param song Song object with previewUrl
   * @param startTime Optional start time in seconds (default: 0)
   */
  async play(song: Song, startTime: number = 0): Promise<void> {
    // Check if preview URL exists
    if (!song.previewUrl) {
      this.setState('error')
      this.config.onError?.('Für diesen Song gibt es keine Audiodatei.')
      throw new Error(`No preview URL for song: ${song.title}`)
    }

    // Stop current playback if any
    this.stop()

    this.setState('loading')
    this.currentSong = song

    // Create Howler instance
    this.sound = new Howl({
      src: [audioSrc(song.previewUrl)],
      html5: true, // Use HTML5 Audio for streaming
      volume: 0.8,
      preload: true,
      onload: () => {
        // 'playing' is set by onplay — the browser may still block autoplay
        // Seek to start position if specified
        if (startTime > 0 && this.sound) {
          this.sound.seek(startTime)
        }

        // Start progress tracking
        this.startProgressTracking()
      },
      onplay: () => {
        this.setState('playing')
      },
      onpause: () => {
        this.setState('paused')
      },
      onstop: () => {
        this.setState('stopped')
        this.stopProgressTracking()
      },
      onend: () => {
        this.setState('idle')
        this.stopProgressTracking()
        this.config.onEnd?.()
      },
      onloaderror: (_id, error) => {
        console.error(`Preview load error: ${song.title}`, error)
        this.setState('error')
        this.config.onError?.('Der Song konnte nicht geladen werden.')
      },
      onplayerror: () => {
        // Autoplay blocked (typical after a reload on phones): wait paused and
        // start on the browser's next unlock (the first tap anywhere).
        this.setState('paused')
        this.config.onBlocked?.()
        this.sound?.once('unlock', () => {
          if (this.sound && this.state === 'paused') this.sound.play()
        })
      }
    })

    // Start playback
    this.sound.play()
  }

  /**
   * Pause current playback
   */
  pause(): void {
    if (this.sound && this.state === 'playing') {
      this.sound.pause()
      this.stopProgressTracking()
    }
  }

  /**
   * Resume playback
   */
  resume(): void {
    if (this.sound && (this.state === 'paused' || this.state === 'error')) {
      this.sound.play()
      this.startProgressTracking()
    }
  }

  /**
   * Stop playback and cleanup
   */
  stop(): void {
    if (this.sound) {
      this.sound.stop()
      this.sound.unload()
      this.sound = null
    }
    this.stopProgressTracking()
    this.currentSong = null
    this.setState('idle')
  }

  /**
   * Seek to position (in seconds)
   * @param position Time in seconds (0-30)
   */
  seek(position: number): void {
    if (this.sound) {
      const duration = this.getDuration()
      const clampedPosition = Math.max(0, Math.min(position, duration))
      this.sound.seek(clampedPosition)
    }
  }

  /**
   * Get current playback position (in seconds)
   */
  getCurrentTime(): number {
    if (!this.sound) return 0
    const pos = this.sound.seek()
    return typeof pos === 'number' ? pos : 0
  }

  /**
   * Get total duration (full song length, typically 3-5 minutes)
   */
  getDuration(): number {
    if (this.sound) {
      return this.sound.duration()
    }
    return 30 // Default preview length
  }

  /**
   * Get current state
   */
  getState(): PlayerState {
    return this.state
  }

  /**
   * Get currently playing song
   */
  getCurrentSong(): Song | null {
    return this.currentSong
  }

  /**
   * Check if currently playing
   */
  isPlaying(): boolean {
    return this.state === 'playing'
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    if (this.sound) {
      this.sound.volume(clampedVolume)
    }
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    if (this.sound) {
      return this.sound.volume()
    }
    return 0.8 // Default
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop()
    this.config = {}
  }

  // Private methods

  private setState(state: PlayerState): void {
    this.state = state
    this.config.onStateChange?.(state)
  }

  private startProgressTracking(): void {
    // Clear existing interval
    this.stopProgressTracking()

    // Update progress every 100ms
    this.progressInterval = window.setInterval(() => {
      if (this.sound && this.state === 'playing') {
        const currentTime = this.getCurrentTime()
        const duration = this.getDuration()
        const progress = duration > 0 ? (currentTime / duration) * 100 : 0

        this.config.onProgress?.(progress)
      }
    }, 100)
  }

  private stopProgressTracking(): void {
    if (this.progressInterval !== null) {
      clearInterval(this.progressInterval)
      this.progressInterval = null
    }
  }
}

// Singleton instance (optional)
let previewPlayerInstance: PreviewPlayerService | null = null

export function getPreviewPlayer(): PreviewPlayerService {
  if (!previewPlayerInstance) {
    previewPlayerInstance = new PreviewPlayerService()
  }
  return previewPlayerInstance
}
