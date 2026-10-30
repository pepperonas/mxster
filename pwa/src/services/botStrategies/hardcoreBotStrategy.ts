/**
 * Hardcore Mode Bot Strategy
 * Generates guesses for title, artist, and year based on difficulty
 */

import type { Song } from '@/types'
import type { BotConfig, BotGuess } from './types'
import { botSkill, lerpSkill } from '../botForm'

/** Accuracy per difficulty at its base skill; the round's skill interpolates between them. */
export const GUESS_RATES = {
  title: { easy: 0.3, medium: 0.6, hard: 0.9 },
  artist: { easy: 0.3, medium: 0.6, hard: 0.9 },
  yearExact: { easy: 0.1, medium: 0.4, hard: 0.7 },
  yearClose: { easy: 0.3, medium: 0.7, hard: 0.95 },
  typo: { easy: 0.2, medium: 0.1, hard: 0.02 }
}

export class HardcoreBotStrategy {
  private config: BotConfig

  constructor(config: BotConfig, rand: () => number = Math.random) {
    this.config = config
    this.rand = rand
  }

  private rand: () => number

  generateGuess(correctSong: Song): BotGuess {
    const skill = this.config.skill ?? botSkill(this.config.difficulty)
    const rates = {
      title: lerpSkill(skill, GUESS_RATES.title, 0.05, 0.97),
      artist: lerpSkill(skill, GUESS_RATES.artist, 0.05, 0.97),
      yearExact: lerpSkill(skill, GUESS_RATES.yearExact, 0.02, 0.85),
      yearClose: lerpSkill(skill, GUESS_RATES.yearClose, 0.1, 0.98)
    }
    const typoChance = lerpSkill(skill, GUESS_RATES.typo, 0.01, 0.3)

    // Title guess
    const titleCorrect = this.rand() < rates.title
    const title = titleCorrect
      ? this.addTypos(correctSong.title, typoChance)
      : this.generateWrongTitle(correctSong.title)

    // Artist guess
    const artistCorrect = this.rand() < rates.artist
    const artist = artistCorrect
      ? this.addTypos(correctSong.artist, typoChance)
      : this.generateWrongArtist(correctSong.artist)

    // Year guess
    const yearRoll = this.rand()
    let year: string

    if (yearRoll < rates.yearExact) {
      // Exact year
      year = correctSong.year.toString()
    } else if (yearRoll < rates.yearClose) {
      // Close year (±1-2 years)
      const offset = Math.floor(this.rand() * 5) - 2 // -2 to +2
      year = (correctSong.year + offset).toString()
    } else {
      // Random year in ±5 year range
      const offset = Math.floor(this.rand() * 11) - 5 // -5 to +5
      year = (correctSong.year + offset).toString()
    }

    return { title, artist, year }
  }

  private addTypos(text: string, typoChance: number): string {
    if (this.rand() > typoChance) return text

    // Add 1-2 character typos for realism
    const chars = text.split('')
    const typoIndex = Math.floor(this.rand() * chars.length)
    chars[typoIndex] = this.randomChar()
    return chars.join('')
  }

  private randomChar(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz'
    return chars[Math.floor(this.rand() * chars.length)]
  }

  private generateWrongTitle(correctTitle: string): string {
    // Return empty or partial match
    return this.rand() < 0.5 ? '' : correctTitle.substring(0, Math.floor(correctTitle.length / 2))
  }

  private generateWrongArtist(_correctArtist: string): string {
    return this.rand() < 0.5 ? '' : 'Unknown Artist'
  }
}
