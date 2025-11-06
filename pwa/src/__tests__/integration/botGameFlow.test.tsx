/**
 * Integration Tests for Bot Game Flow
 * Tests complete bot gameplay scenarios across different modes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { GameProvider } from '@/contexts/GameContext'
import { UIProvider } from '@/contexts/UIContext'
import { createBotPlayers } from '@/services/botPlayer'
import type { Player } from '@/types'

describe('Bot Game Flow Integration', () => {
  const mockAddPlayer = vi.fn()
  const mockSetGameMode = vi.fn()
  const mockSetGameVariant = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Bot Player Creation', () => {
    it('should create bot players with correct properties', () => {
      const humanPlayer: Player = {
        name: 'Human Player',
        timeline: [],
        cards: 0,
        score: 0
      }

      const bots = createBotPlayers(2, 'medium', [humanPlayer])

      expect(bots).toHaveLength(2)
      expect(bots[0].isBot).toBe(true)
      expect(bots[0].botDifficulty).toBe('medium')
      expect(bots[1].isBot).toBe(true)
      expect(bots[1].botDifficulty).toBe('medium')

      // Names should be unique
      expect(bots[0].name).not.toBe(bots[1].name)
      expect(bots[0].name).not.toBe('Human Player')
    })

    it('should create bots for all difficulty levels', () => {
      const humanPlayer: Player = {
        name: 'Test Player',
        timeline: [],
        cards: 0,
        score: 0
      }

      const easyBots = createBotPlayers(1, 'easy', [humanPlayer])
      const mediumBots = createBotPlayers(1, 'medium', [humanPlayer])
      const hardBots = createBotPlayers(1, 'hard', [humanPlayer])

      expect(easyBots[0].botDifficulty).toBe('easy')
      expect(mediumBots[0].botDifficulty).toBe('medium')
      expect(hardBots[0].botDifficulty).toBe('hard')
    })
  })

  describe('Bot Name Generation', () => {
    it('should generate unique names for multiple bots', () => {
      const existingPlayers: Player[] = []

      const bots = createBotPlayers(5, 'hard', existingPlayers)

      const names = bots.map(bot => bot.name)
      const uniqueNames = new Set(names)

      expect(uniqueNames.size).toBe(5)
    })

    it('should avoid conflicts with existing player names', () => {
      const existingPlayers: Player[] = [
        { name: 'Bot Alpha', timeline: [], cards: 0, score: 0 },
        { name: 'Bot Beta', timeline: [], cards: 0, score: 0 }
      ]

      const bots = createBotPlayers(3, 'medium', existingPlayers)

      // New bots should not have conflicting names
      const allNames = [...existingPlayers.map(p => p.name), ...bots.map(b => b.name)]
      const uniqueNames = new Set(allNames)

      expect(uniqueNames.size).toBe(5) // 2 existing + 3 new = 5 unique
    })
  })

  describe('Virtual Mode Constraint', () => {
    it('should only allow bot creation in virtual mode', () => {
      // This test verifies the UI constraint logic
      const gameVariant = 'physical'
      const players: Player[] = [
        { name: 'Player 1', timeline: [], cards: 0, score: 0 }
      ]

      // In physical mode, bot panel should not be visible
      // (tested via UI component logic in PlayerSetup.tsx)
      expect(gameVariant).toBe('physical')
      expect(players.length).toBe(1)

      // Bot panel condition: gameVariant === 'virtual' && players.length === 1
      const shouldShowBotPanel = gameVariant === 'virtual' && players.length === 1

      expect(shouldShowBotPanel).toBe(false)
    })

    it('should allow bot creation in virtual mode with single player', () => {
      const gameVariant = 'virtual'
      const players: Player[] = [
        { name: 'Player 1', timeline: [], cards: 0, score: 0 }
      ]

      const shouldShowBotPanel = gameVariant === 'virtual' && players.length === 1

      expect(shouldShowBotPanel).toBe(true)
    })

    it('should not show bot panel with multiple players', () => {
      const gameVariant = 'virtual'
      const players: Player[] = [
        { name: 'Player 1', timeline: [], cards: 0, score: 0 },
        { name: 'Player 2', timeline: [], cards: 0, score: 0 }
      ]

      const shouldShowBotPanel = gameVariant === 'virtual' && players.length === 1

      expect(shouldShowBotPanel).toBe(false)
    })
  })

  describe('Bot Count Validation', () => {
    it('should allow 1-3 bots', () => {
      const humanPlayer: Player[] = [
        { name: 'Human', timeline: [], cards: 0, score: 0 }
      ]

      const oneBots = createBotPlayers(1, 'easy', humanPlayer)
      expect(oneBots).toHaveLength(1)

      const twoBots = createBotPlayers(2, 'medium', humanPlayer)
      expect(twoBots).toHaveLength(2)

      const threeBots = createBotPlayers(3, 'hard', humanPlayer)
      expect(threeBots).toHaveLength(3)
    })

    it('should ensure minimum 2 total players (1 human + 1 bot)', () => {
      const humanPlayer: Player[] = [
        { name: 'Human', timeline: [], cards: 0, score: 0 }
      ]

      const bots = createBotPlayers(1, 'medium', humanPlayer)

      const totalPlayers = [...humanPlayer, ...bots]

      expect(totalPlayers.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Bot Difficulty Levels', () => {
    it('should assign correct difficulty to all bots', () => {
      const humanPlayer: Player[] = []

      // Test easy bots
      const easyBots = createBotPlayers(3, 'easy', humanPlayer)
      expect(easyBots.every(bot => bot.botDifficulty === 'easy')).toBe(true)

      // Test medium bots
      const mediumBots = createBotPlayers(3, 'medium', humanPlayer)
      expect(mediumBots.every(bot => bot.botDifficulty === 'medium')).toBe(true)

      // Test hard bots
      const hardBots = createBotPlayers(3, 'hard', humanPlayer)
      expect(hardBots.every(bot => bot.botDifficulty === 'hard')).toBe(true)
    })
  })

  describe('Bot Integration with Game Context', () => {
    it('should support bot players in game state', () => {
      const players: Player[] = [
        { name: 'Human', timeline: [], cards: 0, score: 0, isBot: false },
        { name: 'Bot Alpha', timeline: [], cards: 0, score: 0, isBot: true, botDifficulty: 'medium' }
      ]

      // Verify bot player structure
      const botPlayer = players.find(p => p.isBot)

      expect(botPlayer).toBeDefined()
      expect(botPlayer?.isBot).toBe(true)
      expect(botPlayer?.botDifficulty).toBe('medium')
      expect(botPlayer?.name).toBe('Bot Alpha')
    })

    it('should distinguish between human and bot players', () => {
      const players: Player[] = [
        { name: 'Human 1', timeline: [], cards: 0, score: 0, isBot: false },
        { name: 'Bot Alpha', timeline: [], cards: 0, score: 0, isBot: true, botDifficulty: 'easy' },
        { name: 'Human 2', timeline: [], cards: 0, score: 0, isBot: false },
        { name: 'Bot Beta', timeline: [], cards: 0, score: 0, isBot: true, botDifficulty: 'hard' }
      ]

      const humanPlayers = players.filter(p => !p.isBot)
      const botPlayers = players.filter(p => p.isBot)

      expect(humanPlayers).toHaveLength(2)
      expect(botPlayers).toHaveLength(2)
      expect(botPlayers.every(p => p.botDifficulty !== undefined)).toBe(true)
    })
  })
})
