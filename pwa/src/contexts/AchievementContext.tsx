/**
 * Achievement Context
 * Manages achievement tracking and unlocking
 */

import { createContext, useContext, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react'
import { useSyncedDoc } from '@/sync/useSyncedDoc'
import { mergeAchievements, type AchievementDoc } from '@/sync/merge'
import {
  AchievementId,
  Achievement,
  PlayerAchievements,
  ACHIEVEMENT_DEFINITIONS,
  localizeAchievement
} from '@/types/achievements'
import { applyAchievementEffects, initializePlayerAchievements, type AchievementEffect } from '@/game/achievementEngine'
import { useSettings } from './SettingsContext'
import { useAchievementNotifications } from './AchievementNotificationContext'

interface AchievementContextType {
  playerAchievements: Map<string, PlayerAchievements>
  /** Apply a batch of effects in one step (unlocks, progress, counters). */
  applyEffects: (effects: AchievementEffect[], options?: { silent?: boolean }) => void
  /** The document has loaded from the account. */
  ready: boolean
  unlockAchievement: (playerName: string, achievementId: AchievementId) => void
  updateProgress: (playerName: string, achievementId: AchievementId, progress: number) => void
  getPlayerAchievements: (playerName: string) => Achievement[]
  getAllPlayerNames: () => string[]
  exportAchievements: () => string
  importAchievements: (data: string) => void
  /** Move a person's achievements to another name (merges with what is there). */
  renamePlayer: (from: string, to: string) => void
  /** Drop a person's achievements. */
  removePlayer: (name: string) => void
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined)

const STORAGE_KEY = 'mxster_achievements'

export function AchievementProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const { queueNotification } = useAchievementNotifications()

  // Migrate existing player achievements to include new achievements (v0.0.23)
  // AND clean up progress from one-time achievements (v0.0.25)
  const migratePlayerAchievements = useCallback((playerData: PlayerAchievements): PlayerAchievements => {
    const currentAchievementIds = Object.keys(ACHIEVEMENT_DEFINITIONS)
    const existingAchievementIds = playerData.achievements.map(a => a.id)

    let hasChanges = false

    // Step 1: Clean up existing achievements (remove progress if no target in definition)
    const cleanedAchievements = playerData.achievements.map(achievement => {
      const def = ACHIEVEMENT_DEFINITIONS[achievement.id as AchievementId]
      if (def && !def.target && achievement.progress !== undefined) {
        hasChanges = true
        return {
          ...achievement,
          progress: undefined
        }
      }
      return achievement
    })

    // Step 2: Find missing achievement IDs
    const missingIds = currentAchievementIds.filter(id => !existingAchievementIds.includes(id as AchievementId))

    if (missingIds.length > 0) {
      hasChanges = true

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
        achievements: [...cleanedAchievements, ...newAchievements]
      }
    }

    return hasChanges ? { ...playerData, achievements: cleanedAchievements } : playerData
  }, [])

  const migrateDoc = useCallback(
    (raw: unknown): AchievementDoc => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
      return Object.fromEntries(
        Object.entries(raw as AchievementDoc).map(([name, data]) => [name, migratePlayerAchievements(data)])
      )
    },
    [migratePlayerAchievements]
  )

  // Stored per account on the server; pre-account data is adopted once.
  const { value: doc, setValue: setDoc, status } = useSyncedDoc<AchievementDoc>('achievements', {
    initial: {},
    merge: mergeAchievements,
    legacyKey: STORAGE_KEY,
    fromLegacy: (raw) => {
      const d = migrateDoc(raw)
      return Object.keys(d).length ? d : null
    },
    normalize: migrateDoc
  })

  const playerAchievements = useMemo(() => new Map(Object.entries(doc)), [doc])

  /** Map-shaped setter over the stored document (keeps the existing call sites). */
  const setPlayerAchievements = useCallback(
    (next: Map<string, PlayerAchievements> | ((m: Map<string, PlayerAchievements>) => Map<string, PlayerAchievements>)) =>
      setDoc((prev) => {
        const current = new Map(Object.entries(prev))
        const result = typeof next === 'function' ? next(current) : next
        return result === current ? prev : Object.fromEntries(result)
      }),
    [setDoc]
  )

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
        }
      })

      return hasChanges ? newMap : prevMap
    })
  }, [settings.savedPlayers])

  // The latest document, also between renders: effects applied in a burst
  // build on each other instead of on the snapshot of the last render.
  const latest = useRef(doc)
  latest.current = doc
  const notified = useRef(new Set<string>())

  const applyEffects = useCallback(
    (effects: AchievementEffect[], options?: { silent?: boolean }) => {
      if (effects.length === 0) return
      const now = Date.now()
      const { doc: next, unlocked } = applyAchievementEffects(latest.current, effects, now)
      latest.current = next
      setDoc((prev) => applyAchievementEffects(prev, effects, now).doc)
      for (const u of unlocked) {
        const key = `${u.player}\u0000${u.id}`
        if (notified.current.has(key)) continue
        notified.current.add(key)
        if (options?.silent) continue
        queueNotification(u.player, u.id, u.achievement)
      }
    },
    [setDoc, queueNotification]
  )

  const unlockAchievement = useCallback(
    (player: string, id: AchievementId) => applyEffects([{ type: 'unlock', player, id }]),
    [applyEffects]
  )
  const updateProgress = useCallback(
    (player: string, id: AchievementId, value: number) => applyEffects([{ type: 'progress', player, id, value }]),
    [applyEffects]
  )

  // Get all achievements for a player
  const getPlayerAchievements = (playerName: string): Achievement[] => {
    const achievements = playerAchievements.get(playerName)
    if (!achievements) return []

    // Read-only: the document is already migrated when it loads (normalize);
    // writing state here would update during render
    const migrated = migratePlayerAchievements(achievements)

    // ALWAYS clean achievements before returning (removes progress from one-time achievements).
    // Name and description come from the definitions in the current language: the
    // stored document may still hold old (German) strings.
    return migrated.achievements.map(achievement => {
      const def = ACHIEVEMENT_DEFINITIONS[achievement.id as AchievementId]
      // If definition has no target but achievement has progress, clean it
      if (def && !def.target && achievement.progress !== undefined) {
        return localizeAchievement({ ...achievement, progress: undefined })
      }
      return localizeAchievement(achievement)
    })
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
    } catch (error) {
      console.error('Failed to import achievements:', error)
      throw error
    }
  }

  const renamePlayer = useCallback(
    (from: string, to: string) =>
      setDoc((prev) => {
        const mine = prev[from]
        if (!mine || from === to) return prev
        const { [from]: _gone, ...rest } = prev
        const moved = { ...mine, playerName: to }
        const target = rest[to]
        return { ...rest, [to]: target ? mergeAchievements({ [to]: moved }, { [to]: target })[to] : moved }
      }),
    [setDoc]
  )

  const removePlayer = useCallback(
    (name: string) =>
      setDoc((prev) => {
        if (!prev[name]) return prev
        const { [name]: _gone, ...rest } = prev
        return rest
      }),
    [setDoc]
  )

  return (
    <AchievementContext.Provider
      value={{
        playerAchievements,
        applyEffects,
        ready: status === 'ready',
        unlockAchievement,
        updateProgress,
        getPlayerAchievements,
        getAllPlayerNames,
        exportAchievements,
        importAchievements,
        renamePlayer,
        removePlayer
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
