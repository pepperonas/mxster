/**
 * Background Animations for Beat Sync
 * Beautiful visual effects synchronized with music beats
 */

import { startThreeWave, stopThreeWave, triggerWaveBeat, cleanupThreeWave } from './threeWaveAnimation.js'

// Available background animation types
export const BACKGROUND_ANIMATIONS = {
  WAVE_3D: 'wave3d' // Default and only animation
}

// Track active 3D animation
let active3DAnimation = null

/**
 * Apply beat animation to background
 */
export function applyBackgroundBeat(animationType, intensity = 50) {
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
function cleanup3DAnimations() {
  if (active3DAnimation === 'wave3d') {
    cleanupThreeWave()
  }
  active3DAnimation = null
}

/**
 * Cleanup function to be called when Beat Sync is disabled
 */
export function cleanupBackgroundAnimations() {
  cleanup3DAnimations()
}

/**
 * Get animation display name
 */
export function getAnimationName(type) {
  return '3D Partikelwelle'
}

/**
 * Get animation description
 */
export function getAnimationDescription(type) {
  return '3D Wellen-Animation mit Three.js'
}
