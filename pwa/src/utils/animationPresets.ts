/**
 * Animation Presets
 *
 * Pre-configured animation settings for quick setup
 * Export presets that can be loaded via BeatSyncConfig
 */

export const ANIMATION_TYPES = {
  PULSE: 'pulse',
  FLASH: 'flash',
  SCALE: 'scale',
  GLOW: 'glow',
  SHAKE: 'shake',
  COLOR: 'color',
  BORDER_PULSE: 'border-pulse'
} as const

export type AnimationType = typeof ANIMATION_TYPES[keyof typeof ANIMATION_TYPES]

export const SYNC_TYPES = {
  BEAT: 'beat',
  BAR: 'bar',
  SECTION: 'section',
  TATUM: 'tatum'
} as const

export type SyncType = typeof SYNC_TYPES[keyof typeof SYNC_TYPES]

/**
 * Animation type info structure
 */
export interface AnimationTypeInfo {
  name: string
  description: string
  icon: string
}

/**
 * Animation type descriptions
 */
export const ANIMATION_TYPE_INFO: Record<AnimationType, AnimationTypeInfo> = {
  [ANIMATION_TYPES.PULSE]: {
    name: 'Pulse',
    description: 'Sanfte Opacity-Änderung',
    icon: '💫'
  },
  [ANIMATION_TYPES.FLASH]: {
    name: 'Flash',
    description: 'Schneller Helligkeits-Burst',
    icon: '⚡'
  },
  [ANIMATION_TYPES.SCALE]: {
    name: 'Scale',
    description: 'Größenänderung',
    icon: '📏'
  },
  [ANIMATION_TYPES.GLOW]: {
    name: 'Glow',
    description: 'Leuchteffekt (Box-Shadow)',
    icon: '✨'
  },
  [ANIMATION_TYPES.SHAKE]: {
    name: 'Shake',
    description: 'Leichte Bewegung',
    icon: '🔃'
  },
  [ANIMATION_TYPES.COLOR]: {
    name: 'Color',
    description: 'Farbwechsel',
    icon: '🎨'
  },
  [ANIMATION_TYPES.BORDER_PULSE]: {
    name: 'Border Pulse',
    description: 'Rahmen-Animation',
    icon: '🔲'
  }
}

/**
 * Default color palettes for animations
 */
export const COLOR_PALETTES = {
  BLUE: ['#3b82f6', '#6366f1', '#8b5cf6'],
  GREEN: ['#10b981', '#14b8a6', '#06b6d4'],
  PURPLE: ['#8b5cf6', '#a855f7', '#c026d3'],
  RED: ['#ef4444', '#f59e0b', '#ec4899'],
  RAINBOW: ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']
} as const

/**
 * Element preset structure
 */
export interface ElementPreset {
  id: string
  selector: string
  name: string
  icon: string
  recommended: AnimationType[]
}

/**
 * Element selector presets
 */
export const ELEMENT_PRESETS: ElementPreset[] = [
  {
    id: 'background',
    selector: 'body',
    name: 'Hintergrund',
    icon: '🖼️',
    recommended: [ANIMATION_TYPES.PULSE, ANIMATION_TYPES.FLASH, ANIMATION_TYPES.COLOR]
  },
  {
    id: 'timeline-cards',
    selector: '.timeline-card',
    name: 'Timeline-Karten',
    icon: '🎴',
    recommended: [ANIMATION_TYPES.SCALE, ANIMATION_TYPES.GLOW, ANIMATION_TYPES.PULSE]
  },
  {
    id: 'score-overview',
    selector: '.score-overview',
    name: 'Score-Übersicht',
    icon: '🏆',
    recommended: [ANIMATION_TYPES.GLOW, ANIMATION_TYPES.PULSE]
  },
  {
    id: 'player-area',
    selector: '#audio-player',
    name: 'Player-Bereich',
    icon: '▶️',
    recommended: [ANIMATION_TYPES.PULSE, ANIMATION_TYPES.GLOW]
  },
  {
    id: 'buttons',
    selector: '.btn',
    name: 'Buttons',
    icon: '🔘',
    recommended: [ANIMATION_TYPES.GLOW, ANIMATION_TYPES.SCALE, ANIMATION_TYPES.BORDER_PULSE]
  }
]
