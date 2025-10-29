/**
 * Game Mode Constants and Utilities
 * Defines the three game modes for mxster
 */

// Game Mode Constants
export const GAME_MODES = {
  GUESS: 'guess',
  TIMELINE_PERSONAL: 'timeline_personal',
  TIMELINE_GLOBAL: 'timeline_global'
}

// Game Variant Constants
export const GAME_VARIANTS = {
  PHYSICAL: 'physical',  // Mit physischen Karten (QR-Scanner)
  VIRTUAL: 'virtual'     // Rein virtuell ohne physische Karten
}

// Game Variant Metadata
export const GAME_VARIANT_INFO = {
  [GAME_VARIANTS.PHYSICAL]: {
    name: 'Physische Karten',
    description: 'Spiele mit 3D-gedruckten oder PDF-Karten und QR-Scanner',
    icon: '📱',
    requiresCamera: true
  },
  [GAME_VARIANTS.VIRTUAL]: {
    name: 'Virtuelle Karten',
    description: 'Spiele komplett digital ohne physische Karten',
    icon: '💻',
    requiresCamera: false
  }
}

// Game Mode Metadata
export const GAME_MODE_INFO = {
  [GAME_MODES.GUESS]: {
    name: 'Ratespiel',
    description: 'Rate Jahr, Titel und Interpret - 1 Punkt pro richtigem Parameter',
    icon: '🎯',
    maxPointsPerRound: 3,
    requiresInput: true,
    requiresTimeline: false
  },
  [GAME_MODES.TIMELINE_PERSONAL]: {
    name: 'Timeline (Persönlich)',
    description: 'Jeder Spieler hat seine eigene Timeline - sortiere die Karten chronologisch',
    icon: '👤',
    maxPointsPerRound: 1,
    requiresInput: false,
    requiresTimeline: true,
    sharedTimeline: false
  },
  [GAME_MODES.TIMELINE_GLOBAL]: {
    name: 'Timeline (Global)',
    description: 'Alle Spieler teilen eine Timeline - falsche Karten werden entfernt',
    icon: '🌍',
    maxPointsPerRound: 1,
    requiresInput: false,
    requiresTimeline: true,
    sharedTimeline: true
  }
}

/**
 * Validate if a mode is valid
 */
export function isValidMode(mode) {
  return Object.values(GAME_MODES).includes(mode)
}

/**
 * Get mode info
 */
export function getModeInfo(mode) {
  return GAME_MODE_INFO[mode] || null
}

/**
 * Calculate points for guess mode
 * Returns 0-3 points based on correct parameters
 */
export function calculateGuessPoints(guess, song) {
  let points = 0

  // Check Jahr (Year)
  if (guess.year && parseInt(guess.year) === song.year) {
    points++
  }

  // Check Titel (Title) - case insensitive, trimmed
  if (guess.title && guess.title.trim().toLowerCase() === song.title.toLowerCase()) {
    points++
  }

  // Check Artist - case insensitive, trimmed
  if (guess.artist && guess.artist.trim().toLowerCase() === song.artist.toLowerCase()) {
    points++
  }

  return points
}

/**
 * Validate timeline placement
 * Checks if a song is correctly placed in the timeline
 */
export function validateTimelinePlacement(song, timeline, insertIndex) {
  // Empty timeline - always correct
  if (timeline.length === 0) {
    return true
  }

  // Check if song year is between neighbors
  const beforeSong = timeline[insertIndex - 1]
  const afterSong = timeline[insertIndex]

  // Check left neighbor
  if (beforeSong && song.year < beforeSong.year) {
    return false
  }

  // Check right neighbor
  if (afterSong && song.year > afterSong.year) {
    return false
  }

  return true
}
