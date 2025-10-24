/**
 * SpotifyBeatAnimator
 *
 * Core service for beat detection and animation synchronization
 * Connects to Spotify API /audio-analysis endpoint and triggers beat events
 */

class SpotifyBeatAnimator {
  constructor() {
    this.isActive = false
    this.currentTrackId = null
    this.audioAnalysis = null
    this.beats = []
    this.currentBeatIndex = 0
    this.beatTimeouts = []
    this.playbackStartTime = null
    this.playbackPosition = 0
    this.isPaused = false
    this.syncInterval = null
    this.accessToken = null

    // Performance tracking
    this.lastBeatTime = 0
    this.beatDebounceMs = 100 // Minimum time between beats
  }

  /**
   * Initialize the beat animator
   * @param {string} accessToken - Spotify access token
   */
  initialize(accessToken) {
    this.accessToken = accessToken
    console.log('🎵 SpotifyBeatAnimator initialized')
  }

  /**
   * Load audio analysis for a track
   * @param {string} trackId - Spotify track ID
   */
  async loadTrackAnalysis(trackId) {
    // Skip if same track
    if (this.currentTrackId === trackId && this.audioAnalysis) {
      console.log('✅ Using cached audio analysis for track:', trackId)
      return true
    }

    try {
      console.log('🔍 Fetching audio analysis for track:', trackId)

      const response = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const audioFeatures = await response.json()

      // Fetch full analysis
      const analysisResponse = await fetch(`https://api.spotify.com/v1/audio-analysis/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      if (!analysisResponse.ok) {
        // Fallback: Use simple BPM-based timing
        console.warn('⚠️ Audio analysis not available, using BPM fallback')
        this.useBpmFallback(audioFeatures.tempo)
        return false
      }

      this.audioAnalysis = await analysisResponse.json()
      this.beats = this.audioAnalysis.beats || []
      this.currentTrackId = trackId
      this.currentBeatIndex = 0

      console.log(`✅ Audio analysis loaded: ${this.beats.length} beats detected`)
      console.log(`   Tempo: ${audioFeatures.tempo} BPM`)
      console.log(`   Duration: ${this.audioAnalysis.track.duration}s`)

      return true
    } catch (error) {
      console.error('❌ Failed to load audio analysis:', error)

      // Show user-friendly error
      if (error.message.includes('429')) {
        this.showError('Zu viele Anfragen. Beat-Sync kurz pausiert.')
      } else if (error.message.includes('404')) {
        this.showError('Keine Beat-Daten für diesen Track verfügbar.')
      }

      return false
    }
  }

  /**
   * Fallback: Simple BPM-based beat generation
   * @param {number} bpm - Beats per minute
   */
  useBpmFallback(bpm) {
    const beatInterval = (60 / bpm) * 1000 // Convert BPM to milliseconds
    this.beats = []

    // Generate synthetic beats for 5 minutes
    for (let i = 0; i < (5 * 60 * 1000) / beatInterval; i++) {
      this.beats.push({
        start: (i * beatInterval) / 1000,
        duration: beatInterval / 1000,
        confidence: 0.5
      })
    }

    console.log(`🎼 Generated ${this.beats.length} synthetic beats from ${bpm} BPM`)
  }

  /**
   * Start beat synchronization
   * @param {number} playbackPosition - Current playback position in ms
   */
  start(playbackPosition = 0) {
    if (!this.beats || this.beats.length === 0) {
      console.warn('⚠️ No beats available for synchronization')
      return
    }

    this.isActive = true
    this.isPaused = false
    this.playbackPosition = playbackPosition
    this.playbackStartTime = Date.now() - playbackPosition

    console.log('▶️ Beat sync started at position:', playbackPosition, 'ms')

    // Find current beat index based on playback position
    const positionSeconds = playbackPosition / 1000
    this.currentBeatIndex = this.beats.findIndex(beat => beat.start > positionSeconds)

    if (this.currentBeatIndex === -1) {
      this.currentBeatIndex = 0
    }

    // Schedule beats
    this.scheduleBeats()

    // Periodic sync check (every 2 seconds)
    this.syncInterval = setInterval(() => {
      if (!this.isPaused) {
        this.checkSync()
      }
    }, 2000)
  }

  /**
   * Schedule beat triggers
   */
  scheduleBeats() {
    // Clear existing timeouts
    this.clearBeatTimeouts()

    const now = Date.now()
    const currentPlaybackTime = (now - this.playbackStartTime) / 1000 // in seconds

    // Schedule next 50 beats (or remaining beats)
    const beatsToSchedule = Math.min(50, this.beats.length - this.currentBeatIndex)

    for (let i = 0; i < beatsToSchedule; i++) {
      const beatIndex = this.currentBeatIndex + i
      if (beatIndex >= this.beats.length) break

      const beat = this.beats[beatIndex]
      const beatTime = beat.start
      const delay = (beatTime - currentPlaybackTime) * 1000

      if (delay > 0) {
        const timeout = setTimeout(() => {
          this.triggerBeat(beat, beatIndex)
        }, delay)

        this.beatTimeouts.push(timeout)
      }
    }

    console.log(`⏰ Scheduled ${beatsToSchedule} beats starting from index ${this.currentBeatIndex}`)
  }

  /**
   * Trigger a beat animation event
   * @param {object} beat - Beat object from audio analysis
   * @param {number} beatIndex - Index of the beat
   */
  triggerBeat(beat, beatIndex) {
    // Debounce: Skip if too close to last beat
    const now = Date.now()
    if (now - this.lastBeatTime < this.beatDebounceMs) {
      return
    }
    this.lastBeatTime = now

    // Dispatch custom event
    const beatEvent = new CustomEvent('beatPulse', {
      detail: {
        beat,
        beatIndex,
        confidence: beat.confidence,
        duration: beat.duration * 1000 // Convert to ms
      }
    })

    document.dispatchEvent(beatEvent)

    // Update current index
    this.currentBeatIndex = beatIndex + 1

    // Reschedule if approaching end of scheduled beats
    if (beatIndex % 25 === 0) {
      this.scheduleBeats()
    }
  }

  /**
   * Check synchronization with actual playback
   */
  checkSync() {
    if (!this.isActive || !this.beats.length) return

    const now = Date.now()
    const expectedPlaybackTime = (now - this.playbackStartTime) / 1000

    // If drift is > 500ms, resync
    if (Math.abs(expectedPlaybackTime - this.playbackPosition / 1000) > 0.5) {
      console.log('⚠️ Beat sync drift detected, resyncing...')
      this.start(this.playbackPosition)
    }
  }

  /**
   * Pause beat synchronization
   */
  pause() {
    this.isPaused = true
    this.clearBeatTimeouts()
    console.log('⏸️ Beat sync paused')
  }

  /**
   * Resume beat synchronization
   * @param {number} playbackPosition - Current playback position in ms
   */
  resume(playbackPosition) {
    this.isPaused = false
    this.playbackPosition = playbackPosition
    this.playbackStartTime = Date.now() - playbackPosition
    this.scheduleBeats()
    console.log('▶️ Beat sync resumed at position:', playbackPosition, 'ms')
  }

  /**
   * Stop beat synchronization
   */
  stop() {
    this.isActive = false
    this.isPaused = false
    this.clearBeatTimeouts()

    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }

    console.log('⏹️ Beat sync stopped')
  }

  /**
   * Clear all scheduled beat timeouts
   */
  clearBeatTimeouts() {
    this.beatTimeouts.forEach(timeout => clearTimeout(timeout))
    this.beatTimeouts = []
  }

  /**
   * Update playback position (called by player state change)
   * @param {number} positionMs - Current playback position in ms
   */
  updatePosition(positionMs) {
    this.playbackPosition = positionMs
    this.playbackStartTime = Date.now() - positionMs
  }

  /**
   * Show error message to user
   * @param {string} message - Error message
   */
  showError(message) {
    if (window.game && typeof window.game.showToast === 'function') {
      window.game.showToast(message, 'error')
    } else {
      console.error('💬', message)
    }
  }

  /**
   * Get current statistics
   */
  getStats() {
    return {
      isActive: this.isActive,
      currentTrackId: this.currentTrackId,
      totalBeats: this.beats.length,
      currentBeatIndex: this.currentBeatIndex,
      scheduledBeats: this.beatTimeouts.length,
      playbackPosition: this.playbackPosition
    }
  }
}

export default new SpotifyBeatAnimator()
