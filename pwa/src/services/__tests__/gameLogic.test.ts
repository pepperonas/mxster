/**
 * Game Logic Tests
 * Comprehensive tests for core game mechanics
 */

import { describe, it, expect } from 'vitest'
import { GameMode } from '@/types'
import {
  validateGuess,
  calculatePoints,
  checkWinCondition,
  placeCardInTimeline,
  sortTimelineByYear,
  isTimelineValid,
  selectRandomSong,
  getRemainingSongsCount,
  getNextPlayerIndex,
  getNextDJIndex,
  updatePlayerScore,
  incrementPlayerCards,
  addToPlayedSongs,
  isSongPlayed
} from '../gameLogic'
import type { Song, Player } from '@/types'

// ============================================================================
// Test Data
// ============================================================================

const createTestSong = (overrides: Partial<Song> = {}): Song => ({
  id: 'song_1',
  title: 'Billie Jean',
  artist: 'Michael Jackson',
  year: 1983,
  spotifyId: 'test123',
  previewUrl: 'https://preview.url',
  ...overrides
})

const createTestPlayer = (overrides: Partial<Player> = {}): Player => ({
  name: 'Test Player',
  cards: 0,
  score: 0,
  timeline: [],
  ...overrides
})

// ============================================================================
// Guess Validation Tests
// ============================================================================

describe('validateGuess', () => {
  const testSong = createTestSong()

  it('should match exact title, artist, and year', () => {
    const result = validateGuess('Billie Jean', 'Michael Jackson', '1983', testSong)

    expect(result.titleMatch).toBe(true)
    expect(result.artistMatch).toBe(true)
    expect(result.yearMatch).toBe(true)
    expect(result.correctCount).toBe(3)
    expect(result.yearDifference).toBe(0)
  })

  it('should handle typos with fuzzy matching', () => {
    // 1-2 char typos should still match
    const result = validateGuess('Billie Jeen', 'Michael Jakson', '1983', testSong)

    expect(result.titleMatch).toBe(true) // 1 char typo
    expect(result.artistMatch).toBe(true) // 1 char typo
    expect(result.yearMatch).toBe(true)
    expect(result.correctCount).toBe(3)
  })

  it('should calculate year difference correctly', () => {
    const result = validateGuess('Title', 'Artist', '1985', testSong)

    expect(result.yearDifference).toBe(2) // |1985 - 1983|
  })

  it('should handle empty inputs', () => {
    const result = validateGuess('', '', '', testSong)

    expect(result.titleMatch).toBe(false)
    expect(result.artistMatch).toBe(false)
    expect(result.yearMatch).toBe(false)
    expect(result.correctCount).toBe(0)
    expect(result.yearDifference).toBe(9999) // Empty input = no points
  })

  it('should handle invalid year input', () => {
    const result = validateGuess('Title', 'Artist', 'abc', testSong)

    expect(result.yearMatch).toBe(false)
    expect(result.yearDifference).toBe(9999) // Invalid input = no points
  })

  it('should match only title correctly', () => {
    const result = validateGuess('Billie Jean', 'Wrong Artist', '1999', testSong)

    expect(result.titleMatch).toBe(true)
    expect(result.artistMatch).toBe(false)
    expect(result.yearMatch).toBe(false)
    expect(result.correctCount).toBe(1)
  })

  it('should match only artist correctly', () => {
    const result = validateGuess('Wrong Title', 'Michael Jackson', '1999', testSong)

    expect(result.titleMatch).toBe(false)
    expect(result.artistMatch).toBe(true)
    expect(result.yearMatch).toBe(false)
    expect(result.correctCount).toBe(1)
  })

  it('should match only year correctly', () => {
    const result = validateGuess('Wrong Title', 'Wrong Artist', '1983', testSong)

    expect(result.titleMatch).toBe(false)
    expect(result.artistMatch).toBe(false)
    expect(result.yearMatch).toBe(true)
    expect(result.correctCount).toBe(1)
  })

  it('should handle case insensitive matching', () => {
    const result = validateGuess('BILLIE JEAN', 'MICHAEL JACKSON', '1983', testSong)

    expect(result.titleMatch).toBe(true)
    expect(result.artistMatch).toBe(true)
  })
})

// ============================================================================
// Score Calculation Tests
// ============================================================================

describe('calculatePoints', () => {
  it('should award 15 points for perfect guess (5+5+5)', () => {
    const points = calculatePoints(true, true, 0) // title + artist + exact year
    expect(points).toBe(15)
  })

  it('should award 12 points for ±1 year (5+5+2)', () => {
    const points = calculatePoints(true, true, 1)
    expect(points).toBe(12)
  })

  it('should award 11 points for ±2 years (5+5+1)', () => {
    const points = calculatePoints(true, true, 2)
    expect(points).toBe(11)
  })

  it('should award 10 points for title+artist only (5+5+0)', () => {
    const points = calculatePoints(true, true, 3) // year difference >2
    expect(points).toBe(10)
  })

  it('should award 5 points for title only', () => {
    const points = calculatePoints(true, false, 10)
    expect(points).toBe(5)
  })

  it('should award 5 points for artist only', () => {
    const points = calculatePoints(false, true, 10)
    expect(points).toBe(5)
  })

  it('should award 5 points for exact year only', () => {
    const points = calculatePoints(false, false, 0)
    expect(points).toBe(5)
  })

  it('should award 2 points for ±1 year only', () => {
    const points = calculatePoints(false, false, 1)
    expect(points).toBe(2)
  })

  it('should award 1 point for ±2 years only', () => {
    const points = calculatePoints(false, false, 2)
    expect(points).toBe(1)
  })

  it('should award 0 points for all wrong', () => {
    const points = calculatePoints(false, false, 10)
    expect(points).toBe(0)
  })

  it('should award 0 points when year is empty/invalid (9999)', () => {
    const points = calculatePoints(false, false, 9999)
    expect(points).toBe(0)
  })

  it('should handle title+year combination (5+5)', () => {
    const points = calculatePoints(true, false, 0)
    expect(points).toBe(10)
  })

  it('should handle artist+year combination (5+5)', () => {
    const points = calculatePoints(false, true, 0)
    expect(points).toBe(10)
  })
})

// ============================================================================
// Timeline Management Tests
// ============================================================================

describe('placeCardInTimeline', () => {
  it('should add song to empty timeline', () => {
    const song = createTestSong()
    const timeline = placeCardInTimeline([], song)

    expect(timeline).toHaveLength(1)
    expect(timeline[0]).toEqual(song)
  })

  it('should sort timeline by year (ascending)', () => {
    const song1 = createTestSong({ id: 'song_1', year: 1983 })
    const song2 = createTestSong({ id: 'song_2', year: 1979 })
    const song3 = createTestSong({ id: 'song_3', year: 1990 })

    let timeline: Song[] = []
    timeline = placeCardInTimeline(timeline, song1)
    timeline = placeCardInTimeline(timeline, song2)
    timeline = placeCardInTimeline(timeline, song3)

    expect(timeline[0].year).toBe(1979)
    expect(timeline[1].year).toBe(1983)
    expect(timeline[2].year).toBe(1990)
  })

  it('should add points metadata when provided', () => {
    const song = createTestSong()
    const timeline = placeCardInTimeline([], song, 15)

    expect(timeline[0]).toHaveProperty('points', 15)
  })

  it('should add guessDetails metadata when provided', () => {
    const song = createTestSong()
    const guessDetails = { titleCorrect: true, artistCorrect: true, yearPoints: 5 as const }
    const timeline = placeCardInTimeline([], song, 15, guessDetails)

    expect(timeline[0]).toHaveProperty('guessDetails', guessDetails)
  })
})

describe('sortTimelineByYear', () => {
  it('should sort songs by year ascending', () => {
    const songs = [
      createTestSong({ id: 'song_1', year: 1990 }),
      createTestSong({ id: 'song_2', year: 1979 }),
      createTestSong({ id: 'song_3', year: 1983 })
    ]

    const sorted = sortTimelineByYear(songs)

    expect(sorted[0].year).toBe(1979)
    expect(sorted[1].year).toBe(1983)
    expect(sorted[2].year).toBe(1990)
  })

  it('should not mutate original array', () => {
    const songs = [
      createTestSong({ id: 'song_1', year: 1990 }),
      createTestSong({ id: 'song_2', year: 1979 })
    ]
    const original = [...songs]

    sortTimelineByYear(songs)

    expect(songs).toEqual(original)
  })
})

describe('isTimelineValid', () => {
  it('should return true for empty timeline', () => {
    expect(isTimelineValid([])).toBe(true)
  })

  it('should return true for single song', () => {
    const timeline = [createTestSong()]
    expect(isTimelineValid(timeline)).toBe(true)
  })

  it('should return true for correctly sorted timeline', () => {
    const timeline = [
      createTestSong({ id: 'song_1', year: 1979 }),
      createTestSong({ id: 'song_2', year: 1983 }),
      createTestSong({ id: 'song_3', year: 1990 })
    ]
    expect(isTimelineValid(timeline)).toBe(true)
  })

  it('should return false for incorrectly sorted timeline', () => {
    const timeline = [
      createTestSong({ id: 'song_1', year: 1983 }),
      createTestSong({ id: 'song_2', year: 1979 }), // Wrong order
      createTestSong({ id: 'song_3', year: 1990 })
    ]
    expect(isTimelineValid(timeline)).toBe(false)
  })

  it('should handle duplicate years', () => {
    const timeline = [
      createTestSong({ id: 'song_1', year: 1983 }),
      createTestSong({ id: 'song_2', year: 1983 }),
      createTestSong({ id: 'song_3', year: 1990 })
    ]
    expect(isTimelineValid(timeline)).toBe(true) // Same year is valid
  })
})

// ============================================================================
// Win Condition Tests
// ============================================================================

describe('checkWinCondition - Hardcore Mode', () => {
  const gameMode: GameMode = GameMode.HARDCORE

  it('should NOT declare winner if not all players finished', () => {
    const players = [
      createTestPlayer({ name: 'Alice', cards: 10, score: 120 }),
      createTestPlayer({ name: 'Bob', cards: 9, score: 85 }) // Bob still playing
    ]

    const result = checkWinCondition(players, 0, gameMode)

    expect(result.gameOver).toBe(false)
    expect(result.winner).toBeNull()
  })

  it('should declare winner when all players have 10 cards (highest score)', () => {
    const players = [
      createTestPlayer({ name: 'Alice', cards: 10, score: 120 }),
      createTestPlayer({ name: 'Bob', cards: 10, score: 85 })
    ]

    const result = checkWinCondition(players, 0, gameMode)

    expect(result.gameOver).toBe(true)
    expect(result.winner?.name).toBe('Alice')
    expect(result.winnerIndex).toBe(0)
    expect(result.message).toContain('120 Punkten')
  })

  it('should find correct winner with multiple players', () => {
    const players = [
      createTestPlayer({ name: 'Alice', cards: 10, score: 100 }),
      createTestPlayer({ name: 'Bob', cards: 10, score: 120 }), // Winner
      createTestPlayer({ name: 'Charlie', cards: 10, score: 95 })
    ]

    const result = checkWinCondition(players, 1, gameMode)

    expect(result.gameOver).toBe(true)
    expect(result.winner?.name).toBe('Bob')
    expect(result.winnerIndex).toBe(1)
  })

  it('should handle tied scores with equal cards (currentPlayer wins)', () => {
    const players = [
      createTestPlayer({ name: 'Alice', cards: 10, score: 100 }),
      createTestPlayer({ name: 'Bob', cards: 10, score: 100 })
    ]

    // Bob is currentPlayer (just finished)
    const result = checkWinCondition(players, 1, gameMode)

    expect(result.gameOver).toBe(true)
    expect(result.winner?.name).toBe('Bob') // currentPlayer wins tie
    expect(result.winnerIndex).toBe(1)
  })

  it('should handle tied scores with different cards (most cards wins)', () => {
    const players = [
      createTestPlayer({ name: 'Alice', cards: 12, score: 100 }),
      createTestPlayer({ name: 'Bob', cards: 10, score: 100 })
    ]

    const result = checkWinCondition(players, 1, gameMode)

    expect(result.gameOver).toBe(true)
    expect(result.winner?.name).toBe('Alice') // Most cards wins
    expect(result.winnerIndex).toBe(0)
  })

  it('should handle 3-way tie (currentPlayer wins)', () => {
    const players = [
      createTestPlayer({ name: 'Alice', cards: 10, score: 100 }),
      createTestPlayer({ name: 'Bob', cards: 10, score: 100 }),
      createTestPlayer({ name: 'Charlie', cards: 10, score: 100 })
    ]

    // Charlie is currentPlayer (just finished)
    const result = checkWinCondition(players, 2, gameMode)

    expect(result.gameOver).toBe(true)
    expect(result.winner?.name).toBe('Charlie') // currentPlayer wins 3-way tie
    expect(result.winnerIndex).toBe(2)
  })
})

describe('checkWinCondition - Timeline Modes', () => {
  it('should declare winner immediately at 10 cards (Timeline Personal)', () => {
    const players = [
      createTestPlayer({ name: 'Alice', cards: 10 }),
      createTestPlayer({ name: 'Bob', cards: 7 }) // Bob still playing
    ]

    const result = checkWinCondition(players, 0, GameMode.TIMELINE_PERSONAL)

    expect(result.gameOver).toBe(true)
    expect(result.winner?.name).toBe('Alice')
    expect(result.message).toContain('10 Karten')
  })

  it('should declare winner after 10 total cards in Timeline Global', () => {
    // After 10 total cards, player with most cards wins
    const players = [
      createTestPlayer({ name: 'Alice', cards: 6 }),
      createTestPlayer({ name: 'Bob', cards: 4 }) // Total: 10 cards, Alice wins with 6
    ]

    const result = checkWinCondition(players, 1, GameMode.TIMELINE_GLOBAL)

    expect(result.gameOver).toBe(true)
    expect(result.winner?.name).toBe('Alice')
    expect(result.winnerIndex).toBe(0)
    expect(result.message).toContain('6 korrekt platzierten Karten')
  })

  it('should NOT declare winner before 10 total cards (Timeline Global)', () => {
    const players = [
      createTestPlayer({ name: 'Alice', cards: 5 }),
      createTestPlayer({ name: 'Bob', cards: 4 }) // Total: 9 cards
    ]

    const result = checkWinCondition(players, 0, GameMode.TIMELINE_GLOBAL)

    expect(result.gameOver).toBe(false)
    expect(result.winner).toBeNull()
  })

  it('should NOT declare winner before 10 cards', () => {
    const players = [
      createTestPlayer({ name: 'Alice', cards: 9 }),
      createTestPlayer({ name: 'Bob', cards: 7 })
    ]

    const result = checkWinCondition(players, 0, GameMode.TIMELINE_PERSONAL)

    expect(result.gameOver).toBe(false)
    expect(result.winner).toBeNull()
  })

  it('should handle equal cards in Timeline Global (currentPlayer wins)', () => {
    // This is the bug scenario: Martin vs Bot Alpha, both with 5 cards
    const players = [
      createTestPlayer({ name: 'Martin', cards: 5, score: 0 }),
      createTestPlayer({ name: 'Bot Alpha', cards: 5, score: 0 })
    ]

    // Martin is currentPlayer (just placed 10th card)
    const result = checkWinCondition(players, 0, GameMode.TIMELINE_GLOBAL)

    expect(result.gameOver).toBe(true)
    expect(result.winner?.name).toBe('Martin') // currentPlayer wins when tied
    expect(result.winnerIndex).toBe(0)
  })

  it('should handle equal cards in Timeline Global with different currentPlayer', () => {
    const players = [
      createTestPlayer({ name: 'Alice', cards: 5, score: 0 }),
      createTestPlayer({ name: 'Bob', cards: 5, score: 0 })
    ]

    // Bob is currentPlayer (just placed 10th card)
    const result = checkWinCondition(players, 1, GameMode.TIMELINE_GLOBAL)

    expect(result.gameOver).toBe(true)
    expect(result.winner?.name).toBe('Bob') // currentPlayer wins when tied
    expect(result.winnerIndex).toBe(1)
  })

  it('should use score as tiebreaker in Timeline Global when not currentPlayer', () => {
    const players = [
      createTestPlayer({ name: 'Alice', cards: 5, score: 25 }),
      createTestPlayer({ name: 'Bob', cards: 5, score: 30 }), // Higher score
      createTestPlayer({ name: 'Charlie', cards: 3, score: 20 })
    ]

    // Charlie is currentPlayer (placed 10th card but has fewer cards)
    const result = checkWinCondition(players, 2, GameMode.TIMELINE_GLOBAL)

    expect(result.gameOver).toBe(true)
    expect(result.winner?.name).toBe('Bob') // Most cards + highest score among tied
    expect(result.winnerIndex).toBe(1)
  })

  it('should handle 3-player Timeline Global with equal cards', () => {
    const players = [
      createTestPlayer({ name: 'Alice', cards: 3, score: 0 }),
      createTestPlayer({ name: 'Bob', cards: 4, score: 0 }),
      createTestPlayer({ name: 'Charlie', cards: 3, score: 0 })
    ]

    // Alice is currentPlayer (total = 10 cards)
    const result = checkWinCondition(players, 0, GameMode.TIMELINE_GLOBAL)

    expect(result.gameOver).toBe(true)
    expect(result.winner?.name).toBe('Bob') // Most cards wins
    expect(result.winnerIndex).toBe(1)
  })
})

// ============================================================================
// Random Song Selection Tests
// ============================================================================

describe('selectRandomSong', () => {
  const allSongs = [
    createTestSong({ id: 'song_1', spotifyId: 'id1' }),
    createTestSong({ id: 'song_2', spotifyId: 'id2' }),
    createTestSong({ id: 'song_3', spotifyId: 'id3' })
  ]

  it('should select random song from available songs', () => {
    const song = selectRandomSong(allSongs, [])

    expect(song).not.toBeNull()
    expect(allSongs).toContainEqual(song)
  })

  it('should exclude already played songs', () => {
    const playedSongs = ['id1', 'id2']
    const song = selectRandomSong(allSongs, playedSongs)

    expect(song).not.toBeNull()
    expect(song?.spotifyId).toBe('id3') // Only id3 available
  })

  it('should return null when all songs played', () => {
    const playedSongs = ['id1', 'id2', 'id3']
    const song = selectRandomSong(allSongs, playedSongs)

    expect(song).toBeNull()
  })

  it('should handle songs without spotifyId (fallback to id)', () => {
    const songsWithoutSpotifyId = [
      createTestSong({ id: 'song_1', spotifyId: undefined as any }),
      createTestSong({ id: 'song_2', spotifyId: undefined as any })
    ]

    const song = selectRandomSong(songsWithoutSpotifyId, ['song_1'])

    expect(song).not.toBeNull()
    expect(song?.id).toBe('song_2')
  })
})

describe('getRemainingSongsCount', () => {
  const allSongs = [
    createTestSong({ id: 'song_1', spotifyId: 'id1' }),
    createTestSong({ id: 'song_2', spotifyId: 'id2' }),
    createTestSong({ id: 'song_3', spotifyId: 'id3' })
  ]

  it('should count all songs when none played', () => {
    const count = getRemainingSongsCount(allSongs, [])
    expect(count).toBe(3)
  })

  it('should count remaining songs correctly', () => {
    const count = getRemainingSongsCount(allSongs, ['id1', 'id2'])
    expect(count).toBe(1)
  })

  it('should return 0 when all songs played', () => {
    const count = getRemainingSongsCount(allSongs, ['id1', 'id2', 'id3'])
    expect(count).toBe(0)
  })
})

// ============================================================================
// Player Management Tests
// ============================================================================

describe('getNextPlayerIndex', () => {
  it('should return next player index', () => {
    expect(getNextPlayerIndex(0, 3)).toBe(1)
    expect(getNextPlayerIndex(1, 3)).toBe(2)
  })

  it('should wrap around to 0', () => {
    expect(getNextPlayerIndex(2, 3)).toBe(0)
  })

  it('should handle 2 players', () => {
    expect(getNextPlayerIndex(0, 2)).toBe(1)
    expect(getNextPlayerIndex(1, 2)).toBe(0)
  })
})

describe('getNextDJIndex', () => {
  it('should keep same DJ in Virtual mode', () => {
    const result = getNextDJIndex(0, 0, 3, GameMode.HARDCORE, 'virtual')

    expect(result.nextPlayer).toBe(1)
    expect(result.nextDJ).toBe(0) // DJ stays same
  })

  it('should rotate DJ when turn returns to DJ (Physical Hardcore)', () => {
    // Current: Player 2, DJ 0, 3 total players
    // Next player would be 0 (DJ) → rotate DJ to 1, skip to player 1
    const result = getNextDJIndex(2, 0, 3, GameMode.HARDCORE, 'physical')

    expect(result.nextPlayer).toBe(1) // Skip DJ (0), move to 1
    expect(result.nextDJ).toBe(1) // DJ rotates
  })

  it('should NOT rotate DJ in middle of round (Physical Hardcore)', () => {
    const result = getNextDJIndex(0, 0, 3, GameMode.HARDCORE, 'physical')

    expect(result.nextPlayer).toBe(1)
    expect(result.nextDJ).toBe(0) // DJ stays same
  })

  it('should keep DJ unchanged in Timeline modes (even Physical)', () => {
    const result = getNextDJIndex(2, 0, 3, GameMode.TIMELINE_PERSONAL, 'physical')

    expect(result.nextPlayer).toBe(0)
    expect(result.nextDJ).toBe(0) // DJ doesn't rotate in Timeline modes
  })
})

describe('updatePlayerScore', () => {
  it('should add points to player score', () => {
    const player = createTestPlayer({ score: 50 })
    const updated = updatePlayerScore(player, 15)

    expect(updated.score).toBe(65)
  })

  it('should not mutate original player', () => {
    const player = createTestPlayer({ score: 50 })
    const updated = updatePlayerScore(player, 15)

    expect(player.score).toBe(50) // Original unchanged
    expect(updated.score).toBe(65)
  })
})

describe('incrementPlayerCards', () => {
  it('should increment player cards count', () => {
    const player = createTestPlayer({ cards: 5 })
    const updated = incrementPlayerCards(player)

    expect(updated.cards).toBe(6)
  })

  it('should not mutate original player', () => {
    const player = createTestPlayer({ cards: 5 })
    const updated = incrementPlayerCards(player)

    expect(player.cards).toBe(5) // Original unchanged
    expect(updated.cards).toBe(6)
  })
})

// ============================================================================
// Song Management Tests
// ============================================================================

describe('addToPlayedSongs', () => {
  it('should add song ID to played songs list', () => {
    const song = createTestSong({ spotifyId: 'id123' })
    const playedSongs = addToPlayedSongs([], song)

    expect(playedSongs).toContain('id123')
  })

  it('should not add duplicate song IDs', () => {
    const song = createTestSong({ spotifyId: 'id123' })
    let playedSongs = addToPlayedSongs([], song)
    playedSongs = addToPlayedSongs(playedSongs, song) // Add again

    expect(playedSongs).toHaveLength(1)
    expect(playedSongs[0]).toBe('id123')
  })

  it('should fallback to song.id if no spotifyId', () => {
    const song = createTestSong({ id: 'song_123', spotifyId: undefined as any })
    const playedSongs = addToPlayedSongs([], song)

    expect(playedSongs).toContain('song_123')
  })
})

describe('isSongPlayed', () => {
  it('should return true if song was played', () => {
    const song = createTestSong({ spotifyId: 'id123' })
    const isPlayed = isSongPlayed(['id123', 'id456'], song)

    expect(isPlayed).toBe(true)
  })

  it('should return false if song was not played', () => {
    const song = createTestSong({ spotifyId: 'id789' })
    const isPlayed = isSongPlayed(['id123', 'id456'], song)

    expect(isPlayed).toBe(false)
  })

  it('should handle empty played songs list', () => {
    const song = createTestSong({ spotifyId: 'id123' })
    const isPlayed = isSongPlayed([], song)

    expect(isPlayed).toBe(false)
  })
})
