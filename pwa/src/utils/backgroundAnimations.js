/**
 * Background Animations for Beat Sync
 * Simplified system that only animates the page background
 */

// Available background animation types
export const BACKGROUND_ANIMATIONS = {
  PULSE: 'pulse',
  WAVE: 'wave',
  FLASH: 'flash',
  GRADIENT: 'gradient',
  GLOW: 'glow',
  NONE: 'none'
}

/**
 * Apply beat animation to background
 */
export function applyBackgroundBeat(animationType, intensity = 50) {
  const background = document.body

  if (!background || animationType === BACKGROUND_ANIMATIONS.NONE) {
    return
  }

  const duration = 300 // ms

  switch (animationType) {
    case BACKGROUND_ANIMATIONS.PULSE:
      applyPulse(background, intensity, duration)
      break
    case BACKGROUND_ANIMATIONS.WAVE:
      applyWave(background, intensity, duration)
      break
    case BACKGROUND_ANIMATIONS.FLASH:
      applyFlash(background, intensity, duration)
      break
    case BACKGROUND_ANIMATIONS.GRADIENT:
      applyGradient(background, intensity, duration)
      break
    case BACKGROUND_ANIMATIONS.GLOW:
      applyGlow(background, intensity, duration)
      break
  }
}

/**
 * Pulse: Subtle brightness change
 */
function applyPulse(element, intensity, duration) {
  const brightness = 1 + (intensity / 100) * 0.2 // 1.0 - 1.2

  element.animate([
    { filter: `brightness(${brightness})` },
    { filter: 'brightness(1)' }
  ], {
    duration,
    easing: 'ease-out'
  })
}

/**
 * Wave: Gradient position shift
 */
function applyWave(element, intensity, duration) {
  const shift = (intensity / 100) * 20 // 0-20%

  element.animate([
    { backgroundPosition: `${shift}% 50%` },
    { backgroundPosition: '0% 50%' }
  ], {
    duration: duration * 2,
    easing: 'ease-in-out'
  })
}

/**
 * Flash: Quick brightness burst
 */
function applyFlash(element, intensity, duration) {
  const brightness = 1 + (intensity / 100) * 0.4 // 1.0 - 1.4

  element.animate([
    { filter: `brightness(${brightness})` },
    { filter: 'brightness(1)' }
  ], {
    duration: duration / 2,
    easing: 'ease-out'
  })
}

/**
 * Gradient: Color shift
 */
function applyGradient(element, intensity, duration) {
  const hueShift = (intensity / 100) * 30 // 0-30deg

  element.animate([
    { filter: `hue-rotate(${hueShift}deg)` },
    { filter: 'hue-rotate(0deg)' }
  ], {
    duration: duration * 2,
    easing: 'ease-in-out'
  })
}

/**
 * Glow: Box shadow pulse
 */
function applyGlow(element, intensity, duration) {
  const glowSize = (intensity / 100) * 50 // 0-50px
  const glowColor = 'rgba(99, 102, 241, 0.3)' // Accent color with transparency

  element.animate([
    { boxShadow: `inset 0 0 ${glowSize}px ${glowColor}` },
    { boxShadow: 'none' }
  ], {
    duration,
    easing: 'ease-out'
  })
}

/**
 * Get animation display name
 */
export function getAnimationName(type) {
  const names = {
    [BACKGROUND_ANIMATIONS.PULSE]: 'Pulsieren',
    [BACKGROUND_ANIMATIONS.WAVE]: 'Welle',
    [BACKGROUND_ANIMATIONS.FLASH]: 'Blitz',
    [BACKGROUND_ANIMATIONS.GRADIENT]: 'Farbverlauf',
    [BACKGROUND_ANIMATIONS.GLOW]: 'Leuchten',
    [BACKGROUND_ANIMATIONS.NONE]: 'Aus'
  }
  return names[type] || type
}

/**
 * Get animation description
 */
export function getAnimationDescription(type) {
  const descriptions = {
    [BACKGROUND_ANIMATIONS.PULSE]: 'Sanftes Aufleuchten',
    [BACKGROUND_ANIMATIONS.WAVE]: 'Welleneffekt',
    [BACKGROUND_ANIMATIONS.FLASH]: 'Schneller Blitz',
    [BACKGROUND_ANIMATIONS.GRADIENT]: 'Farbwechsel',
    [BACKGROUND_ANIMATIONS.GLOW]: 'Inneres Leuchten',
    [BACKGROUND_ANIMATIONS.NONE]: 'Keine Animation'
  }
  return descriptions[type] || ''
}
