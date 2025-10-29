// Game History Management
// Stores completed games for later viewing and export

const HISTORY_KEY = 'mxster_game_history'

export class GameHistory {
  constructor() {
    this.history = this.loadAll()
  }

  /**
   * Load all game history from localStorage
   * @returns {Array} Array of completed games
   */
  loadAll() {
    try {
      const data = localStorage.getItem(HISTORY_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error loading game history:', error)
      return []
    }
  }

  /**
   * Save a completed game to history
   * @param {Object} gameData - Complete game data with winner info
   */
  saveGame(gameData) {
    const historyEntry = {
      id: Date.now(), // Unique ID for the game
      timestamp: Date.now(),
      date: new Date().toISOString(),
      winner: gameData.winner,
      players: gameData.players.map(p => ({
        name: p.name,
        cards: p.cards,
        tokens: p.tokens,
        timeline: p.timeline.map(song => ({
          id: song.id,
          title: song.title,
          artist: song.artist,
          year: song.year
        }))
      })),
      duration: gameData.duration || null, // Optional: game duration
      totalRounds: gameData.totalRounds || null // Optional: total rounds played
    }

    this.history.unshift(historyEntry) // Add to beginning of array (newest first)

    // Keep only last 50 games to prevent localStorage overflow
    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50)
    }

    this.saveToStorage()
    return historyEntry
  }

  /**
   * Save history to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history))
    } catch (error) {
      console.error('Error saving game history:', error)
    }
  }

  /**
   * Get all games from history
   * @returns {Array} All completed games
   */
  getAll() {
    return this.history
  }

  /**
   * Get a specific game by ID
   * @param {number} gameId - Game ID
   * @returns {Object|null} Game data or null
   */
  getById(gameId) {
    return this.history.find(game => game.id === gameId) || null
  }

  /**
   * Delete a specific game from history
   * @param {number} gameId - Game ID to delete
   */
  deleteGame(gameId) {
    this.history = this.history.filter(game => game.id !== gameId)
    this.saveToStorage()
  }

  /**
   * Clear all game history
   */
  clearAll() {
    this.history = []
    localStorage.removeItem(HISTORY_KEY)
  }

  /**
   * Export all game history as JSON
   * @returns {string} JSON string of all games
   */
  exportAll() {
    return JSON.stringify({
      version: '1.0',
      exportDate: new Date().toISOString(),
      totalGames: this.history.length,
      games: this.history
    }, null, 2)
  }

  /**
   * Import game history from JSON
   * @param {string} jsonData - JSON string with game history
   * @param {boolean} merge - If true, merge with existing history; if false, replace
   * @returns {Object} Import result with success status and message
   */
  importGames(jsonData, merge = true) {
    try {
      const data = JSON.parse(jsonData)

      if (!data.games || !Array.isArray(data.games)) {
        throw new Error('Ungültiges Format: "games" Array fehlt')
      }

      if (merge) {
        // Merge: Add imported games, avoid duplicates by ID
        const existingIds = new Set(this.history.map(g => g.id))
        const newGames = data.games.filter(g => !existingIds.has(g.id))
        this.history = [...this.history, ...newGames]

        // Sort by timestamp (newest first)
        this.history.sort((a, b) => b.timestamp - a.timestamp)

        // Keep only last 50
        if (this.history.length > 50) {
          this.history = this.history.slice(0, 50)
        }
      } else {
        // Replace: Overwrite all history
        this.history = data.games
      }

      this.saveToStorage()

      return {
        success: true,
        message: `${data.games.length} Spiel(e) erfolgreich importiert`,
        gamesImported: data.games.length
      }
    } catch (error) {
      return {
        success: false,
        message: `Import fehlgeschlagen: ${error.message}`,
        gamesImported: 0
      }
    }
  }

  /**
   * Get statistics from game history
   * @returns {Object} Statistics object
   */
  getStatistics() {
    if (this.history.length === 0) {
      return {
        totalGames: 0,
        totalPlayers: 0,
        winnerStats: {},
        averageGameCards: 0
      }
    }

    const winnerStats = {}
    let totalCards = 0

    this.history.forEach(game => {
      // Count wins per player
      if (game.winner && game.winner.name) {
        winnerStats[game.winner.name] = (winnerStats[game.winner.name] || 0) + 1
      }

      // Sum total cards from all players
      game.players.forEach(p => {
        totalCards += p.cards
      })
    })

    return {
      totalGames: this.history.length,
      totalPlayers: new Set(this.history.flatMap(g => g.players.map(p => p.name))).size,
      winnerStats,
      averageGameCards: (totalCards / this.history.length).toFixed(1),
      oldestGame: this.history[this.history.length - 1],
      newestGame: this.history[0]
    }
  }
}

export default new GameHistory()
