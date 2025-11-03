/**
 * Achievement Context
 * Manages achievement tracking and unlocking
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import {
  AchievementId,
  Achievement,
  PlayerAchievements,
  ACHIEVEMENT_DEFINITIONS
} from '@/types/achievements'
import type { GameHistoryData, HistoryEntry, Player } from '@/types'
import { useSettings } from './SettingsContext'
import { useAchievementNotifications } from './AchievementNotificationContext'

interface AchievementContextType {
  playerAchievements: Map<string, PlayerAchievements>
  unlockAchievement: (playerName: string, achievementId: AchievementId) => void
  checkAchievements: (playerName: string, gameHistory: GameHistoryData) => void
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
  const { queueNotification } = useAchievementNotifications()
  const [playerAchievements, setPlayerAchievements] = useState<Map<string, PlayerAchievements>>(
    new Map()
  )
  const [isLoaded, setIsLoaded] = useState(false)

  // Migrate existing player achievements to include new achievements (v0.0.23)
  const migratePlayerAchievements = useCallback((playerData: PlayerAchievements): PlayerAchievements => {
    const currentAchievementIds = Object.keys(ACHIEVEMENT_DEFINITIONS)
    const existingAchievementIds = playerData.achievements.map(a => a.id)

    // Find missing achievement IDs
    const missingIds = currentAchievementIds.filter(id => !existingAchievementIds.includes(id as AchievementId))

    if (missingIds.length > 0) {
      console.log(`🔄 Migrating ${playerData.playerName}: Adding ${missingIds.length} new achievements`)

      // Add missing achievements
      const newAchievements = missingIds.map(id => {
        const def = ACHIEVEMENT_DEFINITIONS[id as AchievementId]
        return {
          ...def,
          unlocked: false,
          progress: def.target ? 0 : undefined
        }
      })

      return {
        ...playerData,
        achievements: [...playerData.achievements, ...newAchievements]
      }
    }

    return playerData
  }, [])

  // Load achievements from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        const entries = Object.entries(data) as [string, PlayerAchievements][]

        // Migrate each player's achievements to include new ones
        const migratedEntries = entries.map(([playerName, playerData]) => {
          return [playerName, migratePlayerAchievements(playerData)] as [string, PlayerAchievements]
        })

        const map = new Map<string, PlayerAchievements>(migratedEntries)
        setPlayerAchievements(map)
        console.log(`📥 Loaded and migrated achievements for ${map.size} player(s) from localStorage`)
      }
    } catch (error) {
      console.error('Failed to load achievements:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [migratePlayerAchievements])

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
    } else {
      // Ensure player has all current achievements (migration for v0.0.23)
      const migrated = migratePlayerAchievements(achievements)
      if (migrated !== achievements) {
        // Update if migration happened
        setPlayerAchievements(new Map(playerAchievements).set(playerName, migrated))
        achievements = migrated
      }
    }
    return achievements
  }

  // Unlock achievement for player
  const unlockAchievement = useCallback((playerName: string, achievementId: AchievementId) => {
    setPlayerAchievements((currentMap) => {
      const achievements = currentMap.get(playerName) || initializePlayerAchievements(playerName)
      const achievement = achievements.achievements.find((a) => a.id === achievementId)

      if (achievement && !achievement.unlocked) {
        achievement.unlocked = true
        achievement.unlockedAt = Date.now()

        console.log(`🏆 Achievement unlocked for ${playerName}: ${achievement.name}`)

        // Queue notification for animation
        queueNotification(playerName, achievementId, achievement)

        const newMap = new Map(currentMap)
        newMap.set(playerName, { ...achievements })
        return newMap
      }

      return currentMap
    })
  }, [queueNotification])

  // Update player stats
  const updateStats = (playerName: string, statsUpdate: Partial<PlayerAchievements['stats']>) => {
    const achievements = getOrCreatePlayerAchievements(playerName)
    achievements.stats = { ...achievements.stats, ...statsUpdate }
    setPlayerAchievements(new Map(playerAchievements).set(playerName, { ...achievements }))
  }

  // Check and unlock achievements based on game history
  const checkAchievements = (playerName: string, gameHistory: GameHistoryData) => {
    // Calculate stats from game history
    const playerGames = gameHistory.games.filter((game: HistoryEntry) =>
      game.players.some((p: Player) => p.name === playerName)
    )

    const totalGames = playerGames.length
    const totalWins = playerGames.filter((game: HistoryEntry) => {
      const winner = game.players.reduce((prev: Player, current: Player) =>
        current.score > prev.score ? current : prev
      )
      return winner.name === playerName
    }).length

    const totalPoints = playerGames.reduce((sum: number, game: HistoryEntry) => {
      const player = game.players.find((p: Player) => p.name === playerName)
      return sum + (player?.score || 0)
    }, 0)

    // Check Marathon Runner (50 games)
    if (totalGames >= 50) {
      unlockAchievement(playerName, AchievementId.MARATHON_RUNNER)
    }
    updateProgress(playerName, AchievementId.MARATHON_RUNNER, totalGames)

    // Check Music Expert (1000 total points)
    if (totalPoints >= 1000) {
      unlockAchievement(playerName, AchievementId.MUSIC_EXPERT)
    }
    updateProgress(playerName, AchievementId.MUSIC_EXPERT, totalPoints)

    // Check Unbeatable (5 consecutive wins)
    let consecutiveWins = 0
    let maxConsecutiveWins = 0

    // Sort games by date
    const sortedGames = [...playerGames].sort((a, b) => a.timestamp - b.timestamp)

    sortedGames.forEach((game: HistoryEntry) => {
      const winner = game.players.reduce((prev: Player, current: Player) =>
        current.score > prev.score ? current : prev
      )

      if (winner.name === playerName) {
        consecutiveWins++
        maxConsecutiveWins = Math.max(maxConsecutiveWins, consecutiveWins)
      } else {
        consecutiveWins = 0
      }
    })

    if (maxConsecutiveWins >= 5) {
      unlockAchievement(playerName, AchievementId.UNBEATABLE)
    }
    updateProgress(playerName, AchievementId.UNBEATABLE, maxConsecutiveWins)

    // ============================================================================
    // NEW CROSS-GAME ACHIEVEMENTS (17-20)
    // ============================================================================

    // 17. SOCIAL_BUTTERFLY: Played with 5 different players
    const uniquePlayers = new Set<string>()
    playerGames.forEach((game: HistoryEntry) => {
      game.players.forEach((p: Player) => {
        if (p.name !== playerName) {
          uniquePlayers.add(p.name)
        }
      })
    })
    const uniquePlayerCount = uniquePlayers.size

    if (uniquePlayerCount >= 5) {
      unlockAchievement(playerName, AchievementId.SOCIAL_BUTTERFLY)
    }
    updateProgress(playerName, AchievementId.SOCIAL_BUTTERFLY, uniquePlayerCount)

    // 18. LEGENDARY_STREAK: 10 consecutive wins (VERY HARD)
    if (maxConsecutiveWins >= 10) {
      unlockAchievement(playerName, AchievementId.LEGENDARY_STREAK)
    }
    updateProgress(playerName, AchievementId.LEGENDARY_STREAK, maxConsecutiveWins)

    // 19. CENTURION: 100 games played (VERY HARD)
    if (totalGames >= 100) {
      unlockAchievement(playerName, AchievementId.CENTURION)
    }
    updateProgress(playerName, AchievementId.CENTURION, totalGames)

    // 20. GRAND_MASTER: 5000 total points (VERY HARD)
    if (totalPoints >= 5000) {
      unlockAchievement(playerName, AchievementId.GRAND_MASTER)
    }
    updateProgress(playerName, AchievementId.GRAND_MASTER, totalPoints)

    // Update stats
    updateStats(playerName, {
      totalGames,
      totalWins,
      totalPoints,
      consecutiveWins: maxConsecutiveWins
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
    if (!achievements) return []

    // Migrate if needed
    const migrated = migratePlayerAchievements(achievements)
    if (migrated !== achievements) {
      // Update the map if migration happened
      setPlayerAchievements(prev => new Map(prev).set(playerName, migrated))
    }

    return migrated.achievements
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

  // TEST EVENT LISTENER - For testing achievement animations in browser console
  useEffect(() => {
    const handleTestUnlock = (event: CustomEvent) => {
      const { playerName, achievementId } = event.detail
      console.log('🧪 TEST EVENT: Unlocking achievement', { playerName, achievementId })
      unlockAchievement(playerName, achievementId)
    }

    window.addEventListener('test-achievement-unlock' as any, handleTestUnlock as any)

    return () => {
      window.removeEventListener('test-achievement-unlock' as any, handleTestUnlock as any)
    }
  }, [unlockAchievement])

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
