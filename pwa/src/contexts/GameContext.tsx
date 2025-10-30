import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import type { Player, Song, GameMode, GameVariant } from '@/types'

// ============================================================================
// Storage Key
// ============================================================================

const GAME_STATE_STORAGE_KEY = 'mxster_game_state'

// ============================================================================
// Types
// ============================================================================

interface GameState {
  // Game Configuration
  gameMode: GameMode | null
  gameVariant: GameVariant | null
  randomStartPosition: boolean

  // Players
  players: Player[]
  currentPlayer: number
  currentDJ: number

  // Current Game State
  currentSong: Song | null
  waitingForGuess: boolean

  // Timeline
  globalTimeline: Song[]
  playedSongs: string[]

  // Game Started
  isGameStarted: boolean
}

type GameAction =
  | { type: 'SET_GAME_MODE'; payload: GameMode }
  | { type: 'SET_GAME_VARIANT'; payload: GameVariant }
  | { type: 'SET_RANDOM_START_POSITION'; payload: boolean }
  | { type: 'ADD_PLAYER'; payload: string }
  | { type: 'REMOVE_PLAYER'; payload: number }
  | { type: 'UPDATE_PLAYER'; payload: { index: number; player: Partial<Player> } }
  | { type: 'SET_CURRENT_PLAYER'; payload: number }
  | { type: 'SET_CURRENT_DJ'; payload: number }
  | { type: 'SET_CURRENT_SONG'; payload: Song | null }
  | { type: 'SET_WAITING_FOR_GUESS'; payload: boolean }
  | { type: 'ADD_TO_GLOBAL_TIMELINE'; payload: Song }
  | { type: 'ADD_TO_PLAYED_SONGS'; payload: string }
  | { type: 'START_GAME' }
  | { type: 'END_GAME' }
  | { type: 'RESET_GAME' }
  | { type: 'LOAD_GAME_STATE'; payload: Partial<GameState> }
  | { type: 'NEXT_TURN' }

interface GameContextValue extends GameState {
  setGameMode: (mode: GameMode) => void
  setGameVariant: (variant: GameVariant) => void
  setRandomStartPosition: (enabled: boolean) => void
  addPlayer: (name: string) => void
  removePlayer: (index: number) => void
  updatePlayer: (index: number, player: Partial<Player>) => void
  setCurrentPlayer: (index: number) => void
  setCurrentDJ: (index: number) => void
  setCurrentSong: (song: Song | null) => void
  setWaitingForGuess: (waiting: boolean) => void
  addToGlobalTimeline: (song: Song) => void
  addToPlayedSongs: (songId: string) => void
  startGame: () => void
  endGame: () => void
  resetGame: () => void
  loadGameState: (state: Partial<GameState>) => void
  nextTurn: () => void
}

// ============================================================================
// Context
// ============================================================================

const GameContext = createContext<GameContextValue | undefined>(undefined)

// ============================================================================
// Initial State
// ============================================================================

const initialState: GameState = {
  gameMode: null,
  gameVariant: null,
  randomStartPosition: false,
  players: [],
  currentPlayer: 0,
  currentDJ: 0,
  currentSong: null,
  waitingForGuess: false,
  globalTimeline: [],
  playedSongs: [],
  isGameStarted: false
}

// ============================================================================
// Reducer
// ============================================================================

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_GAME_MODE':
      return { ...state, gameMode: action.payload }

    case 'SET_GAME_VARIANT':
      return { ...state, gameVariant: action.payload }

    case 'SET_RANDOM_START_POSITION':
      return { ...state, randomStartPosition: action.payload }

    case 'ADD_PLAYER': {
      const newPlayer: Player = {
        name: action.payload,
        timeline: [],
        cards: 0,
        score: 0
      }
      return { ...state, players: [...state.players, newPlayer] }
    }

    case 'REMOVE_PLAYER': {
      const newPlayers = state.players.filter((_, index) => index !== action.payload)
      // Adjust current indices if needed
      let newCurrentPlayer = state.currentPlayer
      let newCurrentDJ = state.currentDJ

      if (state.currentPlayer >= newPlayers.length) {
        newCurrentPlayer = Math.max(0, newPlayers.length - 1)
      }
      if (state.currentDJ >= newPlayers.length) {
        newCurrentDJ = Math.max(0, newPlayers.length - 1)
      }

      return {
        ...state,
        players: newPlayers,
        currentPlayer: newCurrentPlayer,
        currentDJ: newCurrentDJ
      }
    }

    case 'UPDATE_PLAYER': {
      const newPlayers = [...state.players]
      newPlayers[action.payload.index] = {
        ...newPlayers[action.payload.index],
        ...action.payload.player
      }
      return { ...state, players: newPlayers }
    }

    case 'SET_CURRENT_PLAYER':
      return { ...state, currentPlayer: action.payload }

    case 'SET_CURRENT_DJ':
      return { ...state, currentDJ: action.payload }

    case 'SET_CURRENT_SONG':
      return { ...state, currentSong: action.payload }

    case 'SET_WAITING_FOR_GUESS':
      return { ...state, waitingForGuess: action.payload }

    case 'ADD_TO_GLOBAL_TIMELINE': {
      const newTimeline = [...state.globalTimeline, action.payload]
      newTimeline.sort((a, b) => a.year - b.year)
      return { ...state, globalTimeline: newTimeline }
    }

    case 'ADD_TO_PLAYED_SONGS':
      if (state.playedSongs.includes(action.payload)) {
        return state
      }
      return { ...state, playedSongs: [...state.playedSongs, action.payload] }

    case 'START_GAME':
      return { ...state, isGameStarted: true }

    case 'END_GAME':
      return { ...state, isGameStarted: false }

    case 'RESET_GAME':
      return {
        ...initialState,
        gameMode: state.gameMode,
        gameVariant: state.gameVariant,
        randomStartPosition: state.randomStartPosition
      }

    case 'LOAD_GAME_STATE':
      return { ...state, ...action.payload }

    case 'NEXT_TURN': {
      const playerCount = state.players.length
      if (playerCount === 0) return state

      console.log('🟢 NEXT_TURN reducer called')
      console.log('🟢 Old currentPlayer:', state.currentPlayer)
      console.log('🟢 Old currentSong:', state.currentSong?.title)

      // Wechsle zum nächsten Spieler (im Uhrzeigersinn)
      let newCurrentPlayer = (state.currentPlayer + 1) % playerCount
      let newCurrentDJ = state.currentDJ

      // Nur im physischen Guess-Modus: DJ-Wechsel-Logik
      // Im Timeline-Modus legen alle Spieler (inkl. DJ) selbst Karten
      if (state.gameVariant === 'physical' && state.gameMode === 'guess') {
        // Wenn wieder beim DJ: DJ wechselt
        if (newCurrentPlayer === newCurrentDJ) {
          newCurrentDJ = (newCurrentDJ + 1) % playerCount
          newCurrentPlayer = (newCurrentPlayer + 1) % playerCount
        }
      }

      console.log('🟢 New currentPlayer:', newCurrentPlayer)
      console.log('🟢 New currentSong: null')
      console.log('🟢 Players:', state.players.map(p => p.name))

      return {
        ...state,
        currentPlayer: newCurrentPlayer,
        currentDJ: newCurrentDJ,
        currentSong: null,
        waitingForGuess: false
      }
    }

    default:
      return state
  }
}

// ============================================================================
// Provider
// ============================================================================

interface GameProviderProps {
  children: ReactNode
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  // Auto-save game state to localStorage on every important change
  useEffect(() => {
    if (!state.isGameStarted) {
      // Don't save if game hasn't started yet
      return
    }

    try {
      const gameStateToSave = {
        gameMode: state.gameMode,
        gameVariant: state.gameVariant,
        randomStartPosition: state.randomStartPosition,
        players: state.players,
        currentPlayer: state.currentPlayer,
        currentDJ: state.currentDJ,
        currentSong: state.currentSong,
        globalTimeline: state.globalTimeline,
        playedSongs: state.playedSongs,
        isGameStarted: state.isGameStarted,
        savedAt: Date.now()
      }

      localStorage.setItem(GAME_STATE_STORAGE_KEY, JSON.stringify(gameStateToSave))
      console.log('💾 Game state auto-saved')
    } catch (error) {
      console.error('❌ Failed to auto-save game state:', error)
    }
  }, [
    state.gameMode,
    state.gameVariant,
    state.players,
    state.currentPlayer,
    state.currentDJ,
    state.currentSong,
    state.globalTimeline,
    state.playedSongs,
    state.isGameStarted
  ])

  // Load saved game state on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(GAME_STATE_STORAGE_KEY)
      if (savedState) {
        const parsed = JSON.parse(savedState)
        console.log('📦 Found saved game state:', {
          savedAt: parsed.savedAt ? new Date(parsed.savedAt).toLocaleString('de-DE') : 'unknown',
          players: parsed.players?.length || 0
        })

        // Optional: Auto-load saved state or show dialog
        // For now, we just log it - the user can load it via UI
      }
    } catch (error) {
      console.error('❌ Failed to load saved game state:', error)
    }
  }, [])

  const value: GameContextValue = {
    ...state,
    setGameMode: (mode) => dispatch({ type: 'SET_GAME_MODE', payload: mode }),
    setGameVariant: (variant) => dispatch({ type: 'SET_GAME_VARIANT', payload: variant }),
    setRandomStartPosition: (enabled) => dispatch({ type: 'SET_RANDOM_START_POSITION', payload: enabled }),
    addPlayer: (name) => dispatch({ type: 'ADD_PLAYER', payload: name }),
    removePlayer: (index) => dispatch({ type: 'REMOVE_PLAYER', payload: index }),
    updatePlayer: (index, player) => dispatch({ type: 'UPDATE_PLAYER', payload: { index, player } }),
    setCurrentPlayer: (index) => dispatch({ type: 'SET_CURRENT_PLAYER', payload: index }),
    setCurrentDJ: (index) => dispatch({ type: 'SET_CURRENT_DJ', payload: index }),
    setCurrentSong: (song) => dispatch({ type: 'SET_CURRENT_SONG', payload: song }),
    setWaitingForGuess: (waiting) => dispatch({ type: 'SET_WAITING_FOR_GUESS', payload: waiting }),
    addToGlobalTimeline: (song) => dispatch({ type: 'ADD_TO_GLOBAL_TIMELINE', payload: song }),
    addToPlayedSongs: (songId) => dispatch({ type: 'ADD_TO_PLAYED_SONGS', payload: songId }),
    startGame: () => dispatch({ type: 'START_GAME' }),
    endGame: () => dispatch({ type: 'END_GAME' }),
    resetGame: () => dispatch({ type: 'RESET_GAME' }),
    loadGameState: (gameState) => dispatch({ type: 'LOAD_GAME_STATE', payload: gameState }),
    nextTurn: () => dispatch({ type: 'NEXT_TURN' })
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

// ============================================================================
// Hook
// ============================================================================

export function useGame() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
