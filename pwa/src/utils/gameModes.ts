/**
 * Game Mode Constants and Utilities
 * Defines the three game modes for mxster
 */

import type { GameMode, GameVariant, GameModeInfo, GameVariantInfo, Song } from '@/types'

// Game Mode Constants
export const GAME_MODES: Record<string, GameMode> = {
  GUESS: 'guess' as GameMode,
  TIMELINE_PERSONAL: 'timeline_personal' as GameMode,
  TIMELINE_GLOBAL: 'timeline_global' as GameMode
}

// Game Variant Constants
export const GAME_VARIANTS: Record<string, GameVariant> = {
  PHYSICAL: 'physical' as GameVariant,
  VIRTUAL: 'virtual' as GameVariant
}

// Game Variant Metadata
export const GAME_VARIANT_INFO: Record<GameVariant, GameVariantInfo & { requiresCamera: boolean }> = {
  physical: {
    name: 'Physische Karten',
    description: 'Spiele mit 3D-gedruckten oder PDF-Karten und QR-Scanner',
    icon: '📱',
    requirements: ['Smartphone mit Kamera', 'Physische Karten (PDF oder 3D-Druck)'],
    features: ['QR-Code Scanner', 'DJ spielt mit', 'Taschenlampe'],
    requiresCamera: true
  },
  virtual: {
    name: 'Virtuelle Karten',
    description: 'Spiele komplett digital ohne physische Karten',
    icon: '💻',
    requirements: ['Keine'],
    features: ['Zufalls-Song Button', 'Alle Spieler raten'],
    requiresCamera: false
  }
}

// Game Mode Metadata
export const GAME_MODE_INFO: Record<GameMode, GameModeInfo & {
  maxPointsPerRound: number
  requiresInput: boolean
  requiresTimeline: boolean
  sharedTimeline?: boolean
}> = {
  guess: {
    name: 'Ratespiel',
    description: 'Rate Jahr, Titel und Interpret - 1 Punkt pro richtigem Parameter',
    icon: '🎯',
    rules: [
      'Höre den Song',
      'Rate Jahr, Titel und Interpret',
      'Bekomme 1 Punkt pro richtiger Antwort (max. 3 Punkte)',
      'Karten werden automatisch chronologisch sortiert'
    ],
    scoring: '1 Punkt pro korrektem Parameter (Jahr, Titel, Interpret)',
    features: ['Fuzzy Matching', 'Automatische Timeline', 'Punkte-System'],
    maxPointsPerRound: 3,
    requiresInput: true,
    requiresTimeline: false
  },
  timeline_personal: {
    name: 'Persönliche Timeline',
    description: 'Jeder Spieler hat seine eigene Timeline - sortiere die Karten chronologisch',
    icon: '👤',
    rules: [
      'Höre den Song',
      'Rate optional Jahr, Titel und Interpret (keine Punkte)',
      'Platziere die Karte in deiner persönlichen Timeline',
      'Karte bleibt nur, wenn chronologisch korrekt'
    ],
    scoring: 'Erste Person mit 10 korrekt platzierten Karten gewinnt',
    features: ['Persönliche Timeline', 'Manuelle Platzierung', 'Chronologische Validierung'],
    maxPointsPerRound: 1,
    requiresInput: false,
    requiresTimeline: true,
    sharedTimeline: false
  },
  timeline_global: {
    name: 'Globale Timeline',
    description: 'Alle Spieler teilen eine Timeline - falsche Karten werden entfernt',
    icon: '🌍',
    rules: [
      'Höre den Song',
      'Rate optional Jahr, Titel und Interpret (keine Punkte)',
      'Platziere die Karte in der globalen Timeline',
      'Falsche Platzierungen werden entfernt'
    ],
    scoring: 'Erste Person mit 10 korrekt platzierten Karten gewinnt',
    features: ['Gemeinsame Timeline', 'Kollaboratives Spiel', 'Höherer Schwierigkeitsgrad'],
    maxPointsPerRound: 1,
    requiresInput: false,
    requiresTimeline: true,
    sharedTimeline: true
  }
}

/**
 * Validate if a mode is valid
 */
export function isValidMode(mode: string): mode is GameMode {
  return Object.values(GAME_MODES).includes(mode as GameMode)
}

/**
 * Validate if a variant is valid
 */
export function isValidVariant(variant: string): variant is GameVariant {
  return Object.values(GAME_VARIANTS).includes(variant as GameVariant)
}

/**
 * Get mode info
 */
export function getModeInfo(mode: GameMode): typeof GAME_MODE_INFO[GameMode] | null {
  return GAME_MODE_INFO[mode] || null
}

/**
 * Get variant info
 */
export function getVariantInfo(variant: GameVariant): typeof GAME_VARIANT_INFO[GameVariant] | null {
  return GAME_VARIANT_INFO[variant] || null
}

/**
 * Calculate points for guess mode
 * Returns 0-3 points based on correct parameters
 * Note: This is a simple implementation. For production, use textMatcher.ts
 */
export function calculateGuessPoints(guess: {
  year?: number | string
  title?: string
  artist?: string
}, song: Song): number {
  let points = 0

  // Check Jahr (Year)
  if (guess.year && parseInt(String(guess.year)) === song.year) {
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
export function validateTimelinePlacement(
  song: Song,
  timeline: Song[],
  insertIndex: number
): boolean {
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

/**
 * Insert song into timeline at correct position (chronologically)
 */
export function insertSongIntoTimeline(song: Song, timeline: Song[]): Song[] {
  const newTimeline = [...timeline, song]
  return newTimeline.sort((a, b) => a.year - b.year)
}

/**
 * Get win condition for a game mode
 */
export function getWinCondition(_mode: GameMode): number {
  return 10 // All modes currently use 10 cards as win condition
}

/**
 * Check if game mode requires DJ
 */
export function requiresDJ(mode: GameMode, variant: GameVariant): boolean {
  return variant === GAME_VARIANTS.PHYSICAL && mode === GAME_MODES.GUESS
}
