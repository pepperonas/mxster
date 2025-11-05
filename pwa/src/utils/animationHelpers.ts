/**
 * Animation Helper Utilities
 * Shared randomization and timing functions for all animations
 */

/**
 * Random number between min and max (inclusive)
 */
export const randomBetween = (min: number, max: number): number => {
  return Math.random() * (max - min) + min
}

/**
 * Random integer between min and max (inclusive)
 */
export const randomInt = (min: number, max: number): number => {
  return Math.floor(randomBetween(min, max + 1))
}

/**
 * Random choice from array
 */
export const randomChoice = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Random color from theme palette
 */
export const randomColor = (palette?: string[]): string => {
  const defaultPalette = [
    '#6366f1', // indigo
    '#f97316', // orange
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#8b5cf6', // purple
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
  ]
  const colors = palette || defaultPalette
  return randomChoice(colors)
}

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Sleep/delay utility
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Create random position on screen
 */
export const randomPosition = (): { x: number; y: number } => {
  return {
    x: randomBetween(0.1, 0.9),
    y: randomBetween(0.1, 0.9),
  }
}

/**
 * Detect mobile device
 */
export const isMobile = (): boolean => {
  return window.innerWidth < 768
}

/**
 * Get particle count based on device
 */
export const getParticleCount = (base: number): number => {
  return isMobile() ? Math.floor(base * 0.5) : base
}
