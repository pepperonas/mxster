/**
 * Timeline Mode Bot Strategy
 * Selects placement position for songs in timeline based on difficulty
 */

import type { Song } from '@/types'
import type { BotConfig } from './types'

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
      return this.randomWrongPosition(correctPosition, timeline.length)
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

  private randomWrongPosition(correctPosition: number, timelineLength: number): number {
    // Generate random position that's NOT the correct one
    let wrongPosition: number
    do {
      wrongPosition = Math.floor(Math.random() * (timelineLength + 1))
    } while (wrongPosition === correctPosition && timelineLength > 0)
    return wrongPosition
  }
}
