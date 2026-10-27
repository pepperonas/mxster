import { createContext, useContext, useEffect, useReducer, ReactNode } from 'react'
import type { Player, Song, GameMode, GlobalTimelineCard, TurnRecord } from '@/types'
import { nextContender, type Tiebreak } from '@/game/tiebreak'
import { DEFAULT_GOAL } from '@/game/roundEnd'
import { STARTING_CHALLENGES } from '@/game/challenge'
import type { PendingPlacement, Reveal } from '@/game/turn'
import type { RankingSnapshot } from '@/game/achievementRules'
import { clearSavedGame, loadSavedGame, saveGame } from '@/game/savedGame'

// ============================================================================
// Types
// ============================================================================

interface GameState {
  // Game Configuration
  gameMode: GameMode | null
  randomStartPosition: boolean

  // Players
  players: Player[]
  currentPlayer: number

  // Current Game State
  currentSong: Song | null
  waitingForGuess: boolean

  // Timeline
  globalTimeline: GlobalTimelineCard[]
  playedSongs: string[]

  // Skip Penalty System (Guess Mode)
  currentSongSkips: Record<number, number> // playerIndex -> skip count for current song

  // Game Started
  isGameStarted: boolean

  /** Set while a level lead is played out (only contenders take turns). */
  tiebreak: Tiebreak | null

  // Round options
  /** Correct cards (timeline) / songs per player (hardcore) a round runs to. */
  goal: number
  /** Decades songs are drawn from; empty = all. */
  decades: number[]
  /** Einspruch is on (timeline modes only). */
  challengesEnabled: boolean
  /** Little-known tracks (song.exotic) may come up. */
  exotics: boolean

  // Turn (kept here so a reload resumes exactly where the round stood)
  reveal: Reveal | null
  pending: PendingPlacement | null
  /** The round has a winner (result screen is showing). */
  finished: boolean
  startedAt: number
  rankingsHistory: RankingSnapshot[]
  /** Booked turns of this round, for the statistics. */
  turnLog: TurnRecord[]
}

export type RoundOptions = Pick<GameState, 'goal' | 'decades' | 'challengesEnabled' | 'exotics'>

type GameAction =
  | { type: 'SET_GAME_MODE'; payload: GameMode | null }
  | { type: 'SET_RANDOM_START_POSITION'; payload: boolean }
  | { type: 'ADD_PLAYER'; payload: string; playerData?: Partial<Player> }
  | { type: 'REMOVE_PLAYER'; payload: number }
  | { type: 'UPDATE_PLAYER'; payload: { index: number; player: Partial<Player> } }
  | { type: 'SET_CURRENT_PLAYER'; payload: number }
  | { type: 'SET_CURRENT_SONG'; payload: Song | null }
  | { type: 'SET_WAITING_FOR_GUESS'; payload: boolean }
  | { type: 'ADD_TO_GLOBAL_TIMELINE'; payload: { song: Song; playerId: number } }
  | { type: 'ADD_TO_PLAYED_SONGS'; payload: string }
  | { type: 'INCREMENT_SKIP_COUNT'; payload: number } // playerIndex
  | { type: 'RESET_SKIP_COUNTS' }
  | { type: 'START_GAME' }
  | { type: 'END_GAME' }
  | { type: 'RESET_GAME' }
  | { type: 'REMATCH' }
  | { type: 'LOAD_GAME_STATE'; payload: Partial<GameState> }
  | { type: 'NEXT_TURN' }
  | { type: 'NEXT_PLAYER_ONLY' } // Switch player, keep currentSong
  | { type: 'SET_TIEBREAK'; payload: Tiebreak | null }
  | { type: 'SET_OPTIONS'; payload: Partial<RoundOptions> }
  | { type: 'SET_PLAYERS'; payload: Player[] }
  | { type: 'SET_REVEAL'; payload: Reveal | null }
  | { type: 'SET_PENDING'; payload: PendingPlacement | null }
  | { type: 'FINISH' }
  | { type: 'PUSH_RANKING'; payload: RankingSnapshot }
  | { type: 'LOG_TURN'; payload: TurnRecord }

interface GameContextValue extends GameState {
  setGameMode: (mode: GameMode | null) => void
  setRandomStartPosition: (enabled: boolean) => void
  addPlayer: (name: string, playerData?: Partial<Player>) => void
  removePlayer: (index: number) => void
  updatePlayer: (index: number, player: Partial<Player>) => void
  setCurrentPlayer: (index: number) => void
  setCurrentSong: (song: Song | null) => void
  setWaitingForGuess: (waiting: boolean) => void
  addToGlobalTimeline: (song: Song, playerId: number) => void
  addToPlayedSongs: (songId: string) => void
  incrementSkipCount: (playerIndex: number) => void
  resetSkipCounts: () => void
  startGame: () => void
  endGame: () => void
  resetGame: () => void
  /** Same players and mode, fresh scores and timelines, game running. */
  rematch: () => void
  loadGameState: (state: Partial<GameState>) => void
  nextTurn: () => void
  nextPlayerOnly: () => void // Switch player but keep song
  setTiebreak: (tiebreak: Tiebreak | null) => void
  setOptions: (options: Partial<RoundOptions>) => void
  /** Replace the whole line-up (teams). */
  setPlayers: (players: Player[]) => void
  setReveal: (reveal: Reveal | null) => void
  setPending: (pending: PendingPlacement | null) => void
  finish: () => void
  pushRanking: (snapshot: RankingSnapshot) => void
  logTurn: (turn: TurnRecord) => void
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
  randomStartPosition: false,
  players: [],
  currentPlayer: 0,
  currentSong: null,
  waitingForGuess: false,
  globalTimeline: [],
  playedSongs: [],
  currentSongSkips: {},
  isGameStarted: false,
  tiebreak: null,
  goal: DEFAULT_GOAL,
  decades: [],
  challengesEnabled: true,
  exotics: false,
  reveal: null,
  pending: null,
  finished: false,
  startedAt: 0,
  rankingsHistory: [],
  turnLog: []
}

/** Fresh scores, timelines and challenges for a new round with the same line-up. */
function freshPlayers(players: Player[], challenges: boolean): Player[] {
  return players.map((p) => ({
    ...p,
    timeline: [],
    cards: 0,
    score: 0,
    challenges: challenges ? STARTING_CHALLENGES : 0,
    memberTurn: p.members ? 0 : undefined
  }))
}

/** Round options survive a reset — the setup remembers the last choice. */
function keepOptions(state: GameState) {
  return {
    gameMode: state.gameMode,
    randomStartPosition: state.randomStartPosition,
    goal: state.goal,
    decades: state.decades,
    challengesEnabled: state.challengesEnabled,
    exotics: state.exotics
  }
}

const challengesInMode = (state: GameState) => state.challengesEnabled && state.gameMode !== 'hardcore'

// ============================================================================
// Reducer
// ============================================================================

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_GAME_MODE':
      return { ...state, gameMode: action.payload }

    case 'SET_RANDOM_START_POSITION':
      return { ...state, randomStartPosition: action.payload }

    case 'ADD_PLAYER': {
      const newPlayer: Player = {
        name: action.payload,
        timeline: [],
        cards: 0,
        score: 0,
        ...action.playerData // Merge optional bot data (isBot, botDifficulty)
      }
      return { ...state, players: [...state.players, newPlayer] }
    }

    case 'REMOVE_PLAYER': {
      const newPlayers = state.players.filter((_, index) => index !== action.payload)
      // Adjust current indices if needed
      const newCurrentPlayer = state.currentPlayer >= newPlayers.length ? Math.max(0, newPlayers.length - 1) : state.currentPlayer
      return { ...state, players: newPlayers, currentPlayer: newCurrentPlayer }
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

    case 'SET_CURRENT_SONG':
      return { ...state, currentSong: action.payload }

    case 'SET_WAITING_FOR_GUESS':
      return { ...state, waitingForGuess: action.payload }

    case 'ADD_TO_GLOBAL_TIMELINE': {
      const newCard: GlobalTimelineCard = {
        song: action.payload.song,
        playerId: action.payload.playerId
      }
      const newTimeline = [...state.globalTimeline, newCard]
      newTimeline.sort((a, b) => a.song.year - b.song.year)
      return { ...state, globalTimeline: newTimeline }
    }

    case 'ADD_TO_PLAYED_SONGS':
      if (state.playedSongs.includes(action.payload)) {
        return state
      }
      return { ...state, playedSongs: [...state.playedSongs, action.payload] }

    case 'INCREMENT_SKIP_COUNT': {
      const playerIndex = action.payload
      const currentCount = state.currentSongSkips[playerIndex] || 0
      return {
        ...state,
        currentSongSkips: {
          ...state.currentSongSkips,
          [playerIndex]: currentCount + 1
        }
      }
    }

    case 'RESET_SKIP_COUNTS':
      return { ...state, currentSongSkips: {} }

    case 'START_GAME':
      return {
        ...state,
        players: freshPlayers(state.players, challengesInMode(state)),
        isGameStarted: true,
        finished: false,
        reveal: null,
        pending: null,
        tiebreak: null,
        currentPlayer: 0,
        currentSong: null,
        globalTimeline: [],
        playedSongs: [],
        currentSongSkips: {},
        rankingsHistory: [],
        turnLog: [],
        startedAt: Date.now()
      }

    case 'END_GAME':
      return { ...state, isGameStarted: false }

    case 'RESET_GAME':
      return { ...initialState, ...keepOptions(state) }

    case 'REMATCH':
      return {
        ...initialState,
        ...keepOptions(state),
        players: freshPlayers(state.players, challengesInMode(state)),
        isGameStarted: true,
        startedAt: Date.now()
      }

    case 'SET_OPTIONS':
      return { ...state, ...action.payload }

    case 'SET_PLAYERS':
      return { ...state, players: action.payload, currentPlayer: 0 }

    case 'SET_REVEAL':
      return { ...state, reveal: action.payload }

    case 'SET_PENDING':
      return { ...state, pending: action.payload }

    case 'FINISH':
      return { ...state, finished: true, reveal: null, pending: null }

    case 'PUSH_RANKING':
      return { ...state, rankingsHistory: [...state.rankingsHistory, action.payload] }

    case 'LOG_TURN':
      return { ...state, turnLog: [...(state.turnLog ?? []), action.payload] }

    case 'LOAD_GAME_STATE':
      return { ...state, ...action.payload }

    case 'SET_TIEBREAK':
      return { ...state, tiebreak: action.payload }

    case 'NEXT_TURN': {
      const playerCount = state.players.length
      if (playerCount === 0) return state
      return {
        ...state,
        players: advanceMember(state.players, state.currentPlayer),
        currentPlayer: nextSeat(state),
        currentSong: null,
        waitingForGuess: false,
        currentSongSkips: {} // a new song starts with a clean skip count
      }
    }

    case 'NEXT_PLAYER_ONLY': {
      // Switch player, keep the song and its skip counts (penalty tracking)
      const playerCount = state.players.length
      if (playerCount === 0) return state
      return {
        ...state,
        players: advanceMember(state.players, state.currentPlayer),
        currentPlayer: nextSeat(state),
        waitingForGuess: false
      }
    }

    default:
      return state
  }
}

/** A team's next turn goes to its next member. */
function advanceMember(players: Player[], seat: number): Player[] {
  const team = players[seat]
  if (!team?.members?.length) return players
  return players.map((p, i) => (i === seat ? { ...p, memberTurn: (p.memberTurn ?? 0) + 1 } : p))
}

/** Next seat in turn order; during a tiebreak only contenders play. */
function nextSeat(state: GameState): number {
  if (state.tiebreak && state.tiebreak.contenders.length > 0) return nextContender(state.tiebreak, state.currentPlayer)
  return (state.currentPlayer + 1) % state.players.length
}

// ============================================================================
// Provider
// ============================================================================

interface GameProviderProps {
  children: ReactNode
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => {
    const saved = loadSavedGame<GameState>()
    return saved ? { ...initialState, ...saved } : initialState
  })

  // A running round is mirrored to this device, so a reload (or a closed tab)
  // picks it up exactly where it stood. A finished or ended round is dropped.
  useEffect(() => {
    if (state.isGameStarted && !state.finished) saveGame(state)
    else clearSavedGame()
  }, [state])

  const value: GameContextValue = {
    ...state,
    setGameMode: (mode) => dispatch({ type: 'SET_GAME_MODE', payload: mode }),
    setRandomStartPosition: (enabled) => dispatch({ type: 'SET_RANDOM_START_POSITION', payload: enabled }),
    addPlayer: (name, playerData) => dispatch({ type: 'ADD_PLAYER', payload: name, playerData }),
    removePlayer: (index) => dispatch({ type: 'REMOVE_PLAYER', payload: index }),
    updatePlayer: (index, player) => dispatch({ type: 'UPDATE_PLAYER', payload: { index, player } }),
    setCurrentPlayer: (index) => dispatch({ type: 'SET_CURRENT_PLAYER', payload: index }),
    setCurrentSong: (song) => dispatch({ type: 'SET_CURRENT_SONG', payload: song }),
    setWaitingForGuess: (waiting) => dispatch({ type: 'SET_WAITING_FOR_GUESS', payload: waiting }),
    addToGlobalTimeline: (song, playerId) => dispatch({ type: 'ADD_TO_GLOBAL_TIMELINE', payload: { song, playerId } }),
    addToPlayedSongs: (songId) => dispatch({ type: 'ADD_TO_PLAYED_SONGS', payload: songId }),
    incrementSkipCount: (playerIndex) => dispatch({ type: 'INCREMENT_SKIP_COUNT', payload: playerIndex }),
    resetSkipCounts: () => dispatch({ type: 'RESET_SKIP_COUNTS' }),
    startGame: () => dispatch({ type: 'START_GAME' }),
    endGame: () => dispatch({ type: 'END_GAME' }),
    resetGame: () => dispatch({ type: 'RESET_GAME' }),
    rematch: () => dispatch({ type: 'REMATCH' }),
    loadGameState: (gameState) => dispatch({ type: 'LOAD_GAME_STATE', payload: gameState }),
    nextTurn: () => dispatch({ type: 'NEXT_TURN' }),
    nextPlayerOnly: () => dispatch({ type: 'NEXT_PLAYER_ONLY' }),
    setTiebreak: (tiebreak) => dispatch({ type: 'SET_TIEBREAK', payload: tiebreak }),
    setOptions: (options) => dispatch({ type: 'SET_OPTIONS', payload: options }),
    setPlayers: (players) => dispatch({ type: 'SET_PLAYERS', payload: players }),
    setReveal: (reveal) => dispatch({ type: 'SET_REVEAL', payload: reveal }),
    setPending: (pending) => dispatch({ type: 'SET_PENDING', payload: pending }),
    finish: () => dispatch({ type: 'FINISH' }),
    pushRanking: (snapshot) => dispatch({ type: 'PUSH_RANKING', payload: snapshot }),
    logTurn: (turn) => dispatch({ type: 'LOG_TURN', payload: turn })
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
