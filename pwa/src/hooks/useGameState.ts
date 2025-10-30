import { useCallback } from 'react'
import { useGame } from '@/contexts'
import type { SavedGameState } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'

/**
 * Hook for persisting and loading game state to/from localStorage
 */
export function useGameState() {
  const game = useGame()

  /**
   * Save current game state to localStorage
   */
  const saveGameState = useCallback(() => {
    try {
      const stateToSave: SavedGameState = {
        version: '0.0.5',
        gameMode: game.gameMode,
        gameVariant: game.gameVariant,
        randomStartPosition: game.randomStartPosition,
        players: game.players,
        currentPlayer: game.currentPlayer,
        currentDJ: game.currentDJ,
        currentSong: game.currentSong,
        globalTimeline: game.globalTimeline,
        playedSongs: game.playedSongs,
        timestamp: Date.now(),
        isGameStarted: game.isGameStarted,
        waitingForGuess: game.waitingForGuess
      }

      localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(stateToSave))
      console.log('✅ Game state saved')
      return true
    } catch (error) {
      console.error('❌ Error saving game state:', error)
      return false
    }
  }, [
    game.gameMode,
    game.gameVariant,
    game.randomStartPosition,
    game.players,
    game.currentPlayer,
    game.currentDJ,
    game.currentSong,
    game.globalTimeline,
    game.playedSongs,
    game.isGameStarted,
    game.waitingForGuess
  ])

  /**
   * Load game state from localStorage
   */
  const loadGameState = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GAME_STATE)
      if (!stored) {
        return null
      }

      const state: SavedGameState = JSON.parse(stored)

      // Validate state structure
      if (!state.players || !Array.isArray(state.players)) {
        console.warn('⚠️ Invalid game state structure')
        return null
      }

      console.log('✅ Game state loaded:', {
        players: state.players.length,
        gameMode: state.gameMode,
        timestamp: new Date(state.timestamp).toLocaleString()
      })

      return state
    } catch (error) {
      console.error('❌ Error loading game state:', error)
      return null
    }
  }, [])

  /**
   * Clear game state from localStorage
   */
  const clearGameState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.GAME_STATE)
      console.log('✅ Game state cleared')
      return true
    } catch (error) {
      console.error('❌ Error clearing game state:', error)
      return false
    }
  }, [])

  /**
   * Check if saved game state exists
   */
  const hasGameState = useCallback(() => {
    return localStorage.getItem(STORAGE_KEYS.GAME_STATE) !== null
  }, [])

  /**
   * Restore game from saved state
   */
  const restoreGameState = useCallback(() => {
    const state = loadGameState()
    if (state) {
      game.loadGameState(state)
      return true
    }
    return false
  }, [loadGameState, game])

  return {
    saveGameState,
    loadGameState,
    clearGameState,
    hasGameState,
    restoreGameState
  }
}
