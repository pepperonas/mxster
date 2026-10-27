/**
 * Game Mode Constants and Utilities
 * Defines the three game modes for mxtape
 */

import type { GameMode, GameModeInfo, Song } from '@/types'
import { msg } from '@/i18n'
import { modesText } from '@/i18n/messages/modes'

// Game Mode Constants
export const GAME_MODES: Record<string, GameMode> = {
  HARDCORE: 'hardcore' as GameMode,
  TIMELINE_PERSONAL: 'timeline_personal' as GameMode,
  TIMELINE_GLOBAL: 'timeline_global' as GameMode
}

// Game Mode Metadata
type ModeInfo = GameModeInfo & {
  maxPointsPerRound: number
  requiresInput: boolean
  requiresTimeline: boolean
  sharedTimeline?: boolean
}

/** Built on each read so the texts follow the app language. */
function modeInfo(mode: GameMode): ModeInfo {
  const t = msg(modesText)
  switch (mode) {
    case 'hardcore':
      return {
        name: t.infoHardcoreName,
        description: t.infoHardcoreDescription,
        icon: 'flame',
        rules: [
          t.infoHardcoreRule1,
          t.infoHardcoreRule2,
          t.infoHardcoreRule3,
          t.infoHardcoreRule4,
          t.infoHardcoreRule5,
          t.infoHardcoreRule6
        ],
        scoring: t.infoHardcoreScoring,
        features: [t.infoHardcoreFeature1, t.infoHardcoreFeature2, t.infoHardcoreFeature3],
        maxPointsPerRound: 15,
        requiresInput: true,
        requiresTimeline: false
      }
    case 'timeline_personal':
      return {
        name: t.infoPersonalName,
        description: t.infoPersonalDescription,
        icon: 'person',
        rules: [t.infoListen, t.infoOptionalGuess, t.infoPersonalPlace, t.infoPersonalKeep],
        scoring: t.infoTimelineScoring,
        features: [t.infoPersonalFeature1, t.infoPersonalFeature2, t.infoPersonalFeature3],
        maxPointsPerRound: 1,
        requiresInput: false,
        requiresTimeline: true,
        sharedTimeline: false
      }
    default:
      return {
        name: t.infoGlobalName,
        description: t.infoGlobalDescription,
        icon: 'globe',
        rules: [t.infoListen, t.infoOptionalGuess, t.infoGlobalPlace, t.infoGlobalRemoved],
        scoring: t.infoTimelineScoring,
        features: [t.infoGlobalFeature1, t.infoGlobalFeature2, t.infoGlobalFeature3],
        maxPointsPerRound: 1,
        requiresInput: false,
        requiresTimeline: true,
        sharedTimeline: true
      }
  }
}

export const GAME_MODE_INFO: Record<GameMode, ModeInfo> = {
  get hardcore() {
    return modeInfo('hardcore' as GameMode)
  },
  get timeline_personal() {
    return modeInfo('timeline_personal' as GameMode)
  },
  get timeline_global() {
    return modeInfo('timeline_global' as GameMode)
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

