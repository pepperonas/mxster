/**
 * Simulated rounds between two bots (for tuning and tests): the race to the
 * goal on own timelines, and hardcore points over a number of songs. Uses the
 * real strategies and the real form roll; songs are random years.
 */
import type { Song } from '@/types'
import type { BotDifficulty } from './botStrategies/types'
import { TimelineBotStrategy } from './botStrategies/timelineBotStrategy'
import { HardcoreBotStrategy } from './botStrategies/hardcoreBotStrategy'
import { botSkill, rollForm, seeded } from './botForm'
import { evaluatePlacement } from '@/game/placement'
import { guessBreakdown } from '@/game/guess'

const LISTEN = { min: 0, max: 0 }

function randomSong(rand: () => number, i: number): Song {
  return { id: `x${i}`, title: `Title ${i}`, artist: `Artist ${i}`, year: 1955 + Math.floor(rand() * 71) } as Song
}

/** Probability that `a` wins a race to `goal` cards against `b` (own timelines, random starter). */
export function raceWinRate(a: BotDifficulty, b: BotDifficulty, rounds: number, seed = 1, goal = 10): number {
  const rand = seeded(seed)
  let wins = 0
  for (let r = 0; r < rounds; r++) {
    const bots = [a, b].map((d) => new TimelineBotStrategy({ difficulty: d, skill: botSkill(d, rollForm(rand)), thinkingTimeMs: LISTEN }, rand))
    const lines: Song[][] = [[], []]
    let turn = rand() < 0.5 ? 0 : 1
    let n = 0
    for (;;) {
      const song = randomSong(rand, n++)
      const gap = bots[turn].selectPosition(song, lines[turn])
      const placed = evaluatePlacement(lines[turn], song, gap)
      if (placed.isCorrect) lines[turn] = placed.newTimeline
      if (lines[turn].length >= goal) {
        if (turn === 0) wins++
        break
      }
      turn = 1 - turn
    }
  }
  return wins / rounds
}

/** Probability that `a` scores more than `b` over `songs` hardcore songs (a tie counts half). */
export function hardcoreWinRate(a: BotDifficulty, b: BotDifficulty, rounds: number, seed = 1, songs = 10): number {
  const rand = seeded(seed)
  let wins = 0
  for (let r = 0; r < rounds; r++) {
    const pts = [a, b].map((d) => {
      const bot = new HardcoreBotStrategy({ difficulty: d, skill: botSkill(d, rollForm(rand)), thinkingTimeMs: LISTEN }, rand)
      let total = 0
      for (let i = 0; i < songs; i++) {
        const song = randomSong(rand, i)
        const g = bot.generateGuess(song)
        total += guessBreakdown({
          titleMatch: g.title.toLowerCase() === song.title.toLowerCase(),
          artistMatch: g.artist.toLowerCase() === song.artist.toLowerCase(),
          yearDifference: Math.abs(Number(g.year) - song.year)
        }).total
      }
      return total
    })
    wins += pts[0] > pts[1] ? 1 : pts[0] === pts[1] ? 0.5 : 0
  }
  return wins / rounds
}
