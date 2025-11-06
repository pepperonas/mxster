/**
 * Timeline Placement Animations
 * Confetti for correct placement, thunder/rain for incorrect placement
 */

import confetti from 'canvas-confetti'
import {
  randomBetween,
  randomInt,
  randomChoice,
  randomColor,
  prefersReducedMotion,
  sleep,
  getParticleCount,
} from './animationHelpers'

// ============================================================================
// CORRECT PLACEMENT - Confetti Animations
// ============================================================================

/**
 * Pattern 1: Center Burst
 * Explosion from center, 360° spread
 */
const confettiCenterBurst = async (): Promise<void> => {
  const particleCount = getParticleCount(randomInt(80, 150))
  const colors = [randomColor(), randomColor(), randomColor()]

  await confetti({
    particleCount,
    spread: randomInt(80, 120),
    origin: { x: 0.5, y: 0.5 },
    colors,
    ticks: randomInt(200, 400),
    gravity: randomBetween(0.8, 1.2),
    scalar: randomBetween(0.8, 1.4),
    drift: randomBetween(-0.5, 0.5),
  })
}

/**
 * Pattern 2: Side Cannons
 * Confetti from left and right sides simultaneously
 */
const confettiSideCannons = async (): Promise<void> => {
  const particleCount = getParticleCount(randomInt(50, 100))
  const colors = [randomColor(), randomColor(), randomColor()]

  const leftCannon = confetti({
    particleCount,
    angle: randomInt(45, 75),
    spread: randomInt(50, 70),
    origin: { x: 0, y: 0.6 },
    colors,
    ticks: randomInt(200, 300),
    gravity: randomBetween(1.0, 1.3),
    scalar: randomBetween(0.9, 1.2),
  })

  const rightCannon = confetti({
    particleCount,
    angle: randomInt(105, 135),
    spread: randomInt(50, 70),
    origin: { x: 1, y: 0.6 },
    colors,
    ticks: randomInt(200, 300),
    gravity: randomBetween(1.0, 1.3),
    scalar: randomBetween(0.9, 1.2),
  })

  await Promise.all([leftCannon, rightCannon])
}

/**
 * Pattern 3: Spiral
 * Confetti spiraling from bottom to top
 */
const confettiSpiral = async (): Promise<void> => {
  const colors = [randomColor(), randomColor(), randomColor()]
  const duration = randomInt(2000, 3000)
  const particleCount = getParticleCount(randomInt(3, 6))

  const end = Date.now() + duration

  const frame = () => {
    confetti({
      particleCount,
      angle: randomInt(55, 125),
      spread: randomInt(50, 70),
      origin: {
        x: Math.random(),
        y: Math.random() * 0.5 + 0.5, // Bottom half
      },
      colors,
      ticks: randomInt(50, 100),
      gravity: randomBetween(0.5, 0.8),
      scalar: randomBetween(0.8, 1.2),
      drift: randomBetween(-1, 1),
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }

  frame()
  await sleep(duration)
}

/**
 * Main function: Trigger random confetti pattern
 */
export const triggerCorrectPlacementAnimation = async (): Promise<void> => {
  if (prefersReducedMotion()) return

  const patterns = [confettiCenterBurst, confettiSideCannons, confettiSpiral]
  const selectedPattern = randomChoice(patterns)

  await selectedPattern()
}

// ============================================================================
// INCORRECT PLACEMENT - Thunder/Rain Animation
// ============================================================================

/**
 * Create lightning bolt SVG with random path
 */
const createLightningBolt = (index: number): HTMLDivElement => {
  const bolt = document.createElement('div')
  bolt.className = 'lightning-bolt'
  bolt.style.cssText = `
    position: fixed;
    top: 0;
    left: ${randomBetween(10, 90)}%;
    width: 3px;
    height: 100vh;
    background: linear-gradient(180deg,
      rgba(255, 255, 100, 0) 0%,
      rgba(255, 255, 100, 1) ${randomInt(10, 30)}%,
      rgba(255, 255, 255, 1) ${randomInt(40, 60)}%,
      rgba(255, 255, 100, 0) 100%
    );
    box-shadow: 0 0 20px rgba(255, 255, 100, 0.8), 0 0 40px rgba(255, 255, 100, 0.6);
    z-index: 10000;
    pointer-events: none;
    opacity: 0;
    animation: lightning-flash ${randomBetween(0.1, 0.3)}s ease-in-out ${index * randomBetween(0.2, 0.5)}s;
  `

  return bolt
}

/**
 * Create rain particles
 */
const createRainParticles = (count: number): HTMLDivElement => {
  const rainContainer = document.createElement('div')
  rainContainer.className = 'rain-container'
  rainContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9999;
    pointer-events: none;
    overflow: hidden;
  `

  for (let i = 0; i < count; i++) {
    const drop = document.createElement('div')
    drop.className = 'rain-drop'
    drop.style.cssText = `
      position: absolute;
      left: ${randomInt(0, 100)}%;
      top: -10%;
      width: 2px;
      height: ${randomInt(15, 30)}px;
      background: linear-gradient(180deg,
        rgba(200, 220, 255, 0) 0%,
        rgba(200, 220, 255, 0.6) 100%
      );
      animation: rain-fall ${randomBetween(0.5, 1.2)}s linear ${randomBetween(0, 1)}s infinite;
    `
    rainContainer.appendChild(drop)
  }

  return rainContainer
}

/**
 * Create dark storm overlay
 */
const createStormOverlay = (): HTMLDivElement => {
  const overlay = document.createElement('div')
  overlay.className = 'storm-overlay'
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg,
      rgba(20, 30, 50, ${randomBetween(0.3, 0.5)}) 0%,
      rgba(10, 15, 30, ${randomBetween(0.4, 0.6)}) 100%
    );
    z-index: 9998;
    pointer-events: none;
    animation: fade-in 0.3s ease-in;
  `

  return overlay
}

/**
 * Screen shake effect
 */
const triggerScreenShake = (): void => {
  const app = document.getElementById('root')
  if (!app) return

  app.style.animation = 'screen-shake 0.5s ease-in-out'

  setTimeout(() => {
    app.style.animation = ''
  }, 500)
}

/**
 * Main function: Trigger thunder/rain animation
 */
export const triggerIncorrectPlacementAnimation = async (): Promise<void> => {
  if (prefersReducedMotion()) return

  // Create storm overlay
  const overlay = createStormOverlay()
  document.body.appendChild(overlay)

  // Create rain
  const rainCount = getParticleCount(randomInt(30, 60))
  const rain = createRainParticles(rainCount)
  document.body.appendChild(rain)

  // Create lightning bolts
  const boltCount = randomInt(2, 4)
  const bolts: HTMLDivElement[] = []
  for (let i = 0; i < boltCount; i++) {
    const bolt = createLightningBolt(i)
    bolts.push(bolt)
    document.body.appendChild(bolt)
  }

  // Trigger screen shake
  triggerScreenShake()

  // Cleanup after animation
  await sleep(2000)

  overlay.remove()
  rain.remove()
  bolts.forEach(bolt => bolt.remove())
}

// ============================================================================
// FIRST CARD PLACEMENT - Timeline Draw Animation
// ============================================================================

/**
 * Create sparkle particle
 */
const createSparkle = (delay: number, leftPosition: number): HTMLDivElement => {
  const sparkle = document.createElement('div')
  sparkle.className = 'timeline-sparkle'
  sparkle.style.cssText = `
    position: fixed;
    top: 50%;
    left: ${leftPosition}%;
    width: 8px;
    height: 8px;
    background: ${randomColor()};
    border-radius: 50%;
    box-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
    z-index: 10000;
    pointer-events: none;
    opacity: 0;
    animation: sparkle-fade 1s ease-in-out ${delay}s;
  `

  return sparkle
}

/**
 * Create timeline draw line (horizontal)
 */
const createTimelineLine = (): SVGSVGElement => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('class', 'timeline-draw-svg')
  svg.style.cssText = `
    position: fixed;
    top: 50%;
    left: 10%;
    width: 80%;
    height: 4px;
    z-index: 9999;
    pointer-events: none;
    transform: translateY(-50%);
  `

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  line.setAttribute('x1', '0')
  line.setAttribute('y1', '2')
  line.setAttribute('x2', '100%')
  line.setAttribute('y2', '2')
  line.setAttribute('stroke', randomColor())
  line.setAttribute('stroke-width', '4')
  line.setAttribute('stroke-linecap', 'round')

  // Calculate line length for dash animation
  const lineLength = typeof window !== 'undefined' ? window.innerWidth * 0.8 : 1000
  line.setAttribute('stroke-dasharray', `${lineLength}`)
  line.setAttribute('stroke-dashoffset', `${lineLength}`)
  line.style.filter = 'drop-shadow(0 0 8px currentColor)'
  line.style.animation = 'timeline-draw 1s ease-out forwards'

  svg.appendChild(line)
  return svg
}

/**
 * Main function: Trigger first card placement animation (Timeline Draw)
 */
export const triggerFirstCardAnimation = async (): Promise<void> => {
  if (prefersReducedMotion()) return

  // Create timeline line
  const line = createTimelineLine()
  document.body.appendChild(line)

  // Create sparkles along the line
  const sparkleCount = getParticleCount(randomInt(10, 15))
  const sparkles: HTMLDivElement[] = []

  for (let i = 0; i < sparkleCount; i++) {
    const delay = (i / sparkleCount) * 0.8 // Staggered along the animation
    const leftPosition = 10 + (i / sparkleCount) * 80 // Spread across the line
    const sparkle = createSparkle(delay, leftPosition)
    sparkles.push(sparkle)
    document.body.appendChild(sparkle)
  }

  // Cleanup after animation
  await sleep(1500)

  line.remove()
  sparkles.forEach(sparkle => sparkle.remove())
}
