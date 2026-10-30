/**
 * Bot Strategy Types
 * Shared interfaces for bot player strategies
 */

import type { Song } from '@/types'

export type BotDifficulty = 'easy' | 'medium' | 'hard'

export interface BotConfig {
  difficulty: BotDifficulty
  /** Strength this round: the difficulty's base skill plus the round's form (botForm.ts). */
  skill?: number
  thinkingTimeMs: { min: number; max: number }
}

export interface BotGuess {
  title: string
  artist: string
  year: string
}

export interface BotAction {
  type: 'guess' | 'place' | 'skip'
  data: any
}

export interface BotStrategy {
  execute(song: Song, context: any): any
}
