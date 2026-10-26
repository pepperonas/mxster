/**
 * Game History Context
 * Manages completed game history with shared state across all components
 */

import { createContext, useContext, useCallback, ReactNode } from 'react'
import type { HistoryEntry, GameHistoryData, Player } from '@/types'
import { GAME_CONFIG } from '@/utils/constants'
import { useSyncedDoc } from '@/sync/useSyncedDoc'
import { mergeHistory } from '@/sync/merge'

interface SaveGameData {
  winner: {
    name: string
    cards: number
    score: number
  }
  players: Player[]
  gameMode: string
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

interface GameHistoryContextType {
  history: HistoryEntry[]
  loadAll: () => HistoryEntry[]
  saveGame: (gameData: SaveGameData) => HistoryEntry
  getAll: () => HistoryEntry[]
  getById: (gameId: number) => HistoryEntry | null
  deleteGame: (gameId: number) => void
  clearAll: () => void
  exportAll: () => string
  importGames: (jsonData: string, merge?: boolean) => ImportResult
  getStatistics: () => GameStatistics
}

const GameHistoryContext = createContext<GameHistoryContextType | undefined>(undefined)

export function GameHistoryProvider({ children }: { children: ReactNode }) {
  const { value: history, setValue: setHistory } = useSyncedDoc<HistoryEntry[]>('history', {
    initial: [],
    merge: (local, server) => mergeHistory(local, server).slice(0, GAME_CONFIG.MAX_HISTORY_GAMES),
    // Pre-account history lived in the browser (two historic keys)
    legacyKey: localStorage.getItem('mxster_game_history') ? 'mxster_game_history' : 'mxster_history',
    fromLegacy: (raw) => (Array.isArray(raw) && raw.length > 0 ? (raw as HistoryEntry[]) : null),
    normalize: (raw) => (Array.isArray(raw) ? (raw as HistoryEntry[]) : [])
  })

  /**
   * Load all game history (for backward compatibility)
   */
  const loadAll = useCallback(() => {
    return history
  }, [history])

  /**
   * Save a completed game to history
   */
  const saveGame = useCallback(
    (gameData: SaveGameData): HistoryEntry => {
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
            year: song.year,
            genre: song.genre  // Include genre for statistics (v0.0.31)
          }))
        })),
        gameMode: gameData.gameMode as any,
        duration: gameData.duration || undefined,
        totalRounds: gameData.totalRounds || undefined
      }

      // Keep only last 50 games to prevent localStorage overflow
      setHistory((prevHistory) => {
        const newHistory = [historyEntry, ...prevHistory]
        const limitedHistory =
          newHistory.length > GAME_CONFIG.MAX_HISTORY_GAMES
            ? newHistory.slice(0, GAME_CONFIG.MAX_HISTORY_GAMES)
            : newHistory

        return limitedHistory
      })

      return historyEntry
    },
    [setHistory]
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
  const deleteGame = useCallback((gameId: number) => {
    setHistory((prevHistory) => {
      const newHistory = prevHistory.filter((game) => game.id !== gameId)
      return newHistory
    })
  }, [setHistory])

  /**
   * Clear all game history
   */
  const clearAll = useCallback(() => {
    setHistory([])
  }, [setHistory])

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

        setHistory((prevHistory) => {
          let newHistory: HistoryEntry[]

          if (merge) {
            // Merge: Add imported games, avoid duplicates by ID
            const existingIds = new Set(prevHistory.map((g) => g.id))
            const newGames = data.games.filter((g) => !existingIds.has(g.id))
            newHistory = [...prevHistory, ...newGames]

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

          return newHistory
        })

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
    [setHistory]
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

  return (
    <GameHistoryContext.Provider
      value={{
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
      }}
    >
      {children}
    </GameHistoryContext.Provider>
  )
}

export function useGameHistory() {
  const context = useContext(GameHistoryContext)
  if (!context) {
    throw new Error('useGameHistory must be used within GameHistoryProvider')
  }
  return context
}
