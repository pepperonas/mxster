/**
 * The little game on /about (pure): three songs lie on a timeline, a fourth
 * waits to be placed. Same rule as the real game (game/placement.ts).
 */
import type { Song } from '@/types'
import { correctGapIndices, evaluatePlacement } from '@/game/placement'

export const DEMO_TIMELINE = 3
/** Years in one demo round lie at least this far apart, so every gap is a fair guess. */
export const DEMO_MIN_GAP = 3

export interface DemoRound {
  timeline: Song[]
  card: Song
}

/** Only well-known songs, with a year, never the one just played. */
export function demoPool(songs: Song[]): Song[] {
  return songs.filter((s) => !s.exotic && Number.isFinite(s.year) && s.year > 0)
}

/** Draws a round; `avoid` holds song ids that should not come back right away. */
export function pickRound(songs: Song[], rand: () => number = Math.random, avoid: ReadonlySet<string> = new Set()): DemoRound | null {
  const pool = demoPool(songs).filter((s) => !avoid.has(s.id))
  const source = pool.length >= DEMO_TIMELINE + 1 ? pool : demoPool(songs)
  for (let attempt = 0; attempt < 200; attempt++) {
    const chosen: Song[] = []
    const tries = source.length * 2
    for (let i = 0; i < tries && chosen.length < DEMO_TIMELINE + 1; i++) {
      const s = source[Math.floor(rand() * source.length)]
      if (chosen.some((c) => c.id === s.id || Math.abs(c.year - s.year) < DEMO_MIN_GAP)) continue
      chosen.push(s)
    }
    if (chosen.length === DEMO_TIMELINE + 1) {
      const [card, ...rest] = chosen
      return { card, timeline: rest.sort((a, b) => a.year - b.year) }
    }
  }
  return null
}

export interface DemoResult {
  right: boolean
  /** The gap the card belongs in (the only one: years are apart). */
  gap: number
  /** The timeline with the card in its right place. */
  settled: Song[]
}

export function judge(round: DemoRound, gap: number): DemoResult {
  const right = evaluatePlacement(round.timeline, round.card, gap).isCorrect
  const correct = correctGapIndices(round.timeline, round.card)[0] ?? 0
  return { right, gap: correct, settled: evaluatePlacement(round.timeline, round.card, correct).newTimeline }
}
