/**
 * Game State Management
 * Handles saving and loading game state to/from localStorage
 */

export class GameState {
  private storageKey: string

  constructor() {
    this.storageKey = 'hitster_game_state'
  }

  /**
   * Save data to localStorage
   */
  save(data: any): boolean {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
      return false
    }
  }

  /**
   * Load data from localStorage
   */
  load(): any | null {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Fehler beim Laden:', error)
      return null
    }
  }

  /**
   * Clear saved data
   */
  clear(): boolean {
    try {
      localStorage.removeItem(this.storageKey)
      return true
    } catch (error) {
      console.error('Fehler beim Löschen:', error)
      return false
    }
  }

  /**
   * Check if saved data exists
   */
  exists(): boolean {
    return localStorage.getItem(this.storageKey) !== null
  }
}
