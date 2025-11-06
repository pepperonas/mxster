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
 * @returns Validation result with matches and correct count
 */
export function validateGuess(
  guessTitle: string,
  guessArtist: string,
  guessYear: string,
  song: Song
): GuessValidationResult {
  // Title match (fuzzy matching with dynamic tolerance based on text length)
  const titleMatch = guessTitle ? fuzzyMatch(guessTitle, song.title) : false

  // Artist match (fuzzy matching with dynamic tolerance based on text length)
  const artistMatch = guessArtist ? fuzzyMatch(guessArtist, song.artist) : false

  // Year match (exact match required)
  const yearNum = parseInt(guessYear)
  const yearMatch = !isNaN(yearNum) && yearNum === song.year

  // Calculate year difference for feedback
  // If year is not provided or invalid, set difference to 9999 (no points)
  const yearDifference = !isNaN(yearNum) ? Math.abs(yearNum - song.year) : 9999

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
 * @param points - Points earned (optional)
 * @param guessDetails - Detailed guess results (optional, for achievements)
 * @returns New timeline (sorted by year)
 */
export function placeCardInTimeline(
  timeline: Song[],
  song: Song,
  points?: number,
  guessDetails?: {
    titleCorrect: boolean
    artistCorrect: boolean
    yearPoints: 0 | 1 | 2 | 5
  }
): Song[] {
  // Add points and guessDetails to song if provided (Guess Mode)
  const songWithMetadata = {
    ...song,
    ...(points !== undefined && { points }),
    ...(guessDetails && { guessDetails })
  }
  const newTimeline = [...timeline, songWithMetadata]
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
 * Calculate points for Hardcore mode
 * Title: 5 points
 * Artist: 5 points
 * Year: 5 points (exact), 2 points (±1 year), 1 point (±2 years)
 * Max 15 points per song
 */
export function calculatePoints(
  titleMatch: boolean,
  artistMatch: boolean,
  yearDifference: number
): number {
  let points = 0

  // Title: 5 points
  if (titleMatch) {
    points += 5
  }

  // Artist: 5 points
  if (artistMatch) {
    points += 5
  }

  // Year: 5/2/1 points based on difference
  if (yearDifference === 0) {
    points += 5
  } else if (yearDifference === 1) {
    points += 2
  } else if (yearDifference === 2) {
    points += 1
  }

  return points
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

  // HARDCORE MODE: All players must have 10 cards, then highest score wins
  if (gameMode === 'hardcore') {
    // Current player has 10 cards
    if (player.cards >= 10) {
      // Check if ALL players have 10 cards
      const allPlayersFinished = players.every((p) => p.cards >= 10)

      if (allPlayersFinished) {
        // Find maximum score
        const highestScore = Math.max(...players.map((p) => p.score))

        // Find all players with highest score
        const playersWithHighestScore = players
          .map((p, idx) => ({ player: p, index: idx }))
          .filter(({ player }) => player.score === highestScore)

        // Tie-breaking logic:
        // 1. Most cards wins (more attempts with equal score = better)
        // 2. If still tied, currentPlayer wins (last to finish)
        let winner = playersWithHighestScore[0]

        // Find player with most cards among tied players
        const maxCards = Math.max(...playersWithHighestScore.map((p) => p.player.cards))
        const playersWithMostCards = playersWithHighestScore.filter(
          (p) => p.player.cards === maxCards
        )

        // If still tied, currentPlayer wins
        const currentPlayerInTie = playersWithMostCards.find(({ index }) => index === currentPlayer)
        if (currentPlayerInTie) {
          winner = currentPlayerInTie
        } else {
          winner = playersWithMostCards[0]
        }

        return {
          gameOver: true,
          winner: winner.player,
          winnerIndex: winner.index,
          message: `${winner.player.name} gewinnt mit ${winner.player.score} Punkten!`
        }
      }
    }

    return noWinner
  }

  // TIMELINE PERSONAL: First player to reach 10 cards wins
  if (gameMode === 'timeline_personal') {
    if (player.cards >= 10) {
      return {
        gameOver: true,
        winner: player,
        winnerIndex: currentPlayer,
        message: `${player.name} hat 10 Karten platziert und gewinnt!`
      }
    }

    return noWinner
  }

  // TIMELINE GLOBAL: After 10 total cards placed, player with most cards wins
  if (gameMode === 'timeline_global') {
    // Count total cards placed across all players
    const totalCards = players.reduce((sum, p) => sum + p.cards, 0)

    if (totalCards >= 10) {
      // Find maximum card count
      const maxCards = Math.max(...players.map((p) => p.cards))

      // Find all players with maximum card count
      const playersWithMaxCards = players
        .map((p, idx) => ({ player: p, index: idx }))
        .filter(({ player }) => player.cards === maxCards)

      // Tie-breaking logic:
      // 1. If currentPlayer has max cards, they win (just placed the 10th card)
      // 2. Otherwise, the player with highest score wins
      // 3. If still tied or no scores, first player in list wins
      let winner = playersWithMaxCards[0]

      // Check if currentPlayer is in the tie
      const currentPlayerInTie = playersWithMaxCards.find(({ index }) => index === currentPlayer)
      if (currentPlayerInTie) {
        winner = currentPlayerInTie
      } else {
        // Find player with highest score among tied players
        for (const p of playersWithMaxCards) {
          if (p.player.score > winner.player.score) {
            winner = p
          }
        }
      }

      return {
        gameOver: true,
        winner: winner.player,
        winnerIndex: winner.index,
        message: `${winner.player.name} gewinnt mit ${winner.player.cards} korrekt platzierten Karten!`
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
  if (gameVariant === 'physical' && gameMode === 'hardcore') {
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
