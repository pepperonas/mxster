export class GameState {
  constructor() {
    this.storageKey = 'hitster_game_state'
  }

  save(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
      return false
    }
  }

  load() {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Fehler beim Laden:', error)
      return null
    }
  }

  clear() {
    try {
      localStorage.removeItem(this.storageKey)
      return true
    } catch (error) {
      console.error('Fehler beim Löschen:', error)
      return false
    }
  }

  exists() {
    return localStorage.getItem(this.storageKey) !== null
  }
}
