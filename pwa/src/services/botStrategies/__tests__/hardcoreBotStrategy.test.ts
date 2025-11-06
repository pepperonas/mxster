/**
 * Unit Tests for Hardcore Bot Strategy
 * Tests bot guess generation with different difficulty levels
 */

import { describe, it, expect } from 'vitest'
import { HardcoreBotStrategy } from '../hardcoreBotStrategy'
import type { BotConfig } from '../types'
import type { Song } from '@/types'

describe('HardcoreBotStrategy', () => {
  const testSong: Song = {
    id: 'test_001',
    title: 'Test Song',
    artist: 'Test Artist',
    year: 1985,
    spotifyId: 'spotify123',
    previewUrl: 'https://example.com/preview.mp3',
    genre: 'Pop'
  }

  describe('Easy Difficulty', () => {
    const config: BotConfig = {
      difficulty: 'easy',
      thinkingTimeMs: { min: 100, max: 200 }
    }

    it('should generate guesses with low accuracy', () => {
      const strategy = new HardcoreBotStrategy(config)
      const results = { titleCorrect: 0, artistCorrect: 0, yearExact: 0 }
      const iterations = 100

      // Run 100 iterations to test probability
      for (let i = 0; i < iterations; i++) {
        const guess = strategy.generateGuess(testSong)

        // Check title (30% accuracy expected)
        if (guess.title.toLowerCase().includes(testSong.title.toLowerCase()) ||
            testSong.title.toLowerCase().includes(guess.title.toLowerCase())) {
          results.titleCorrect++
        }

        // Check artist (30% accuracy expected)
        if (guess.artist.toLowerCase().includes(testSong.artist.toLowerCase()) ||
            testSong.artist.toLowerCase().includes(guess.artist.toLowerCase())) {
          results.artistCorrect++
        }

        // Check year exact (10% accuracy expected)
        if (parseInt(guess.year) === testSong.year) {
          results.yearExact++
        }
      }

      // Verify accuracy ranges (with wide tolerance for randomness)
      // Easy difficulty uses substring matching, so accuracy might be higher than exact percentage
      expect(results.titleCorrect).toBeGreaterThan(5) // At least 5% (very tolerant)
      expect(results.artistCorrect).toBeGreaterThan(5)

      expect(results.yearExact).toBeLessThan(40) // Should be relatively low for easy
    })

    it('should generate valid guess structure', () => {
      const strategy = new HardcoreBotStrategy(config)
      const guess = strategy.generateGuess(testSong)

      expect(guess).toHaveProperty('title')
      expect(guess).toHaveProperty('artist')
      expect(guess).toHaveProperty('year')
      expect(typeof guess.title).toBe('string')
      expect(typeof guess.artist).toBe('string')
      expect(typeof guess.year).toBe('string')
    })
  })

  describe('Medium Difficulty', () => {
    const config: BotConfig = {
      difficulty: 'medium',
      thinkingTimeMs: { min: 100, max: 200 }
    }

    it('should generate guesses with medium accuracy', () => {
      const strategy = new HardcoreBotStrategy(config)
      const results = { titleCorrect: 0, artistCorrect: 0, yearClose: 0 }
      const iterations = 100

      for (let i = 0; i < iterations; i++) {
        const guess = strategy.generateGuess(testSong)

        if (guess.title.toLowerCase().includes(testSong.title.toLowerCase()) ||
            testSong.title.toLowerCase().includes(guess.title.toLowerCase())) {
          results.titleCorrect++
        }

        if (guess.artist.toLowerCase().includes(testSong.artist.toLowerCase()) ||
            testSong.artist.toLowerCase().includes(guess.artist.toLowerCase())) {
          results.artistCorrect++
        }

        // Year within ±2 years (70% accuracy expected)
        const yearDiff = Math.abs(parseInt(guess.year) - testSong.year)
        if (yearDiff <= 2) {
          results.yearClose++
        }
      }

      // Medium difficulty should have higher accuracy
      expect(results.titleCorrect).toBeGreaterThan(40) // At least 40%
      expect(results.artistCorrect).toBeGreaterThan(40)
      expect(results.yearClose).toBeGreaterThan(50) // At least 50%
    })
  })

  describe('Hard Difficulty', () => {
    const config: BotConfig = {
      difficulty: 'hard',
      thinkingTimeMs: { min: 100, max: 200 }
    }

    it('should generate guesses with high accuracy', () => {
      const strategy = new HardcoreBotStrategy(config)
      const results = { titleCorrect: 0, artistCorrect: 0, yearExact: 0 }
      const iterations = 100

      for (let i = 0; i < iterations; i++) {
        const guess = strategy.generateGuess(testSong)

        if (guess.title.toLowerCase().includes(testSong.title.toLowerCase()) ||
            testSong.title.toLowerCase().includes(guess.title.toLowerCase())) {
          results.titleCorrect++
        }

        if (guess.artist.toLowerCase().includes(testSong.artist.toLowerCase()) ||
            testSong.artist.toLowerCase().includes(guess.artist.toLowerCase())) {
          results.artistCorrect++
        }

        if (parseInt(guess.year) === testSong.year) {
          results.yearExact++
        }
      }

      // Hard difficulty should have very high accuracy
      expect(results.titleCorrect).toBeGreaterThan(75) // At least 75%
      expect(results.artistCorrect).toBeGreaterThan(75)
      expect(results.yearExact).toBeGreaterThan(55) // At least 55%
    })

    it('should add minimal typos for hard difficulty', () => {
      const strategy = new HardcoreBotStrategy(config)
      const guesses = []

      for (let i = 0; i < 50; i++) {
        const guess = strategy.generateGuess(testSong)
        guesses.push(guess)
      }

      // Most guesses should be exact or very close
      const exactTitles = guesses.filter(g => g.title === testSong.title).length
      expect(exactTitles).toBeGreaterThanOrEqual(40) // Most should be exact
    })
  })

  describe('Year Guess Logic', () => {
    const config: BotConfig = {
      difficulty: 'medium',
      thinkingTimeMs: { min: 100, max: 200 }
    }

    it('should generate years in valid range', () => {
      const strategy = new HardcoreBotStrategy(config)

      for (let i = 0; i < 50; i++) {
        const guess = strategy.generateGuess(testSong)
        const year = parseInt(guess.year)

        // Year should be within reasonable range (±5 years)
        expect(year).toBeGreaterThanOrEqual(testSong.year - 5)
        expect(year).toBeLessThanOrEqual(testSong.year + 5)
      }
    })
  })
})
