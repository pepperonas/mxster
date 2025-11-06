/**
 * Background Animations for Beat Sync
 * Beautiful visual effects synchronized with music beats
 */

import { startThreeWave, _stopThreeWave, triggerWaveBeat, cleanupThreeWave } from './threeWaveAnimation'

// Available background animation types
export const BACKGROUND_ANIMATIONS = {
  WAVE_3D: 'wave3d' // Default and only animation
} as const

export type BackgroundAnimationType = typeof BACKGROUND_ANIMATIONS[keyof typeof BACKGROUND_ANIMATIONS]

// Track active 3D animation
let active3DAnimation: string | null = null

/**
 * Apply beat animation to background
 */
export function applyBackgroundBeat(animationType: BackgroundAnimationType, intensity: number = 50): void {
  const background = document.getElementById('beat-background')

  if (!background) {
    return
  }

  // Only 3D wave animation
  if (animationType === BACKGROUND_ANIMATIONS.WAVE_3D) {
    // Start 3D wave if not already running
    if (active3DAnimation !== 'wave3d') {
      cleanup3DAnimations()
      startThreeWave(intensity)
      active3DAnimation = 'wave3d'
    }
    // Trigger beat pulse in the wave
    triggerWaveBeat(intensity)
  }
}

/**
 * Cleanup all 3D animations
 */
function cleanup3DAnimations(): void {
  if (active3DAnimation === 'wave3d') {
    cleanupThreeWave()
  }
  active3DAnimation = null
}

/**
 * Cleanup function to be called when Beat Sync is disabled
 */
export function cleanupBackgroundAnimations(): void {
  cleanup3DAnimations()
}

/**
 * Get animation display name
 */
export function getAnimationName(type: BackgroundAnimationType): string {
  return '3D Partikelwelle'
}

/**
 * Get animation description
 */
export function getAnimationDescription(type: BackgroundAnimationType): string {
  return '3D Wellen-Animation mit Three.js'
}
