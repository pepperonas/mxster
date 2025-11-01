/**
 * Achievement Context
 * Manages achievement tracking and unlocking
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  AchievementId,
  Achievement,
  PlayerAchievements,
  ACHIEVEMENT_DEFINITIONS
} from '@/types/achievements'
import type { GameHistory } from '@/types'
import { useSettings } from './SettingsContext'

interface AchievementContextType {
  playerAchievements: Map<string, PlayerAchievements>
  unlockAchievement: (playerName: string, achievementId: AchievementId) => void
  checkAchievements: (playerName: string, gameHistory: GameHistory) => void
  updateStats: (playerName: string, statsUpdate: Partial<PlayerAchievements['stats']>) => void
  updateProgress: (playerName: string, achievementId: AchievementId, progress: number) => void
  getPlayerAchievements: (playerName: string) => Achievement[]
  getAllPlayerNames: () => string[]
  exportAchievements: () => string
  importAchievements: (data: string) => void
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined)

const STORAGE_KEY = 'mxster_achievements'

// Initialize player achievements with all locked achievements
function initializePlayerAchievements(playerName: string): PlayerAchievements {
  const achievements: Achievement[] = Object.values(ACHIEVEMENT_DEFINITIONS).map((def) => ({
    ...def,
    unlocked: false,
    progress: def.target ? 0 : undefined
  }))

  return {
    playerName,
    achievements,
    stats: {
      totalGames: 0,
      totalWins: 0,
      consecutiveWins: 0,
      totalPoints: 0,
      perfectStreakCurrent: 0,
      perfectStreakBest: 0
    }
  }
}

export function AchievementProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const [playerAchievements, setPlayerAchievements] = useState<Map<string, PlayerAchievements>>(
    new Map()
  )
  const [isLoaded, setIsLoaded] = useState(false)

  // Load achievements from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        const map = new Map<string, PlayerAchievements>(Object.entries(data))
        setPlayerAchievements(map)
        console.log(`📥 Loaded achievements for ${map.size} player(s) from localStorage`)
      }
    } catch (error) {
      console.error('Failed to load achievements:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Auto-initialize achievements for all saved players
  useEffect(() => {
    if (settings.savedPlayers.length === 0) return

    setPlayerAchievements((prevMap) => {
      const newMap = new Map(prevMap)
      let hasChanges = false

      settings.savedPlayers.forEach((playerName) => {
        // Only initialize if player doesn't exist AND has no achievements
        const existingPlayer = newMap.get(playerName)
        if (!existingPlayer) {
          newMap.set(playerName, initializePlayerAchievements(playerName))
          hasChanges = true
          console.log(`🎮 Auto-initialized achievements for player: ${playerName}`)
        } else {
          // Player exists - check if they have unlocked achievements
          const unlocked = existingPlayer.achievements.filter(a => a.unlocked).length
          console.log(`✅ Player ${playerName} already exists with ${unlocked} unlocked achievements`)
        }
      })

      return hasChanges ? newMap : prevMap
    })
  }, [settings.savedPlayers])

  // Save achievements to localStorage whenever they change (but only after initial load)
  useEffect(() => {
    if (!isLoaded) return // Don't save until we've loaded from localStorage first!

    try {
      const data = Object.fromEntries(playerAchievements)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      console.log(`💾 Saved achievements for ${playerAchievements.size} player(s) to localStorage`)
    } catch (error) {
      console.error('Failed to save achievements:', error)
    }
  }, [playerAchievements, isLoaded])

  // Get or create player achievements
  const getOrCreatePlayerAchievements = (playerName: string): PlayerAchievements => {
    let achievements = playerAchievements.get(playerName)
    if (!achievements) {
      achievements = initializePlayerAchievements(playerName)
      setPlayerAchievements(new Map(playerAchievements).set(playerName, achievements))
    }
    return achievements
  }

  // Unlock achievement for player
  const unlockAchievement = (playerName: string, achievementId: AchievementId) => {
    const achievements = getOrCreatePlayerAchievements(playerName)
    const achievement = achievements.achievements.find((a) => a.id === achievementId)

    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true
      achievement.unlockedAt = Date.now()

      setPlayerAchievements(new Map(playerAchievements).set(playerName, { ...achievements }))

      console.log(`🏆 Achievement unlocked for ${playerName}: ${achievement.name}`)
    }
  }

  // Update player stats
  const updateStats = (playerName: string, statsUpdate: Partial<PlayerAchievements['stats']>) => {
    const achievements = getOrCreatePlayerAchievements(playerName)
    achievements.stats = { ...achievements.stats, ...statsUpdate }
    setPlayerAchievements(new Map(playerAchievements).set(playerName, { ...achievements }))
  }

  // Check and unlock achievements based on game history
  const checkAchievements = (playerName: string, gameHistory: GameHistory) => {
    const achievements = getOrCreatePlayerAchievements(playerName)

    // Calculate stats from game history
    const playerGames = gameHistory.games.filter((game) =>
      game.players.some((p) => p.name === playerName)
    )

    const totalGames = playerGames.length
    const totalWins = playerGames.filter((game) => {
      const winner = game.players.reduce((prev, current) =>
        current.score > prev.score ? current : prev
      )
      return winner.name === playerName
    }).length

    const totalPoints = playerGames.reduce((sum, game) => {
      const player = game.players.find((p) => p.name === playerName)
      return sum + (player?.score || 0)
    }, 0)

    // Check Marathon Runner (50 games)
    if (totalGames >= 50) {
      unlockAchievement(playerName, AchievementId.MARATHON_RUNNER)
    }

    // Check Music Expert (1000 total points)
    if (totalPoints >= 1000) {
      unlockAchievement(playerName, AchievementId.MUSIC_EXPERT)
    }

    // Update stats
    updateStats(playerName, {
      totalGames,
      totalWins,
      totalPoints
    })
  }

  // Update achievement progress
  const updateProgress = (playerName: string, achievementId: AchievementId, progress: number) => {
    const achievements = getOrCreatePlayerAchievements(playerName)
    const achievement = achievements.achievements.find((a) => a.id === achievementId)

    if (achievement && achievement.target !== undefined) {
      achievement.progress = Math.min(progress, achievement.target)

      // Auto-unlock if target reached
      if (achievement.progress >= achievement.target && !achievement.unlocked) {
        unlockAchievement(playerName, achievementId)
      } else {
        setPlayerAchievements(new Map(playerAchievements).set(playerName, { ...achievements }))
      }
    }
  }

  // Get all achievements for a player
  const getPlayerAchievements = (playerName: string): Achievement[] => {
    const achievements = playerAchievements.get(playerName)
    return achievements?.achievements || []
  }

  // Get all player names who have achievements
  const getAllPlayerNames = (): string[] => {
    return Array.from(playerAchievements.keys())
  }

  // Export achievements as JSON
  const exportAchievements = (): string => {
    const data = Object.fromEntries(playerAchievements)
    return JSON.stringify(data, null, 2)
  }

  // Import achievements from JSON
  const importAchievements = (data: string) => {
    try {
      const parsed = JSON.parse(data)
      const map = new Map<string, PlayerAchievements>(Object.entries(parsed))
      setPlayerAchievements(map)
      console.log('✅ Achievements imported successfully')
    } catch (error) {
      console.error('❌ Failed to import achievements:', error)
      throw error
    }
  }

  return (
    <AchievementContext.Provider
      value={{
        playerAchievements,
        unlockAchievement,
        checkAchievements,
        updateStats,
        updateProgress,
        getPlayerAchievements,
        getAllPlayerNames,
        exportAchievements,
        importAchievements
      }}
    >
      {children}
    </AchievementContext.Provider>
  )
}

export function useAchievements() {
  const context = useContext(AchievementContext)
  if (!context) {
    throw new Error('useAchievements must be used within AchievementProvider')
  }
  return context
}
