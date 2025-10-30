/**
 * Audio Analyzer Service
 * Fetches and analyzes Spotify Audio Analysis for beat synchronization
 */

// ============================================================================
// Types
// ============================================================================

export interface SpotifyAudioAnalysis {
  track: {
    duration: number
    tempo: number
    time_signature: number
    key: number
    mode: number
  }
  bars: Array<{ start: number; duration: number; confidence: number }>
  beats: Array<{ start: number; duration: number; confidence: number }>
  sections: Array<{
    start: number
    duration: number
    confidence: number
    loudness: number
    tempo: number
    key: number
    mode: number
    time_signature: number
  }>
  segments: Array<{
    start: number
    duration: number
    confidence: number
    loudness_start: number
    loudness_max: number
    loudness_max_time: number
    loudness_end: number
    pitches: number[]
    timbre: number[]
  }>
}

export interface BeatData {
  start: number // Time in ms
  duration: number
  confidence: number
}

export interface AnalysisResult {
  tempo: number
  beats: BeatData[]
  bars: BeatData[]
  duration: number
}

// ============================================================================
// Audio Analyzer Service
// ============================================================================

class AudioAnalyzerClass {
  private analysisCache: Map<string, AnalysisResult> = new Map()

  /**
   * Fetch audio analysis from Spotify API
   */
  async fetchAnalysis(trackId: string, accessToken: string): Promise<AnalysisResult | null> {
    // Check cache first
    if (this.analysisCache.has(trackId)) {
      console.log('✅ Using cached analysis for track:', trackId)
      return this.analysisCache.get(trackId)!
    }

    try {
      console.log('🎵 Fetching audio analysis for track:', trackId)

      const response = await fetch(`https://api.spotify.com/v1/audio-analysis/${trackId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        console.error('❌ Audio Analysis Error:', response.status)
        return null
      }

      const data: SpotifyAudioAnalysis = await response.json()

      // Convert to our format
      const result: AnalysisResult = {
        tempo: data.track.tempo,
        beats: data.beats.map((beat) => ({
          start: beat.start * 1000, // Convert to ms
          duration: beat.duration * 1000,
          confidence: beat.confidence
        })),
        bars: data.bars.map((bar) => ({
          start: bar.start * 1000,
          duration: bar.duration * 1000,
          confidence: bar.confidence
        })),
        duration: data.track.duration * 1000
      }

      // Cache the result
      this.analysisCache.set(trackId, result)

      console.log('✅ Audio analysis loaded:', {
        tempo: result.tempo,
        beats: result.beats.length,
        bars: result.bars.length,
        duration: result.duration
      })

      return result
    } catch (error) {
      console.error('❌ Failed to fetch audio analysis:', error)
      return null
    }
  }

  /**
   * Get next beat after current position
   */
  getNextBeat(analysis: AnalysisResult, currentPositionMs: number): BeatData | null {
    const nextBeat = analysis.beats.find((beat) => beat.start > currentPositionMs)
    return nextBeat || null
  }

  /**
   * Get all beats within time range
   */
  getBeatsInRange(analysis: AnalysisResult, startMs: number, endMs: number): BeatData[] {
    return analysis.beats.filter((beat) => beat.start >= startMs && beat.start <= endMs)
  }

  /**
   * Get current bar
   */
  getCurrentBar(analysis: AnalysisResult, currentPositionMs: number): BeatData | null {
    const currentBar = analysis.bars
      .slice()
      .reverse()
      .find((bar) => bar.start <= currentPositionMs)
    return currentBar || null
  }

  /**
   * Calculate average beat interval (for fallback)
   */
  getAverageBeatInterval(analysis: AnalysisResult): number {
    if (analysis.beats.length < 2) return 500 // Default 500ms

    const intervals = []
    for (let i = 1; i < analysis.beats.length; i++) {
      intervals.push(analysis.beats[i].start - analysis.beats[i - 1].start)
    }

    const sum = intervals.reduce((a, b) => a + b, 0)
    return sum / intervals.length
  }

  /**
   * Get beat confidence threshold
   * Filters out low-confidence beats
   */
  getHighConfidenceBeats(analysis: AnalysisResult, threshold: number = 0.5): BeatData[] {
    return analysis.beats.filter((beat) => beat.confidence >= threshold)
  }

  /**
   * Clear cache (call when track changes)
   */
  clearCache() {
    this.analysisCache.clear()
    console.log('🗑️ Audio analysis cache cleared')
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.analysisCache.size
  }
}

// Export singleton instance
export const AudioAnalyzer = new AudioAnalyzerClass()
