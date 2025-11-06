/**
 * Unit Tests for Timeline Bot Strategy
 * Tests bot card placement logic with different difficulty levels
 */

import { describe, it, expect } from 'vitest'
import { TimelineBotStrategy } from '../timelineBotStrategy'
import type { BotConfig } from '../types'
import type { Song } from '@/types'

describe('TimelineBotStrategy', () => {
  const createSong = (id: string, year: number): Song => ({
    id,
    title: `Song ${id}`,
    artist: `Artist ${id}`,
    year,
    spotifyId: `spotify_${id}`,
    previewUrl: `https://example.com/${id}.mp3`,
    genre: 'Pop'
  })

  describe('Easy Difficulty', () => {
    const config: BotConfig = {
      difficulty: 'easy',
      thinkingTimeMs: { min: 100, max: 200 }
    }

    it('should place cards with 50% accuracy', () => {
      const strategy = new TimelineBotStrategy(config)
      const timeline: Song[] = [
        createSong('001', 1980),
        createSong('002', 1985),
        createSong('003', 1990)
      ]
      const currentSong = createSong('004', 1987) // Should go at position 2 (between 1985 and 1990)

      let correctPlacements = 0
      const iterations = 100

      for (let i = 0; i < iterations; i++) {
        const position = strategy.selectPosition(currentSong, timeline)

        // Correct position is 2 (between 1985 and 1990)
        // With maxOffset=2, positions 0-4 are valid, but 2 should be most common
        if (position === 2) {
          correctPlacements++
        }
      }

      // Easy difficulty: ~50% correct (with wide tolerance for randomness)
      // Note: With maxOffset=2, the bot might not always hit the exact position
      expect(correctPlacements).toBeGreaterThan(0) // At least some correct
      expect(correctPlacements).toBeLessThan(80) // Not too many (should still make mistakes)
    })

    it('should handle empty timeline', () => {
      const strategy = new TimelineBotStrategy(config)
      const timeline: Song[] = []
      const currentSong = createSong('001', 1985)

      const position = strategy.selectPosition(currentSong, timeline)

      // Empty timeline should always return position 0
      expect(position).toBe(0)
    })
  })

  describe('Medium Difficulty', () => {
    const config: BotConfig = {
      difficulty: 'medium',
      thinkingTimeMs: { min: 100, max: 200 }
    }

    it('should place cards with 75% accuracy', () => {
      const strategy = new TimelineBotStrategy(config)
      const timeline: Song[] = [
        createSong('001', 1980),
        createSong('002', 1985),
        createSong('003', 1990)
      ]
      const currentSong = createSong('004', 1987)

      let correctOrClose = 0
      const iterations = 100

      for (let i = 0; i < iterations; i++) {
        const position = strategy.selectPosition(currentSong, timeline)

        // Correct position is 2, with maxOffset=1, positions 1-3 are acceptable
        if (position >= 1 && position <= 3) {
          correctOrClose++
        }
      }

      // Medium difficulty: ~75% correct or close (with tolerance)
      expect(correctOrClose).toBeGreaterThan(60) // At least 60%
    })

    it('should handle timeline with single song', () => {
      const strategy = new TimelineBotStrategy(config)
      const timeline: Song[] = [createSong('001', 1985)]
      const currentSong = createSong('002', 1990) // Should go at position 1 (after 1985)

      const position = strategy.selectPosition(currentSong, timeline)

      // Should be 0 or 1 (before or after single song)
      expect(position).toBeGreaterThanOrEqual(0)
      expect(position).toBeLessThanOrEqual(1)
    })
  })

  describe('Hard Difficulty', () => {
    const config: BotConfig = {
      difficulty: 'hard',
      thinkingTimeMs: { min: 100, max: 200 }
    }

    it('should place cards with 95% accuracy', () => {
      const strategy = new TimelineBotStrategy(config)
      const timeline: Song[] = [
        createSong('001', 1980),
        createSong('002', 1985),
        createSong('003', 1990),
        createSong('004', 1995)
      ]
      const currentSong = createSong('005', 1987)

      let correctPlacements = 0
      const iterations = 100

      for (let i = 0; i < iterations; i++) {
        const position = strategy.selectPosition(currentSong, timeline)

        // Correct position is 2 (between 1985 and 1990)
        // Hard difficulty has maxOffset=0, so should always be correct
        if (position === 2) {
          correctPlacements++
        }
      }

      // Hard difficulty: ~95% correct (with tolerance)
      expect(correctPlacements).toBeGreaterThan(85) // At least 85%
    })

    it('should place at beginning correctly', () => {
      const strategy = new TimelineBotStrategy(config)
      const timeline: Song[] = [
        createSong('001', 1985),
        createSong('002', 1990),
        createSong('003', 1995)
      ]
      const currentSong = createSong('004', 1980) // Should go at position 0 (before 1985)

      let correctPlacements = 0
      const iterations = 50

      for (let i = 0; i < iterations; i++) {
        const position = strategy.selectPosition(currentSong, timeline)

        if (position === 0) {
          correctPlacements++
        }
      }

      // Should almost always be correct for hard difficulty
      expect(correctPlacements).toBeGreaterThan(40) // At least 80%
    })

    it('should place at end correctly', () => {
      const strategy = new TimelineBotStrategy(config)
      const timeline: Song[] = [
        createSong('001', 1980),
        createSong('002', 1985),
        createSong('003', 1990)
      ]
      const currentSong = createSong('004', 2000) // Should go at position 3 (after 1990)

      let correctPlacements = 0
      const iterations = 50

      for (let i = 0; i < iterations; i++) {
        const position = strategy.selectPosition(currentSong, timeline)

        if (position === timeline.length) {
          correctPlacements++
        }
      }

      // Should almost always be correct for hard difficulty
      expect(correctPlacements).toBeGreaterThan(40) // At least 80%
    })
  })

  describe('Position Validation', () => {
    const config: BotConfig = {
      difficulty: 'medium',
      thinkingTimeMs: { min: 100, max: 200 }
    }

    it('should always return valid positions', () => {
      const strategy = new TimelineBotStrategy(config)
      const timeline: Song[] = [
        createSong('001', 1980),
        createSong('002', 1985),
        createSong('003', 1990)
      ]
      const currentSong = createSong('004', 1987)

      for (let i = 0; i < 100; i++) {
        const position = strategy.selectPosition(currentSong, timeline)

        // Position should be valid (0 to timeline.length inclusive)
        expect(position).toBeGreaterThanOrEqual(0)
        expect(position).toBeLessThanOrEqual(timeline.length)
      }
    })

    it('should handle large timelines', () => {
      const strategy = new TimelineBotStrategy(config)
      const timeline: Song[] = []

      // Create timeline with 10 songs
      for (let i = 0; i < 10; i++) {
        timeline.push(createSong(`00${i}`, 1980 + i * 2))
      }

      const currentSong = createSong('new', 1985)

      const position = strategy.selectPosition(currentSong, timeline)

      // Should return valid position
      expect(position).toBeGreaterThanOrEqual(0)
      expect(position).toBeLessThanOrEqual(timeline.length)
    })
  })
})
