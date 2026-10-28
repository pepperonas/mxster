/**
 * Timeline Mode Bot Strategy
 * Selects placement position for songs in timeline based on difficulty
 */

import type { Song } from '@/types'
import type { BotConfig } from './types'
import { correctGapIndices } from '@/game/placement'

export class TimelineBotStrategy {
  private config: BotConfig

  constructor(config: BotConfig) {
    this.config = config
  }

  selectPosition(currentSong: Song, timeline: Song[]): number {
    const { difficulty } = this.config

    // Empty timeline - always position 0
    if (timeline.length === 0) return 0

    // Find correct position (where song.year would fit chronologically)
    const correctPosition = this.findCorrectPosition(currentSong, timeline)

    // Apply difficulty-based offset
    const accuracyRates = {
      easy: 0.5, // 50% correct placement
      medium: 0.75, // 75% correct placement
      hard: 0.95 // 95% correct placement
    }

    const accuracy = accuracyRates[difficulty]

    if (Math.random() < accuracy) {
      // Correct placement (with small randomness for hard bots)
      const maxOffset = difficulty === 'hard' ? 0 : difficulty === 'medium' ? 1 : 2
      const offset = Math.floor(Math.random() * (maxOffset * 2 + 1)) - maxOffset
      const position = Math.max(0, Math.min(timeline.length, correctPosition + offset))
      return position
    } else {
      // Incorrect placement - random position away from correct
      return this.randomWrongPosition(currentSong, timeline)
    }
  }

  private findCorrectPosition(song: Song, timeline: Song[]): number {
    // Find correct chronological position
    for (let i = 0; i < timeline.length; i++) {
      if (song.year < timeline[i].year) {
        return i
      }
    }
    return timeline.length // Append at end
  }

  /**
   * A position that is really wrong. With equal years several gaps are right,
   * so excluding one index is not enough; when every gap is right (all the
   * same year) any gap will do.
   */
  private randomWrongPosition(song: Song, timeline: Song[]): number {
    const right = new Set(correctGapIndices(timeline, song))
    const wrong = Array.from({ length: timeline.length + 1 }, (_, i) => i).filter((i) => !right.has(i))
    const options = wrong.length > 0 ? wrong : [...right]
    return options[Math.floor(Math.random() * options.length)]
  }
}
