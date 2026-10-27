/**
 * Game Mode Constants and Utilities
 * Defines the three game modes for mxster
 */

import type { GameMode, GameModeInfo, Song } from '@/types'

// Game Mode Constants
export const GAME_MODES: Record<string, GameMode> = {
  HARDCORE: 'hardcore' as GameMode,
  TIMELINE_PERSONAL: 'timeline_personal' as GameMode,
  TIMELINE_GLOBAL: 'timeline_global' as GameMode
}

// Game Mode Metadata
export const GAME_MODE_INFO: Record<GameMode, GameModeInfo & {
  maxPointsPerRound: number
  requiresInput: boolean
  requiresTimeline: boolean
  sharedTimeline?: boolean
}> = {
  hardcore: {
    name: 'Hardcore',
    description: 'Rate Jahr, Titel und Interpret - Maximale Punkte für perfekte Antworten',
    icon: 'flame',
    rules: [
      'Höre den Song',
      'Rate Jahr, Titel und Interpret',
      'Titel richtig: 5 Punkte',
      'Interpret richtig: 5 Punkte',
      'Jahr exakt: 5 Punkte | ±1 Jahr: 2 Punkte | ±2 Jahre: 1 Punkt',
      'Karten werden automatisch chronologisch sortiert'
    ],
    scoring: 'Titel: 5P | Interpret: 5P | Jahr: 5P/2P/1P (max. 15 Punkte)',
    features: ['Fuzzy Matching', 'Automatische Timeline', 'Punkte-System'],
    maxPointsPerRound: 15,
    requiresInput: true,
    requiresTimeline: false
  },
  timeline_personal: {
    name: 'Persönliche Timeline',
    description: 'Jeder Spieler hat seine eigene Timeline - sortiere die Karten chronologisch',
    icon: 'person',
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
    icon: 'globe',
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
 * Get mode info
 */
export function getModeInfo(mode: GameMode): typeof GAME_MODE_INFO[GameMode] | null {
  return GAME_MODE_INFO[mode] || null
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

