/**
 * Game History Management
 * Stores completed games for later viewing and export
 */

import type { Player, Song, GameMode } from '@/types'

// ============================================================================
// Types
// ============================================================================

export interface HistoryPlayer {
  name: string
  cards: number
  score: number
  timeline: Array<{
    id: string
    title: string
    artist: string
    year: number
  }>
}

export interface GameHistoryEntry {
  id: number // Unique ID for the game
  timestamp: number
  date: string // ISO date string
  gameMode: GameMode
  winner: HistoryPlayer
  players: HistoryPlayer[]
  duration?: number // Optional: game duration in seconds
  totalRounds?: number // Optional: total rounds played
}

export interface GameHistoryExport {
  version: string
  exportDate: string
  totalGames: number
  games: GameHistoryEntry[]
}

export interface GameStatistics {
  totalGames: number
  totalPlayers: number
  winnerStats: Record<string, number> // player name -> win count
  averageGameScore: number
  oldestGame: GameHistoryEntry | null
  newestGame: GameHistoryEntry | null
}

export interface ImportResult {
  success: boolean
  message: string
  gamesImported: number
}

// ============================================================================
// Game History Service
// ============================================================================

const HISTORY_KEY = 'mxster_game_history'
const MAX_HISTORY_SIZE = 50

class GameHistoryClass {
  private history: GameHistoryEntry[] = []

  constructor() {
    this.history = this.loadAll()
  }

  /**
   * Load all game history from localStorage
   */
  loadAll(): GameHistoryEntry[] {
    try {
      const data = localStorage.getItem(HISTORY_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('❌ Error loading game history:', error)
      return []
    }
  }

  /**
   * Save a completed game to history
   */
  saveGame(
    winner: Player,
    players: Player[],
    gameMode: GameMode,
    duration?: number,
    totalRounds?: number
  ): GameHistoryEntry {
    const historyEntry: GameHistoryEntry = {
      id: Date.now(),
      timestamp: Date.now(),
      date: new Date().toISOString(),
      gameMode,
      winner: this.playerToHistoryPlayer(winner),
      players: players.map((p) => this.playerToHistoryPlayer(p)),
      duration,
      totalRounds
    }

    this.history.unshift(historyEntry) // Add to beginning (newest first)

    // Keep only last 50 games to prevent localStorage overflow
    if (this.history.length > MAX_HISTORY_SIZE) {
      this.history = this.history.slice(0, MAX_HISTORY_SIZE)
    }

    this.saveToStorage()
    console.log('✅ Game saved to history:', historyEntry.id)
    return historyEntry
  }

  /**
   * Convert Player to HistoryPlayer
   */
  private playerToHistoryPlayer(player: Player): HistoryPlayer {
    return {
      name: player.name,
      cards: player.cards,
      score: player.score,
      timeline: player.timeline.map((song: Song) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        year: song.year
      }))
    }
  }

  /**
   * Save history to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history))
    } catch (error) {
      console.error('❌ Error saving game history:', error)
    }
  }

  /**
   * Get all games from history
   */
  getAll(): GameHistoryEntry[] {
    return this.history
  }

  /**
   * Get a specific game by ID
   */
  getById(gameId: number): GameHistoryEntry | null {
    return this.history.find((game) => game.id === gameId) || null
  }

  /**
   * Delete a specific game from history
   */
  deleteGame(gameId: number): void {
    this.history = this.history.filter((game) => game.id !== gameId)
    this.saveToStorage()
    console.log('🗑️ Game deleted from history:', gameId)
  }

  /**
   * Clear all game history
   */
  clearAll(): void {
    this.history = []
    localStorage.removeItem(HISTORY_KEY)
    console.log('🗑️ All game history cleared')
  }

  /**
   * Export all game history as JSON
   */
  exportAll(): string {
    const exportData: GameHistoryExport = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      totalGames: this.history.length,
      games: this.history
    }
    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Export history to downloadable file
   */
  exportToFile(): void {
    const json = this.exportAll()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mxster-history-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    console.log('📥 History exported to file')
  }

  /**
   * Import game history from JSON
   */
  importGames(jsonData: string, merge: boolean = true): ImportResult {
    try {
      const data = JSON.parse(jsonData) as GameHistoryExport

      if (!data.games || !Array.isArray(data.games)) {
        throw new Error('Ungültiges Format: "games" Array fehlt')
      }

      if (merge) {
        // Merge: Add imported games, avoid duplicates by ID
        const existingIds = new Set(this.history.map((g) => g.id))
        const newGames = data.games.filter((g) => !existingIds.has(g.id))
        this.history = [...this.history, ...newGames]

        // Sort by timestamp (newest first)
        this.history.sort((a, b) => b.timestamp - a.timestamp)

        // Keep only last 50
        if (this.history.length > MAX_HISTORY_SIZE) {
          this.history = this.history.slice(0, MAX_HISTORY_SIZE)
        }
      } else {
        // Replace: Overwrite all history
        this.history = data.games
      }

      this.saveToStorage()

      console.log('✅ History imported:', data.games.length, 'games')

      return {
        success: true,
        message: `${data.games.length} Spiel(e) erfolgreich importiert`,
        gamesImported: data.games.length
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Import failed:', errorMessage)

      return {
        success: false,
        message: `Import fehlgeschlagen: ${errorMessage}`,
        gamesImported: 0
      }
    }
  }

  /**
   * Get statistics from game history
   */
  getStatistics(): GameStatistics {
    if (this.history.length === 0) {
      return {
        totalGames: 0,
        totalPlayers: 0,
        winnerStats: {},
        averageGameScore: 0,
        oldestGame: null,
        newestGame: null
      }
    }

    const winnerStats: Record<string, number> = {}
    let totalScore = 0

    this.history.forEach((game) => {
      // Count wins per player
      if (game.winner && game.winner.name) {
        winnerStats[game.winner.name] = (winnerStats[game.winner.name] || 0) + 1
      }

      // Sum total scores from all players
      game.players.forEach((p) => {
        totalScore += p.score
      })
    })

    return {
      totalGames: this.history.length,
      totalPlayers: new Set(this.history.flatMap((g) => g.players.map((p) => p.name))).size,
      winnerStats,
      averageGameScore: parseFloat((totalScore / this.history.length).toFixed(1)),
      oldestGame: this.history[this.history.length - 1] || null,
      newestGame: this.history[0] || null
    }
  }

  /**
   * Get history size
   */
  getSize(): number {
    return this.history.length
  }
}

// Export singleton instance
export const GameHistory = new GameHistoryClass()
