/**
 * Beat Animator Component
 * Orchestrates beat-synchronized animations using Spotify Audio Analysis
 */

import { useEffect, useRef } from 'react'
import { AudioAnalyzer, type AnalysisResult } from '@/services/AudioAnalyzer'
import { applyBeatAnimation } from '@/utils/animationEffects'
import { useBeatSync } from '@/contexts/BeatSyncContext'

// ============================================================================
// Types
// ============================================================================

interface BeatAnimatorProps {
  /** Whether playback is currently active */
  isPlaying: boolean
  /** Current track ID */
  trackId: string | null
  /** Current playback position in ms */
  currentPosition: number
  /** Spotify access token */
  accessToken: string | null
}

// ============================================================================
// Beat Animator Component
// ============================================================================

export function BeatAnimator({ isPlaying, trackId, currentPosition, accessToken }: BeatAnimatorProps) {
  const { enabled, animationType, intensity } = useBeatSync()
  const analysisRef = useRef<AnalysisResult | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastBeatTimeRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const pausedAtRef = useRef<number>(0)

  /**
   * Load audio analysis when track changes
   */
  useEffect(() => {
    if (!trackId || !accessToken || !enabled) return

    const loadAnalysis = async () => {
      console.log('🎵 Loading audio analysis for track:', trackId)
      const analysis = await AudioAnalyzer.fetchAnalysis(trackId, accessToken)

      if (analysis) {
        analysisRef.current = analysis
        console.log('✅ Audio analysis loaded, ready for beat sync')
      }
    }

    loadAnalysis()

    // Cleanup on track change
    return () => {
      analysisRef.current = null
    }
  }, [trackId, accessToken, enabled])

  /**
   * Start/Stop animation loop based on playback state
   */
  useEffect(() => {
    if (!enabled || !analysisRef.current || !isPlaying) {
      // Stop animation loop
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    // Start animation loop
    startTimeRef.current = performance.now() - currentPosition
    animateBeats()

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, enabled, currentPosition, animationType, intensity])

  /**
   * Animation loop - checks for beats and triggers animations
   */
  const animateBeats = () => {
    if (!analysisRef.current || !enabled) return

    const currentTime = performance.now() - startTimeRef.current
    const analysis = analysisRef.current

    // Find next beat
    const nextBeat = AudioAnalyzer.getNextBeat(analysis, lastBeatTimeRef.current)

    if (nextBeat && currentTime >= nextBeat.start) {
      // Beat hit! Trigger animation
      triggerBeatAnimation()
      lastBeatTimeRef.current = nextBeat.start
    }

    // Continue loop
    animationFrameRef.current = requestAnimationFrame(animateBeats)
  }

  /**
   * Trigger beat animation on background
   */
  const triggerBeatAnimation = () => {
    // Animate body background
    const body = document.querySelector('body')
    if (body) {
      applyBeatAnimation(
        [body],
        getAnimationTypeForBackground(animationType),
        intensity,
        300, // Duration in ms
        getColorsForAnimation()
      )
    }
  }

  /**
   * Map BeatSync animation type to effect
   */
  const getAnimationTypeForBackground = (type: string): string => {
    // Mapping from BeatSyncContext animation types to animationEffects types
    switch (type) {
      case 'pulse':
        return 'pulse'
      case 'wave':
      case 'wave_3d':
        return 'pulse' // Wave uses pulse effect on background
      case 'flash':
        return 'flash'
      case 'gradient':
        return 'color'
      case 'glow':
        return 'glow'
      default:
        return 'pulse'
    }
  }

  /**
   * Get colors based on mxster theme
   */
  const getColorsForAnimation = (): string[] => {
    return ['#e94560', '#0f3460', '#16213e'] // mxster accent colors
  }

  // This component doesn't render anything - it's just for side effects
  return null
}
