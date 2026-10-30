/**
 * Bot Player Service
 * Orchestrates bot player turns across different game modes
 */

import type { Player, Song, GameMode } from '@/types'
import type { BotAction, BotConfig, BotDifficulty } from './botStrategies/types'
import { HardcoreBotStrategy } from './botStrategies/hardcoreBotStrategy'
import { TimelineBotStrategy } from './botStrategies/timelineBotStrategy'
import { botSkill } from './botForm'

/**
 * How long a bot listens before it answers: like a person, a few seconds of
 * the song (all strengths alike — only accuracy differs). Tests shorten it.
 */
export const BOT_LISTEN_MS = { min: 3000, max: 6000 }

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const

export class BotPlayer {
  private config: BotConfig

  constructor(player: Player) {
    if (!player.isBot || !player.botDifficulty) {
      throw new Error('Player must be a bot with difficulty set')
    }

    if (!DIFFICULTIES.includes(player.botDifficulty)) throw new Error(`Unknown bot difficulty: ${player.botDifficulty}`)
    // Strength this round: the difficulty plus the form rolled when the round began
    this.config = { difficulty: player.botDifficulty, skill: botSkill(player.botDifficulty, player.botForm ?? 0), thinkingTimeMs: { ...BOT_LISTEN_MS } }
  }

  async executeTurn(
    gameMode: GameMode,
    currentSong: Song,
    timeline: Song[],
    onComplete: (action: BotAction) => void,
    signal?: AbortSignal
  ): Promise<void> {
    // Listen to the song for a few seconds, then answer
    await this.delay(this.randomDelay(), signal)
    if (signal?.aborted) return

    // Execute mode-specific strategy
    if (gameMode === 'hardcore') {
      const strategy = new HardcoreBotStrategy(this.config)
      const guess = strategy.generateGuess(currentSong)
      onComplete({ type: 'guess', data: guess })
    } else {
      // Timeline Personal or Timeline Global
      const strategy = new TimelineBotStrategy(this.config)
      const position = strategy.selectPosition(currentSong, timeline)
      onComplete({ type: 'place', data: { position } })
    }
  }

  private randomDelay(): number {
    const { min, max } = this.config.thinkingTimeMs
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  private delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      if (signal?.aborted) return resolve()
      const timer = setTimeout(resolve, ms)
      signal?.addEventListener('abort', () => {
        clearTimeout(timer)
        resolve()
      })
    })
  }

  /** The listening time this bot uses (ms range). */
  get listenMs() {
    return { ...this.config.thinkingTimeMs }
  }
}

/**
 * Generate unique bot names
 */
const BOT_NAMES = [
  'Bot Alpha',
  'Bot Beta',
  'Bot Gamma',
  'Bot Delta',
  'KI-1',
  'KI-2',
  'KI-3',
  'Robo',
  'Cyber',
  'Neo'
]

export function generateBotName(index: number, usedNames: string[]): string {
  const baseName = BOT_NAMES[index % BOT_NAMES.length]
  let suffix = 1
  let name = baseName

  while (usedNames.includes(name)) {
    name = `${baseName} ${suffix}`
    suffix++
  }

  return name
}

/**
 * Create bot players. `difficulty` is one level for all, or one per bot (the
 * last one repeats when the list is short).
 */
export function createBotPlayers(
  count: number,
  difficulty: BotDifficulty | BotDifficulty[],
  existingPlayers: Player[]
): Player[] {
  const levelOf = (i: number): BotDifficulty =>
    Array.isArray(difficulty) ? (difficulty[Math.min(i, difficulty.length - 1)] ?? 'medium') : difficulty
  const usedNames = existingPlayers.map((p) => p.name)
  const bots: Player[] = []

  for (let i = 0; i < count; i++) {
    const botName = generateBotName(i, [...usedNames, ...bots.map((b) => b.name)])
    bots.push({
      name: botName,
      timeline: [],
      cards: 0,
      score: 0,
      isBot: true,
      botDifficulty: levelOf(i)
    })
  }

  return bots
}
