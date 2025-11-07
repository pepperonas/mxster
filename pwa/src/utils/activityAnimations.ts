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
  turbulenceStrength: number // NEW: 0.0 (idle) → 1.0 (intense)

  // Camera
  cameraSpeed: number
  cameraRadius: number

  // Colors (hex numbers for Three.js)
  mainColor: number
  accentColor: number
  starColor: number
  backgroundColor: string // Radial gradient string
}

// Timeline mode colors (Blue/Cyan theme)
const TIMELINE_COLORS = {
  mainColor: 0x6366f1, // Indigo
  accentColor: 0xff6b35, // Orange
  starColor: 0x4aedc4, // Cyan
  backgroundColor: 'radial-gradient(circle at center, #0a0a1f 0%, #000000 100%)'
}

// Hardcore mode colors (Orange theme)
const HARDCORE_COLORS = {
  mainColor: 0xff8c00, // Dark Orange
  accentColor: 0xffa500, // Bright Orange
  starColor: 0xff6b35, // Deep Orange
  backgroundColor: 'radial-gradient(circle at center, #1f0a00 0%, #0a0500 50%, #000000 100%)'
}

// Base parameters (current "calm" state) - Timeline mode by default
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
  turbulenceStrength: 0.2,
  cameraSpeed: 0.15,
  cameraRadius: 200,
  ...TIMELINE_COLORS
}

// Activity level multipliers (without colors - colors added dynamically by getParametersForActivity)
const ACTIVITY_PARAMS_BASE: Record<ActivityLevel, Omit<AnimationParameters, 'mainColor' | 'accentColor' | 'starColor' | 'backgroundColor'>> = {
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
    turbulenceStrength: 0.0, // No turbulence when idle
    cameraSpeed: BASE_PARAMS.cameraSpeed * 0.5,
    cameraRadius: BASE_PARAMS.cameraRadius
  },
  calm: {
    mainWaveCount: BASE_PARAMS.mainWaveCount,
    accentWaveCount: BASE_PARAMS.accentWaveCount,
    starLayerCount: BASE_PARAMS.starLayerCount,
    mainParticleSize: BASE_PARAMS.mainParticleSize,
    accentParticleSize: BASE_PARAMS.accentParticleSize,
    starParticleSize: BASE_PARAMS.starParticleSize,
    mainOpacity: BASE_PARAMS.mainOpacity,
    accentOpacity: BASE_PARAMS.accentOpacity,
    starOpacity: BASE_PARAMS.starOpacity,
    waveAmplitude: 0.7,
    rotationSpeed: BASE_PARAMS.rotationSpeed,
    turbulenceStrength: 0.2, // Subtle turbulence
    cameraSpeed: BASE_PARAMS.cameraSpeed,
    cameraRadius: BASE_PARAMS.cameraRadius
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
    turbulenceStrength: 0.6, // Noticeable turbulence
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
    turbulenceStrength: 1.0, // Maximum turbulence/chaos
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
 * Interpolate between two hex colors (RGB component-wise)
 * @param from Starting color (hex number, e.g., 0xFF8C00)
 * @param to Target color (hex number)
 * @param progress Progress from 0 to 1
 * @returns Interpolated color as hex number
 */
export function interpolateColor(from: number, to: number, progress: number): number {
  // Extract RGB components
  const r1 = (from >> 16) & 0xff
  const g1 = (from >> 8) & 0xff
  const b1 = from & 0xff

  const r2 = (to >> 16) & 0xff
  const g2 = (to >> 8) & 0xff
  const b2 = to & 0xff

  // Interpolate each component
  const r = Math.round(lerp(r1, r2, progress))
  const g = Math.round(lerp(g1, g2, progress))
  const b = Math.round(lerp(b1, b2, progress))

  // Combine back to hex
  return (r << 16) | (g << 8) | b
}

/**
 * Ease-out cubic function for natural animations
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Interpolate between two animation parameter sets (including colors!)
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
    turbulenceStrength: lerp(from.turbulenceStrength, to.turbulenceStrength, t),
    cameraSpeed: lerp(from.cameraSpeed, to.cameraSpeed, t),
    cameraRadius: lerp(from.cameraRadius, to.cameraRadius, t),
    // NEW: Smooth color transitions
    mainColor: interpolateColor(from.mainColor, to.mainColor, t),
    accentColor: interpolateColor(from.accentColor, to.accentColor, t),
    starColor: interpolateColor(from.starColor, to.starColor, t),
    // Background gradient can't be interpolated easily, so we switch at 50% progress
    backgroundColor: t < 0.5 ? from.backgroundColor : to.backgroundColor
  }
}

/**
 * Get animation parameters for a specific activity level and game mode
 * @param level Activity level (idle, calm, active, intense)
 * @param isHardcoreMode Whether game is in Hardcore mode (affects colors)
 */
export function getParametersForActivity(
  level: ActivityLevel,
  isHardcoreMode: boolean = false
): AnimationParameters {
  const baseParams = ACTIVITY_PARAMS_BASE[level]
  const colors = isHardcoreMode ? HARDCORE_COLORS : TIMELINE_COLORS

  return {
    ...baseParams,
    ...colors
  }
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
