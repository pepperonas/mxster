/**
 * Activity-Based Animation Utilities
 * Parameter presets and interpolation functions for user interaction-based animations
 */

import type { ActivityLevel } from '@/contexts/InteractionContext'

export interface AnimationParameters {
  // Particle counts
  mainWaveCount: number
  accentWaveCount: number
  starLayerCount: number

  // Particle sizes
  mainParticleSize: number
  accentParticleSize: number
  starParticleSize: number

  // Opacity
  mainOpacity: number
  accentOpacity: number
  starOpacity: number

  // Wave parameters
  waveAmplitude: number
  rotationSpeed: number

  // Camera
  cameraSpeed: number
  cameraRadius: number
}

// Base parameters (current "calm" state)
const BASE_PARAMS: AnimationParameters = {
  mainWaveCount: 12000,
  accentWaveCount: 8000,
  starLayerCount: 5000,
  mainParticleSize: 1.5,
  accentParticleSize: 1.0,
  starParticleSize: 0.8,
  mainOpacity: 0.8,
  accentOpacity: 0.6,
  starOpacity: 0.5,
  waveAmplitude: 1.0,
  rotationSpeed: 0.08,
  cameraSpeed: 0.15,
  cameraRadius: 200
}

// Activity level multipliers
export const ACTIVITY_PARAMS: Record<ActivityLevel, AnimationParameters> = {
  idle: {
    mainWaveCount: Math.floor(BASE_PARAMS.mainWaveCount * 0.5), // 50%
    accentWaveCount: Math.floor(BASE_PARAMS.accentWaveCount * 0.5),
    starLayerCount: Math.floor(BASE_PARAMS.starLayerCount * 0.5),
    mainParticleSize: BASE_PARAMS.mainParticleSize * 0.7,
    accentParticleSize: BASE_PARAMS.accentParticleSize * 0.7,
    starParticleSize: BASE_PARAMS.starParticleSize * 0.7,
    mainOpacity: BASE_PARAMS.mainOpacity * 0.5,
    accentOpacity: BASE_PARAMS.accentOpacity * 0.5,
    starOpacity: BASE_PARAMS.starOpacity * 0.5,
    waveAmplitude: 0.3,
    rotationSpeed: BASE_PARAMS.rotationSpeed * 0.5,
    cameraSpeed: BASE_PARAMS.cameraSpeed * 0.5,
    cameraRadius: BASE_PARAMS.cameraRadius
  },
  calm: {
    ...BASE_PARAMS,
    waveAmplitude: 0.7
  },
  active: {
    mainWaveCount: Math.floor(BASE_PARAMS.mainWaveCount * 1.3), // 130%
    accentWaveCount: Math.floor(BASE_PARAMS.accentWaveCount * 1.3),
    starLayerCount: Math.floor(BASE_PARAMS.starLayerCount * 1.3),
    mainParticleSize: BASE_PARAMS.mainParticleSize * 1.2,
    accentParticleSize: BASE_PARAMS.accentParticleSize * 1.2,
    starParticleSize: BASE_PARAMS.starParticleSize * 1.2,
    mainOpacity: BASE_PARAMS.mainOpacity * 1.1,
    accentOpacity: BASE_PARAMS.accentOpacity * 1.1,
    starOpacity: BASE_PARAMS.starOpacity * 1.1,
    waveAmplitude: 1.3,
    rotationSpeed: BASE_PARAMS.rotationSpeed * 1.5,
    cameraSpeed: BASE_PARAMS.cameraSpeed * 1.5,
    cameraRadius: BASE_PARAMS.cameraRadius * 1.1
  },
  intense: {
    mainWaveCount: Math.floor(BASE_PARAMS.mainWaveCount * 1.5), // 150%
    accentWaveCount: Math.floor(BASE_PARAMS.accentWaveCount * 1.5),
    starLayerCount: Math.floor(BASE_PARAMS.starLayerCount * 1.5),
    mainParticleSize: BASE_PARAMS.mainParticleSize * 1.5,
    accentParticleSize: BASE_PARAMS.accentParticleSize * 2.5, // 🎵 Extra prominent during music
    starParticleSize: BASE_PARAMS.starParticleSize * 1.5,
    mainOpacity: Math.min(1.0, BASE_PARAMS.mainOpacity * 1.25),
    accentOpacity: Math.min(1.0, BASE_PARAMS.accentOpacity * 1.8), // 🎵 Much brighter during music
    starOpacity: Math.min(1.0, BASE_PARAMS.starOpacity * 1.25),
    waveAmplitude: 1.8,
    rotationSpeed: BASE_PARAMS.rotationSpeed * 2.0,
    cameraSpeed: BASE_PARAMS.cameraSpeed * 2.0,
    cameraRadius: BASE_PARAMS.cameraRadius * 1.2
  }
}

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress
}

/**
 * Ease-out cubic function for natural animations
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Interpolate between two animation parameter sets
 * @param from Starting parameters
 * @param to Target parameters
 * @param progress Progress from 0 to 1
 * @param easing Apply easing function (default: true)
 */
export function interpolateParameters(
  from: AnimationParameters,
  to: AnimationParameters,
  progress: number,
  easing: boolean = true
): AnimationParameters {
  const t = easing ? easeOutCubic(progress) : progress

  return {
    mainWaveCount: Math.floor(lerp(from.mainWaveCount, to.mainWaveCount, t)),
    accentWaveCount: Math.floor(lerp(from.accentWaveCount, to.accentWaveCount, t)),
    starLayerCount: Math.floor(lerp(from.starLayerCount, to.starLayerCount, t)),
    mainParticleSize: lerp(from.mainParticleSize, to.mainParticleSize, t),
    accentParticleSize: lerp(from.accentParticleSize, to.accentParticleSize, t),
    starParticleSize: lerp(from.starParticleSize, to.starParticleSize, t),
    mainOpacity: lerp(from.mainOpacity, to.mainOpacity, t),
    accentOpacity: lerp(from.accentOpacity, to.accentOpacity, t),
    starOpacity: lerp(from.starOpacity, to.starOpacity, t),
    waveAmplitude: lerp(from.waveAmplitude, to.waveAmplitude, t),
    rotationSpeed: lerp(from.rotationSpeed, to.rotationSpeed, t),
    cameraSpeed: lerp(from.cameraSpeed, to.cameraSpeed, t),
    cameraRadius: lerp(from.cameraRadius, to.cameraRadius, t)
  }
}

/**
 * Get animation parameters for a specific activity level
 */
export function getParametersForActivity(level: ActivityLevel): AnimationParameters {
  return ACTIVITY_PARAMS[level]
}

/**
 * Apply beat intensity modifiers to parameters
 * Used for short pulse effects on top of activity level
 */
export function applyBeatModifiers(
  params: AnimationParameters,
  beatIntensity: number
): AnimationParameters {
  const intensity = Math.min(1.0, beatIntensity / 100)

  return {
    ...params,
    mainParticleSize: params.mainParticleSize * (1 + intensity * 0.5),
    accentParticleSize: params.accentParticleSize * (1 + intensity * 1.0),
    mainOpacity: Math.min(1.0, params.mainOpacity * (1 + intensity * 0.25)),
    accentOpacity: Math.min(1.0, params.accentOpacity * (1 + intensity * 0.5)),
    waveAmplitude: params.waveAmplitude * (1 + intensity * 0.5)
  }
}

/**
 * Calculate transition duration based on activity level change
 * Bigger changes = longer transitions
 */
export function getTransitionDuration(from: ActivityLevel, to: ActivityLevel): number {
  const levels: ActivityLevel[] = ['idle', 'calm', 'active', 'intense']
  const fromIndex = levels.indexOf(from)
  const toIndex = levels.indexOf(to)
  const distance = Math.abs(toIndex - fromIndex)

  // Base: 300ms, +200ms per level difference
  return 300 + distance * 200
}
