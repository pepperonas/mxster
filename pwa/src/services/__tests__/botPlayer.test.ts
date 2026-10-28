/**
 * Unit Tests for Bot Player Service
 * Tests bot player orchestration and name generation
 */

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { BotPlayer, BOT_LISTEN_MS, generateBotName, createBotPlayers } from '../botPlayer'

const REAL_LISTEN = { ...BOT_LISTEN_MS }
const realListening = () => Object.assign(BOT_LISTEN_MS, REAL_LISTEN)
// Most tests here are about the answer, not the wait
beforeEach(() => Object.assign(BOT_LISTEN_MS, { min: 1, max: 2 }))
afterAll(realListening)
import { GameMode, type Player, type Song } from '@/types'

describe('BotPlayer', () => {
  const createTestPlayer = (name: string, difficulty: 'easy' | 'medium' | 'hard'): Player => ({
    name,
    timeline: [],
    cards: 0,
    score: 0,
    isBot: true,
    botDifficulty: difficulty
  })

  const testSong: Song = {
    id: 'test_001',
    title: 'Test Song',
    artist: 'Test Artist',
    year: 1985,
    spotifyId: 'spotify123',
    previewUrl: 'https://example.com/preview.mp3',
    genre: 'Pop'
  }

  describe('Constructor', () => {
    it('should initialize with bot player', () => {
      const player = createTestPlayer('Bot Alpha', 'medium')
      const botPlayer = new BotPlayer(player)

      expect(botPlayer).toBeDefined()
    })

    it('should throw error for non-bot player', () => {
      const humanPlayer: Player = {
        name: 'Human',
        timeline: [],
        cards: 0,
        score: 0,
        isBot: false
      }

      expect(() => new BotPlayer(humanPlayer)).toThrow()
    })

    it('should throw error for bot without difficulty', () => {
      const invalidBot: Player = {
        name: 'Invalid Bot',
        timeline: [],
        cards: 0,
        score: 0,
        isBot: true
        // Missing botDifficulty
      }

      expect(() => new BotPlayer(invalidBot)).toThrow()
    })
  })

  describe('executeTurn - Hardcore Mode', () => {
    it('should execute guess action for hardcore mode', async () => {
      const player = createTestPlayer('Bot Alpha', 'medium')
      const botPlayer = new BotPlayer(player)

      const mockCallback = vi.fn()

      await botPlayer.executeTurn(GameMode.HARDCORE, testSong, [], mockCallback)

      // Callback should be called with guess action
      expect(mockCallback).toHaveBeenCalledOnce()
      const action = mockCallback.mock.calls[0][0]

      expect(action.type).toBe('guess')
      expect(action.data).toHaveProperty('title')
      expect(action.data).toHaveProperty('artist')
      expect(action.data).toHaveProperty('year')
    })

    it('listens 3–6 seconds before it answers, every strength alike', async () => {
      realListening()
      vi.useFakeTimers()
      try {
        for (const level of ['easy', 'medium', 'hard'] as const) {
          const bot = new BotPlayer(createTestPlayer('Bot Alpha', level))
          expect(bot.listenMs).toEqual({ min: 3000, max: 6000 })
          const done = vi.fn()
          const turn = bot.executeTurn(GameMode.HARDCORE, testSong, [], done)
          await vi.advanceTimersByTimeAsync(2999)
          expect(done).not.toHaveBeenCalled()
          await vi.advanceTimersByTimeAsync(3001)
          await turn
          expect(done).toHaveBeenCalledTimes(1)
        }
      } finally {
        vi.useRealTimers()
      }
    })

    it('answers at the shortest and the longest listening time', async () => {
      realListening()
      vi.useFakeTimers()
      const rand = vi.spyOn(Math, 'random')
      try {
        for (const [r, ms] of [[0, 3000], [0.9999999, 6000]] as const) {
          rand.mockReturnValue(r)
          const done = vi.fn()
          const turn = new BotPlayer(createTestPlayer('Bot Alpha', 'easy')).executeTurn(GameMode.HARDCORE, testSong, [], done)
          await vi.advanceTimersByTimeAsync(ms - 1)
          expect(done).not.toHaveBeenCalled()
          await vi.advanceTimersByTimeAsync(1)
          await turn
          expect(done).toHaveBeenCalledTimes(1)
        }
      } finally {
        rand.mockRestore()
        vi.useRealTimers()
      }
    })

    it('never answers once its turn was called off', async () => {
      realListening()
      vi.useFakeTimers()
      try {
        const ctrl = new AbortController()
        const done = vi.fn()
        const turn = new BotPlayer(createTestPlayer('Bot Alpha', 'hard')).executeTurn(GameMode.TIMELINE_GLOBAL, testSong, [], done, ctrl.signal)
        await vi.advanceTimersByTimeAsync(1000)
        ctrl.abort()
        await vi.advanceTimersByTimeAsync(10000)
        await turn
        expect(done).not.toHaveBeenCalled()
      } finally {
        vi.useRealTimers()
      }
    })

    it('rejects an unknown strength', () => {
      expect(() => new BotPlayer({ ...createTestPlayer('Bot X', 'easy'), botDifficulty: 'insane' as never })).toThrow()
    })
  })

  describe('executeTurn - Timeline Mode', () => {
    it('should execute place action for timeline mode', async () => {
      const player = createTestPlayer('Bot Beta', 'hard')
      const botPlayer = new BotPlayer(player)

      const timeline: Song[] = [
        { ...testSong, id: 'song1', year: 1980 },
        { ...testSong, id: 'song2', year: 1990 }
      ]

      const mockCallback = vi.fn()

      await botPlayer.executeTurn(GameMode.TIMELINE_PERSONAL, testSong, timeline, mockCallback)

      // Callback should be called with place action
      expect(mockCallback).toHaveBeenCalledOnce()
      const action = mockCallback.mock.calls[0][0]

      expect(action.type).toBe('place')
      expect(action.data).toHaveProperty('position')
      expect(typeof action.data.position).toBe('number')
      expect(action.data.position).toBeGreaterThanOrEqual(0)
      expect(action.data.position).toBeLessThanOrEqual(timeline.length)
    })

    it('should work for timeline_global mode', async () => {
      const player = createTestPlayer('Bot Gamma', 'medium')
      const botPlayer = new BotPlayer(player)

      const mockCallback = vi.fn()

      await botPlayer.executeTurn(GameMode.TIMELINE_GLOBAL, testSong, [], mockCallback)

      expect(mockCallback).toHaveBeenCalledOnce()
      const action = mockCallback.mock.calls[0][0]

      expect(action.type).toBe('place')
    })
  })
})

describe('generateBotName', () => {
  it('should generate unique bot names', () => {
    const usedNames: string[] = []

    const name1 = generateBotName(0, usedNames)
    expect(name1).toBe('Bot Alpha')
    usedNames.push(name1)

    const name2 = generateBotName(1, usedNames)
    expect(name2).toBe('Bot Beta')
    usedNames.push(name2)

    const name3 = generateBotName(2, usedNames)
    expect(name3).toBe('Bot Gamma')
  })

  it('should add numeric suffix when name is taken', () => {
    const usedNames = ['Bot Alpha']

    const name = generateBotName(0, usedNames)

    expect(name).toBe('Bot Alpha 1')
  })

  it('should increment suffix for multiple conflicts', () => {
    const usedNames = ['Bot Alpha', 'Bot Alpha 1', 'Bot Alpha 2']

    const name = generateBotName(0, usedNames)

    expect(name).toBe('Bot Alpha 3')
  })

  it('should cycle through bot names', () => {
    const usedNames: string[] = []

    // Test cycling through all 10 names
    const name10 = generateBotName(10, usedNames) // Should wrap to index 0
    expect(name10).toBe('Bot Alpha')

    const name15 = generateBotName(15, usedNames) // Should wrap to index 5
    expect(name15).toBe('KI-2')
  })
})

describe('createBotPlayers', () => {
  it('should create specified number of bot players', () => {
    const existingPlayers: Player[] = [
      { name: 'Human', timeline: [], cards: 0, score: 0 }
    ]

    const bots = createBotPlayers(3, 'medium', existingPlayers)

    expect(bots).toHaveLength(3)
    expect(bots.every(bot => bot.isBot)).toBe(true)
    expect(bots.every(bot => bot.botDifficulty === 'medium')).toBe(true)
  })

  it('should create bots with unique names', () => {
    const existingPlayers: Player[] = []

    const bots = createBotPlayers(5, 'hard', existingPlayers)

    const names = bots.map(bot => bot.name)
    const uniqueNames = new Set(names)

    expect(uniqueNames.size).toBe(5) // All names should be unique
  })

  it('should not conflict with existing player names', () => {
    const existingPlayers: Player[] = [
      { name: 'Bot Alpha', timeline: [], cards: 0, score: 0 }
    ]

    const bots = createBotPlayers(2, 'easy', existingPlayers)

    expect(bots[0].name).not.toBe('Bot Alpha')
    expect(bots[1].name).not.toBe('Bot Alpha')
  })

  it('should initialize bots with correct default values', () => {
    const bots = createBotPlayers(1, 'medium', [])

    const bot = bots[0]

    expect(bot.timeline).toEqual([])
    expect(bot.cards).toBe(0)
    expect(bot.score).toBe(0)
    expect(bot.isBot).toBe(true)
    expect(bot.botDifficulty).toBe('medium')
  })

  it('should handle all difficulty levels', () => {
    const easyBots = createBotPlayers(1, 'easy', [])
    const mediumBots = createBotPlayers(1, 'medium', [])
    const hardBots = createBotPlayers(1, 'hard', [])

    expect(easyBots[0].botDifficulty).toBe('easy')
    expect(mediumBots[0].botDifficulty).toBe('medium')
    expect(hardBots[0].botDifficulty).toBe('hard')
  })
})
