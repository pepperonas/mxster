import { useState, useCallback, useEffect } from 'react'
import type { HistoryEntry, GameHistoryData, Player } from '@/types'
import { STORAGE_KEYS, GAME_CONFIG } from '@/utils/constants'

interface SaveGameData {
  winner: {
    name: string
    cards: number
    score: number
  }
  players: Player[]
  gameMode: string
  gameVariant: string
  duration?: number
  totalRounds?: number
}

interface GameStatistics {
  totalGames: number
  totalPlayers: number
  winnerStats: Record<string, number>
  averageGameCards: string
  oldestGame?: HistoryEntry
  newestGame?: HistoryEntry
}

interface ImportResult {
  success: boolean
  message: string
  gamesImported: number
}

/**
 * Hook for managing game history (completed games)
 */
export function useGameHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([])

  /**
   * Load all game history from localStorage
   */
  const loadAll = useCallback(() => {
    try {
      // Try current key first
      let stored = localStorage.getItem(STORAGE_KEYS.GAME_HISTORY)

      // Migration: Try old key if current key is empty
      if (!stored) {
        const oldStored = localStorage.getItem('mxster_history')

        if (oldStored) {
          console.log('📦 Migrating game history: mxster_history → mxster_game_history')
          stored = oldStored
          // Save to new key
          localStorage.setItem(STORAGE_KEYS.GAME_HISTORY, oldStored)
          // Remove old key
          localStorage.removeItem('mxster_history')
          console.log('✅ Migration complete')
        }
      }

      if (stored) {
        const data = JSON.parse(stored) as HistoryEntry[]
        setHistory(data)
        console.log(`✅ Loaded ${data.length} game(s) from history`)
        return data
      }

      return []
    } catch (error) {
      console.error('❌ Error loading game history:', error)
      return []
    }
  }, [])

  // Load history from localStorage on mount
  useEffect(() => {
    loadAll()
  }, [loadAll])

  /**
   * Save history to localStorage
   */
  const saveToStorage = useCallback((historyData: HistoryEntry[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.GAME_HISTORY, JSON.stringify(historyData))
    } catch (error) {
      console.error('❌ Error saving game history:', error)
    }
  }, [])

  /**
   * Save a completed game to history
   */
  const saveGame = useCallback(
    (gameData: SaveGameData) => {
      const historyEntry: HistoryEntry = {
        id: Date.now(),
        timestamp: Date.now(),
        date: new Date().toISOString(),
        winner: gameData.winner,
        players: gameData.players.map((p) => ({
          name: p.name,
          cards: p.cards,
          score: p.score,
          timeline: p.timeline.map((song) => ({
            id: song.id,
            title: song.title,
            artist: song.artist,
            year: song.year
          }))
        })),
        gameMode: gameData.gameMode as any,
        gameVariant: gameData.gameVariant as any,
        duration: gameData.duration || undefined,
        totalRounds: gameData.totalRounds || undefined
      }

      const newHistory = [historyEntry, ...history]

      // Keep only last 50 games to prevent localStorage overflow
      const limitedHistory =
        newHistory.length > GAME_CONFIG.MAX_HISTORY_GAMES
          ? newHistory.slice(0, GAME_CONFIG.MAX_HISTORY_GAMES)
          : newHistory

      setHistory(limitedHistory)
      saveToStorage(limitedHistory)

      console.log('✅ Game saved to history:', historyEntry.id)
      return historyEntry
    },
    [history, saveToStorage]
  )

  /**
   * Get all games from history
   */
  const getAll = useCallback(() => {
    return history
  }, [history])

  /**
   * Get a specific game by ID
   */
  const getById = useCallback(
    (gameId: number): HistoryEntry | null => {
      return history.find((game) => game.id === gameId) || null
    },
    [history]
  )

  /**
   * Delete a specific game from history
   */
  const deleteGame = useCallback(
    (gameId: number) => {
      const newHistory = history.filter((game) => game.id !== gameId)
      setHistory(newHistory)
      saveToStorage(newHistory)
      console.log('✅ Game deleted from history:', gameId)
    },
    [history, saveToStorage]
  )

  /**
   * Clear all game history
   */
  const clearAll = useCallback(() => {
    setHistory([])
    localStorage.removeItem(STORAGE_KEYS.GAME_HISTORY)
    console.log('✅ Game history cleared')
  }, [])

  /**
   * Export all game history as JSON string
   */
  const exportAll = useCallback(() => {
    const exportData: GameHistoryData = {
      version: '1.0',
      games: history
    }
    return JSON.stringify(exportData, null, 2)
  }, [history])

  /**
   * Import game history from JSON
   * @param jsonData - JSON string with game history
   * @param merge - If true, merge with existing; if false, replace
   */
  const importGames = useCallback(
    (jsonData: string, merge: boolean = true): ImportResult => {
      try {
        const data = JSON.parse(jsonData) as GameHistoryData

        if (!data.games || !Array.isArray(data.games)) {
          throw new Error('Ungültiges Format: "games" Array fehlt')
        }

        let newHistory: HistoryEntry[]

        if (merge) {
          // Merge: Add imported games, avoid duplicates by ID
          const existingIds = new Set(history.map((g) => g.id))
          const newGames = data.games.filter((g) => !existingIds.has(g.id))
          newHistory = [...history, ...newGames]

          // Sort by timestamp (newest first)
          newHistory.sort((a, b) => b.timestamp - a.timestamp)

          // Keep only last 50
          if (newHistory.length > GAME_CONFIG.MAX_HISTORY_GAMES) {
            newHistory = newHistory.slice(0, GAME_CONFIG.MAX_HISTORY_GAMES)
          }
        } else {
          // Replace: Overwrite all history
          newHistory = data.games
        }

        setHistory(newHistory)
        saveToStorage(newHistory)

        return {
          success: true,
          message: `${data.games.length} Spiel(e) erfolgreich importiert`,
          gamesImported: data.games.length
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return {
          success: false,
          message: `Import fehlgeschlagen: ${errorMessage}`,
          gamesImported: 0
        }
      }
    },
    [history, saveToStorage]
  )

  /**
   * Get statistics from game history
   */
  const getStatistics = useCallback((): GameStatistics => {
    if (history.length === 0) {
      return {
        totalGames: 0,
        totalPlayers: 0,
        winnerStats: {},
        averageGameCards: '0'
      }
    }

    const winnerStats: Record<string, number> = {}
    let totalCards = 0

    history.forEach((game) => {
      // Count wins per player
      if (game.winner && game.winner.name) {
        winnerStats[game.winner.name] = (winnerStats[game.winner.name] || 0) + 1
      }

      // Sum total cards from all players
      game.players.forEach((p) => {
        totalCards += p.cards
      })
    })

    return {
      totalGames: history.length,
      totalPlayers: new Set(history.flatMap((g) => g.players.map((p) => p.name))).size,
      winnerStats,
      averageGameCards: (totalCards / history.length).toFixed(1),
      oldestGame: history[history.length - 1],
      newestGame: history[0]
    }
  }, [history])

  return {
    history,
    loadAll,
    saveGame,
    getAll,
    getById,
    deleteGame,
    clearAll,
    exportAll,
    importGames,
    getStatistics
  }
}
