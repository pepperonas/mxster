/**
 * Timeline Mode Bot Strategy
 * Places the song in the right gap with a probability set by the bot's skill
 * for this round (botForm.ts). The base rates are the ones the bots always had,
 * measured: easy ≈ 20 %, medium ≈ 37 %, hard ≈ 95 % right placements.
 */

import type { Song } from '@/types'
import type { BotConfig } from './types'
import { correctGapIndices } from '@/game/placement'
import { botSkill, lerpSkill } from '../botForm'

/** Right placements per difficulty at its base skill. */
export const PLACE_ACCURACY = { easy: 0.2, medium: 0.37, hard: 0.95 }
/** A wrong placement lands next to the right gap this often (it sounded close). */
const NEAR_MISS = 0.6

export function placeAccuracy(skill: number): number {
  return lerpSkill(skill, PLACE_ACCURACY, 0.08, 0.98)
}

export class TimelineBotStrategy {
  private config: BotConfig
  private rand: () => number

  constructor(config: BotConfig, rand: () => number = Math.random) {
    this.config = config
    this.rand = rand
  }

  selectPosition(currentSong: Song, timeline: Song[]): number {
    if (timeline.length === 0) return 0
    const right = correctGapIndices(timeline, currentSong)
    const skill = this.config.skill ?? botSkill(this.config.difficulty)
    if (this.rand() < placeAccuracy(skill)) return right[Math.floor(this.rand() * right.length)]
    return this.wrongPosition(right, timeline.length)
  }

  /** A gap that is really wrong — often a neighbour of the right one. */
  private wrongPosition(right: number[], cards: number): number {
    const ok = new Set(right)
    const wrong = Array.from({ length: cards + 1 }, (_, i) => i).filter((i) => !ok.has(i))
    if (wrong.length === 0) return right[0]
    const near = wrong.filter((i) => right.some((r) => Math.abs(r - i) === 1))
    const pool = near.length > 0 && this.rand() < NEAR_MISS ? near : wrong
    return pool[Math.floor(this.rand() * pool.length)]
  }
}
