/**
 * Game Logic Service
 * Core game mechanics for mxster
 */

import type { Song, Player, GameMode } from '@/types'
import { fuzzyMatch } from '@/utils/textMatcher'

// ============================================================================
// Guess Validation
// ============================================================================

interface GuessValidationResult {
  titleMatch: boolean
  artistMatch: boolean
  yearMatch: boolean
  correctCount: number
  yearDifference: number
}

/**
 * Check if player's guess is correct
 * @param guessTitle - Guessed title
 * @param guessArtist - Guessed artist
 * @param guessYear - Guessed year
 * @param song - Correct song
 * @param maxErrors - Maximum allowed typos per field (default: 3)
 * @returns Validation result with matches and correct count
 */
export function validateGuess(
  guessTitle: string,
  guessArtist: string,
  guessYear: string,
  song: Song,
  maxErrors: number = 3
): GuessValidationResult {
  // Title match (fuzzy matching with 3 typos tolerance)
  const titleMatch = guessTitle ? fuzzyMatch(guessTitle, song.title, maxErrors) : false

  // Artist match (fuzzy matching with 3 typos tolerance)
  const artistMatch = guessArtist ? fuzzyMatch(guessArtist, song.artist, maxErrors) : false

  // Year match (exact match required)
  const yearNum = parseInt(guessYear)
  const yearMatch = !isNaN(yearNum) && yearNum === song.year

  // Calculate year difference for feedback
  const yearDifference = !isNaN(yearNum) ? Math.abs(yearNum - song.year) : 0

  // Count correct answers
  const correctCount = (titleMatch ? 1 : 0) + (artistMatch ? 1 : 0) + (yearMatch ? 1 : 0)

  return {
    titleMatch,
    artistMatch,
    yearMatch,
    correctCount,
    yearDifference
  }
}

// ============================================================================
// Timeline Management
// ============================================================================

/**
 * Place song chronologically in timeline
 * @param timeline - Current timeline
 * @param song - Song to insert
 * @returns New timeline (sorted by year)
 */
export function placeCardInTimeline(timeline: Song[], song: Song, points?: number): Song[] {
  // Add points to song if provided (Guess Mode)
  const songWithPoints = points !== undefined ? { ...song, points } : song
  const newTimeline = [...timeline, songWithPoints]
  return sortTimelineByYear(newTimeline)
}

/**
 * Sort timeline by year (ascending)
 */
export function sortTimelineByYear(timeline: Song[]): Song[] {
  return [...timeline].sort((a, b) => a.year - b.year)
}

/**
 * Check if timeline is correctly sorted
 */
export function isTimelineValid(timeline: Song[]): boolean {
  if (timeline.length <= 1) return true

  for (let i = 1; i < timeline.length; i++) {
    if (timeline[i].year < timeline[i - 1].year) {
      return false
    }
  }

  return true
}

// ============================================================================
// Score Calculation
// ============================================================================

/**
 * Calculate points for guess (only in Guess Mode)
 * Each correct answer = 1 point (max 3 points)
 */
export function calculatePoints(correctCount: number): number {
  return Math.max(0, Math.min(3, correctCount))
}

/**
 * Update player score
 */
export function updatePlayerScore(player: Player, points: number): Player {
  return {
    ...player,
    score: player.score + points
  }
}

/**
 * Increment player cards count
 */
export function incrementPlayerCards(player: Player): Player {
  return {
    ...player,
    cards: player.cards + 1
  }
}

// ============================================================================
// Win Conditions
// ============================================================================

interface WinConditionResult {
  gameOver: boolean
  winner: Player | null
  winnerIndex: number
  message: string
}

/**
 * Check if game is over and determine winner
 */
export function checkWinCondition(
  players: Player[],
  currentPlayer: number,
  gameMode: GameMode
): WinConditionResult {
  const player = players[currentPlayer]

  // Default: No winner yet
  const noWinner: WinConditionResult = {
    gameOver: false,
    winner: null,
    winnerIndex: -1,
    message: ''
  }

  // GUESS MODE: All players must have 10 cards, then highest score wins
  if (gameMode === 'guess') {
    // Current player has 10 cards
    if (player.cards >= 10) {
      // Check if ALL players have 10 cards
      const allPlayersFinished = players.every((p) => p.cards >= 10)

      if (allPlayersFinished) {
        // Find player with highest score
        let highestScore = -1
        let winnerIdx = -1

        players.forEach((p, idx) => {
          if (p.score > highestScore) {
            highestScore = p.score
            winnerIdx = idx
          }
        })

        const winner = players[winnerIdx]

        return {
          gameOver: true,
          winner,
          winnerIndex: winnerIdx,
          message: `${winner.name} gewinnt mit ${winner.score} Punkten!`
        }
      }
    }

    return noWinner
  }

  // TIMELINE MODES: First player to reach 11 cards wins (first card is 0)
  if (gameMode === 'timeline_personal' || gameMode === 'timeline_global') {
    if (player.cards >= 11) {
      return {
        gameOver: true,
        winner: player,
        winnerIndex: currentPlayer,
        message: `${player.name} hat 10 Karten platziert und gewinnt!`
      }
    }

    return noWinner
  }

  return noWinner
}

// ============================================================================
// Random Song Selection (Virtual Mode)
// ============================================================================

/**
 * Select random song from available songs
 * @param allSongs - All songs in database
 * @param playedSongs - Array of already played song IDs
 * @returns Random song or null if all songs played
 */
export function selectRandomSong(allSongs: Song[], playedSongs: string[]): Song | null {
  // Filter out already played songs
  const availableSongs = allSongs.filter((song) => {
    const songId = song.spotifyId || song.id
    return !playedSongs.includes(songId)
  })

  // No more songs available
  if (availableSongs.length === 0) {
    return null
  }

  // Select random song
  const randomIndex = Math.floor(Math.random() * availableSongs.length)
  return availableSongs[randomIndex]
}

/**
 * Get count of remaining songs
 */
export function getRemainingSongsCount(allSongs: Song[], playedSongs: string[]): number {
  return allSongs.filter((song) => {
    const songId = song.spotifyId || song.id
    return !playedSongs.includes(songId)
  }).length
}

// ============================================================================
// Player Management
// ============================================================================

/**
 * Get next player index (circular)
 */
export function getNextPlayerIndex(currentPlayer: number, totalPlayers: number): number {
  return (currentPlayer + 1) % totalPlayers
}

/**
 * Get next DJ index (only rotates when turn returns to DJ in Physical Guess Mode)
 */
export function getNextDJIndex(
  currentPlayer: number,
  currentDJ: number,
  totalPlayers: number,
  gameMode: GameMode,
  gameVariant: 'physical' | 'virtual'
): { nextPlayer: number; nextDJ: number } {
  let nextPlayer = (currentPlayer + 1) % totalPlayers

  // DJ rotation logic (only Physical Guess Mode)
  if (gameVariant === 'physical' && gameMode === 'guess') {
    // If turn returns to DJ, DJ switches to next player
    if (nextPlayer === currentDJ) {
      const nextDJ = (currentDJ + 1) % totalPlayers
      nextPlayer = (nextPlayer + 1) % totalPlayers
      return { nextPlayer, nextDJ }
    }
  }

  return { nextPlayer, nextDJ: currentDJ }
}

// ============================================================================
// Song Management
// ============================================================================

/**
 * Mark song as played
 */
export function addToPlayedSongs(playedSongs: string[], song: Song): string[] {
  const songId = song.spotifyId || song.id

  if (playedSongs.includes(songId)) {
    return playedSongs
  }

  return [...playedSongs, songId]
}

/**
 * Check if song was already played
 */
export function isSongPlayed(playedSongs: string[], song: Song): boolean {
  const songId = song.spotifyId || song.id
  return playedSongs.includes(songId)
}
