/**
 * Animation Effects
 *
 * Implements various animation types for beat synchronization
 * Uses CSS transitions and Web Animations API for smooth effects
 */

/**
 * Apply animation to elements based on beat event
 * @param {Array} elements - DOM elements to animate
 * @param {string} animationType - Type of animation
 * @param {number} intensity - Animation intensity (0-100)
 * @param {number} duration - Animation duration in ms
 * @param {Array} colors - Optional colors for color-based animations
 */
export function applyBeatAnimation(elements, animationType, intensity, duration, colors = []) {
  if (!elements || elements.length === 0) return

  // Convert NodeList to Array
  const elementsArray = Array.from(elements)

  // Default duration if not specified
  const animDuration = duration || 300

  switch (animationType) {
    case 'pulse':
      applyPulseAnimation(elementsArray, intensity, animDuration)
      break
    case 'flash':
      applyFlashAnimation(elementsArray, intensity, animDuration)
      break
    case 'scale':
      applyScaleAnimation(elementsArray, intensity, animDuration)
      break
    case 'glow':
      applyGlowAnimation(elementsArray, intensity, animDuration, colors)
      break
    case 'shake':
      applyShakeAnimation(elementsArray, intensity, animDuration)
      break
    case 'color':
      applyColorAnimation(elementsArray, intensity, animDuration, colors)
      break
    case 'border-pulse':
      applyBorderPulseAnimation(elementsArray, intensity, animDuration, colors)
      break
    default:
      console.warn('Unknown animation type:', animationType)
  }
}

/**
 * Pulse Animation: Opacity change
 */
function applyPulseAnimation(elements, intensity, duration) {
  const minOpacity = 1 - (intensity / 100) * 0.3 // 0.7 - 1.0 range

  elements.forEach(el => {
    const originalOpacity = el.style.opacity || '1'

    // Animate using Web Animations API
    el.animate([
      { opacity: minOpacity },
      { opacity: 1 }
    ], {
      duration,
      easing: 'ease-out'
    })
  })
}

/**
 * Flash Animation: Brightness burst
 */
function applyFlashAnimation(elements, intensity, duration) {
  const maxBrightness = 1 + (intensity / 100) * 0.5 // 1.0 - 1.5 range

  elements.forEach(el => {
    el.animate([
      { filter: `brightness(${maxBrightness})` },
      { filter: 'brightness(1)' }
    ], {
      duration,
      easing: 'ease-out'
    })
  })
}

/**
 * Scale Animation: Size change
 */
function applyScaleAnimation(elements, intensity, duration) {
  const maxScale = 1 + (intensity / 100) * 0.1 // 1.0 - 1.1 range

  elements.forEach(el => {
    el.animate([
      { transform: `scale(${maxScale})` },
      { transform: 'scale(1)' }
    ], {
      duration,
      easing: 'ease-out'
    })
  })
}

/**
 * Glow Animation: Box-shadow effect
 */
function applyGlowAnimation(elements, intensity, duration, colors) {
  const glowColor = colors[0] || '#6366f1'
  const blurRadius = (intensity / 100) * 30 // 0-30px blur
  const spreadRadius = (intensity / 100) * 10 // 0-10px spread

  elements.forEach(el => {
    const originalBoxShadow = getComputedStyle(el).boxShadow

    el.animate([
      { boxShadow: `0 0 ${blurRadius}px ${spreadRadius}px ${glowColor}` },
      { boxShadow: originalBoxShadow === 'none' ? 'none' : originalBoxShadow }
    ], {
      duration,
      easing: 'ease-out'
    })
  })
}

/**
 * Shake Animation: Horizontal translation
 */
function applyShakeAnimation(elements, intensity, duration) {
  const shakeAmount = (intensity / 100) * 10 // 0-10px shake

  elements.forEach(el => {
    el.animate([
      { transform: `translateX(-${shakeAmount}px)` },
      { transform: `translateX(${shakeAmount}px)` },
      { transform: 'translateX(0)' }
    ], {
      duration,
      easing: 'ease-in-out'
    })
  })
}

/**
 * Color Animation: Background color transition
 */
function applyColorAnimation(elements, intensity, duration, colors) {
  if (!colors || colors.length === 0) {
    colors = ['#6366f1', '#8b5cf6', '#ec4899']
  }

  const randomColor = colors[Math.floor(Math.random() * colors.length)]

  elements.forEach(el => {
    const originalBg = getComputedStyle(el).backgroundColor
    const opacity = intensity / 100

    // Create semi-transparent overlay color
    const overlayColor = hexToRgba(randomColor, opacity * 0.3)

    el.animate([
      { backgroundColor: overlayColor },
      { backgroundColor: originalBg }
    ], {
      duration,
      easing: 'ease-out'
    })
  })
}

/**
 * Border Pulse Animation: Border width/color change
 */
function applyBorderPulseAnimation(elements, intensity, duration, colors) {
  const borderColor = colors[0] || '#6366f1'
  const maxBorderWidth = 2 + (intensity / 100) * 4 // 2-6px border

  elements.forEach(el => {
    const originalBorder = getComputedStyle(el).border

    el.animate([
      { border: `${maxBorderWidth}px solid ${borderColor}` },
      { border: originalBorder || '1px solid transparent' }
    ], {
      duration,
      easing: 'ease-out'
    })
  })
}

/**
 * Helper: Convert hex color to rgba
 */
function hexToRgba(hex, alpha = 1) {
  // Remove # if present
  hex = hex.replace('#', '')

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Apply CSS class-based animation (alternative approach)
 */
export function applyClassAnimation(elements, className, duration) {
  if (!elements || elements.length === 0) return

  const elementsArray = Array.from(elements)

  elementsArray.forEach(el => {
    // Add class
    el.classList.add(className)

    // Remove class after duration
    setTimeout(() => {
      el.classList.remove(className)
    }, duration)
  })
}

/**
 * Check if Web Animations API is supported
 */
export function supportsWebAnimations() {
  return typeof Element.prototype.animate === 'function'
}

/**
 * Performance check: Get current FPS
 */
let lastFrameTime = performance.now()
let frameCount = 0
let currentFPS = 60

export function getFPS() {
  const now = performance.now()
  frameCount++

  if (now >= lastFrameTime + 1000) {
    currentFPS = Math.round((frameCount * 1000) / (now - lastFrameTime))
    frameCount = 0
    lastFrameTime = now
  }

  return currentFPS
}

/**
 * Start FPS monitoring
 */
export function startFPSMonitor(callback, threshold = 30) {
  let monitorInterval = setInterval(() => {
    const fps = getFPS()
    if (fps < threshold && callback) {
      callback(fps)
    }
  }, 2000)

  return monitorInterval
}
