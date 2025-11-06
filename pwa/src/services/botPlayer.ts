/**
 * Bot Player Service
 * Orchestrates bot player turns across different game modes
 */

import type { Player, Song, GameMode } from '@/types'
import type { BotAction, BotConfig } from './botStrategies/types'
import { HardcoreBotStrategy } from './botStrategies/hardcoreBotStrategy'
import { TimelineBotStrategy } from './botStrategies/timelineBotStrategy'

const DIFFICULTY_CONFIGS: Record<'easy' | 'medium' | 'hard', BotConfig> = {
  easy: {
    difficulty: 'easy',
    thinkingTimeMs: { min: 500, max: 800 } // Fast response
  },
  medium: {
    difficulty: 'medium',
    thinkingTimeMs: { min: 500, max: 800 } // Same speed as easy
  },
  hard: {
    difficulty: 'hard',
    thinkingTimeMs: { min: 500, max: 800 } // Same speed - only accuracy differs
  }
}

export class BotPlayer {
  private config: BotConfig

  constructor(player: Player) {
    if (!player.isBot || !player.botDifficulty) {
      throw new Error('Player must be a bot with difficulty set')
    }

    this.config = DIFFICULTY_CONFIGS[player.botDifficulty]
  }

  async executeTurn(
    gameMode: GameMode,
    currentSong: Song,
    timeline: Song[],
    onComplete: (action: BotAction) => void
  ): Promise<void> {
    // Simulate thinking time
    const thinkingTime = this.randomDelay()
    await this.delay(thinkingTime)

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

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
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
 * Create bot players
 */
export function createBotPlayers(
  count: number,
  difficulty: 'easy' | 'medium' | 'hard',
  existingPlayers: Player[]
): Player[] {
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
      botDifficulty: difficulty
    })
  }

  return bots
}
