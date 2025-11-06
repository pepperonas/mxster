/**
 * Hardcore Mode Guess Animations
 * Score-based visual feedback (0-15 points)
 */

import confetti from 'canvas-confetti'
import {
  randomBetween,
  randomInt,
  prefersReducedMotion,
  sleep,
  getParticleCount,
} from './animationHelpers'

// ============================================================================
// 15 POINTS - PERFECT GUESS 🏆
// ============================================================================

export const triggerPerfectGuessAnimation = async (): Promise<void> => {
  if (prefersReducedMotion()) return

  // Gold confetti with stars
  const duration = 3000
  const end = Date.now() + duration

  const frame = () => {
    confetti({
      particleCount: getParticleCount(randomInt(3, 6)),
      angle: randomInt(55, 125),
      spread: randomInt(50, 80),
      origin: { x: randomBetween(0.3, 0.7), y: randomBetween(0.3, 0.7) },
      colors: ['#FFD700', '#FFA500', '#FFFF00', '#FFF8DC'], // Gold colors
      shapes: ['star', 'circle'],
      ticks: 300,
      gravity: 0.6,
      scalar: randomBetween(1.2, 1.8),
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }

  frame()

  // Show "PERFECT!" text overlay
  showTextOverlay('PERFECT!', '#FFD700', 'text-6xl')

  // Gold glow effect
  applyScoreGlow('#FFD700')

  await sleep(duration)
}

// ============================================================================
// 10-14 POINTS - GREAT GUESS 🌟
// ============================================================================

export const triggerGreatGuessAnimation = async (): Promise<void> => {
  if (prefersReducedMotion()) return

  // Silver confetti
  await confetti({
    particleCount: getParticleCount(randomInt(60, 100)),
    spread: randomInt(60, 90),
    origin: { x: 0.5, y: 0.5 },
    colors: ['#C0C0C0', '#06b6d4', '#E8E8E8', '#A8A8A8'], // Silver/cyan colors
    ticks: 250,
    gravity: 0.9,
    scalar: randomBetween(1.0, 1.4),
  })

  // Show "GREAT!" text overlay
  showTextOverlay('GREAT!', '#06b6d4', 'text-5xl')

  // Cyan glow effect
  applyScoreGlow('#06b6d4')

  await sleep(2000)
}

// ============================================================================
// 5-9 POINTS - GOOD GUESS 👍
// ============================================================================

export const triggerGoodGuessAnimation = async (): Promise<void> => {
  if (prefersReducedMotion()) return

  // Green particles (subtle)
  await confetti({
    particleCount: getParticleCount(randomInt(30, 50)),
    spread: randomInt(40, 60),
    origin: { x: 0.5, y: 0.6 },
    colors: ['#10b981', '#34d399', '#6ee7b7'], // Green shades
    ticks: 200,
    gravity: 1.1,
    scalar: randomBetween(0.8, 1.1),
  })

  // Show "NICE!" text overlay (smaller)
  showTextOverlay('NICE!', '#10b981', 'text-4xl')

  // Green glow effect
  applyScoreGlow('#10b981')

  await sleep(1500)
}

// ============================================================================
// 1-4 POINTS - PARTIAL GUESS 😐
// ============================================================================

export const triggerPartialGuessAnimation = async (points: number): Promise<void> => {
  if (prefersReducedMotion()) return

  // Yellow sparks (few)
  await confetti({
    particleCount: getParticleCount(randomInt(10, 20)),
    spread: randomInt(30, 50),
    origin: { x: 0.5, y: 0.7 },
    colors: ['#f59e0b', '#fbbf24'], // Amber/yellow
    ticks: 150,
    gravity: 1.2,
    scalar: randomBetween(0.6, 0.9),
  })

  // Show "+X" points (no text, just number)
  showTextOverlay(`+${points}`, '#f59e0b', 'text-3xl')

  // Yellow glow effect (weak)
  applyScoreGlow('#f59e0b', 0.5)

  await sleep(1000)
}

// ============================================================================
// 0 POINTS - WRONG GUESS ❌
// ============================================================================

export const triggerWrongGuessAnimation = async (): Promise<void> => {
  if (prefersReducedMotion()) return

  // Red X symbols falling
  createFallingXSymbols(randomInt(5, 10))

  // Screen shake (light)
  triggerScreenShake()

  // Red flash
  showRedFlash()

  await sleep(1000)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Show text overlay with animation
 */
const showTextOverlay = (text: string, color: string, sizeClass: string): void => {
  const overlay = document.createElement('div')
  overlay.className = `${sizeClass} font-bold`
  overlay.textContent = text
  overlay.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: ${color};
    text-shadow: 0 0 20px ${color}, 0 0 40px ${color};
    z-index: 10001;
    pointer-events: none;
    animation: text-pulse 0.6s ease-in-out;
    font-family: 'Montserrat', sans-serif;
    letter-spacing: 0.1em;
  `

  document.body.appendChild(overlay)

  setTimeout(() => {
    overlay.style.animation = 'fade-out 0.4s ease-out'
    setTimeout(() => overlay.remove(), 400)
  }, 600)
}

/**
 * Apply glow effect to score display
 */
const applyScoreGlow = (color: string, intensity: number = 1): void => {
  // Find score elements in the game screen
  const scoreElements = document.querySelectorAll('[class*="score"], [class*="points"]')

  scoreElements.forEach(el => {
    const element = el as HTMLElement
    const originalBoxShadow = element.style.boxShadow

    element.style.boxShadow = `0 0 ${20 * intensity}px ${color}, 0 0 ${40 * intensity}px ${color}`
    element.style.transition = 'box-shadow 0.3s ease-in-out'

    setTimeout(() => {
      element.style.boxShadow = originalBoxShadow
    }, 2000)
  })
}

/**
 * Create falling X symbols for wrong guess
 */
const createFallingXSymbols = (count: number): void => {
  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10000;
    pointer-events: none;
    overflow: hidden;
  `

  for (let i = 0; i < count; i++) {
    const x = document.createElement('div')
    x.textContent = '❌'
    x.style.cssText = `
      position: absolute;
      left: ${randomInt(10, 90)}%;
      top: -50px;
      font-size: ${randomInt(30, 60)}px;
      opacity: ${randomBetween(0.6, 1)};
      animation: fall-and-fade ${randomBetween(1, 2)}s ease-in ${randomBetween(0, 0.5)}s forwards;
    `
    container.appendChild(x)
  }

  document.body.appendChild(container)

  setTimeout(() => container.remove(), 2500)
}

/**
 * Screen shake effect
 */
const triggerScreenShake = (): void => {
  const app = document.getElementById('root')
  if (!app) return

  app.style.animation = 'screen-shake-light 0.3s ease-in-out'

  setTimeout(() => {
    app.style.animation = ''
  }, 300)
}

/**
 * Red flash effect
 */
const showRedFlash = (): void => {
  const flash = document.createElement('div')
  flash.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(239, 68, 68, 0.3);
    z-index: 9999;
    pointer-events: none;
    animation: flash-fade 0.4s ease-out;
  `

  document.body.appendChild(flash)

  setTimeout(() => flash.remove(), 400)
}
