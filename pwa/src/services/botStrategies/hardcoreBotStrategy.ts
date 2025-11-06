/**
 * Hardcore Mode Bot Strategy
 * Generates guesses for title, artist, and year based on difficulty
 */

import type { Song } from '@/types'
import type { BotConfig, BotGuess } from './types'

export class HardcoreBotStrategy {
  private config: BotConfig

  constructor(config: BotConfig) {
    this.config = config
  }

  generateGuess(correctSong: Song): BotGuess {
    const { difficulty } = this.config

    // Difficulty-based accuracy rates
    const accuracyRates = {
      easy: { title: 0.3, artist: 0.3, yearExact: 0.1, yearClose: 0.3 },
      medium: { title: 0.6, artist: 0.6, yearExact: 0.4, yearClose: 0.7 },
      hard: { title: 0.9, artist: 0.9, yearExact: 0.7, yearClose: 0.95 }
    }

    const rates = accuracyRates[difficulty]

    // Title guess
    const titleCorrect = Math.random() < rates.title
    const title = titleCorrect
      ? this.addTypos(correctSong.title, difficulty)
      : this.generateWrongTitle(correctSong.title)

    // Artist guess
    const artistCorrect = Math.random() < rates.artist
    const artist = artistCorrect
      ? this.addTypos(correctSong.artist, difficulty)
      : this.generateWrongArtist(correctSong.artist)

    // Year guess
    const yearRoll = Math.random()
    let year: string

    if (yearRoll < rates.yearExact) {
      // Exact year
      year = correctSong.year.toString()
    } else if (yearRoll < rates.yearClose) {
      // Close year (±1-2 years)
      const offset = Math.floor(Math.random() * 5) - 2 // -2 to +2
      year = (correctSong.year + offset).toString()
    } else {
      // Random year in ±5 year range
      const offset = Math.floor(Math.random() * 11) - 5 // -5 to +5
      year = (correctSong.year + offset).toString()
    }

    return { title, artist, year }
  }

  private addTypos(text: string, difficulty: 'easy' | 'medium' | 'hard'): string {
    // Easy: 20% chance of typo, Medium: 10%, Hard: 2%
    const typoChance = difficulty === 'easy' ? 0.2 : difficulty === 'medium' ? 0.1 : 0.02

    if (Math.random() > typoChance) return text

    // Add 1-2 character typos for realism
    const chars = text.split('')
    const typoIndex = Math.floor(Math.random() * chars.length)
    chars[typoIndex] = this.randomChar()
    return chars.join('')
  }

  private randomChar(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz'
    return chars[Math.floor(Math.random() * chars.length)]
  }

  private generateWrongTitle(correctTitle: string): string {
    // Return empty or partial match
    return Math.random() < 0.5 ? '' : correctTitle.substring(0, Math.floor(correctTitle.length / 2))
  }

  private generateWrongArtist(_correctArtist: string): string {
    return Math.random() < 0.5 ? '' : 'Unknown Artist'
  }
}
