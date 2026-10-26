// ============================================================================
// Core Game Types
// ============================================================================

export interface Song {
  id: string
  title: string
  artist: string
  year: number
  album?: string
  spotifyId?: string
  previewUrl?: string
  youtubeUrl?: string
  points?: number  // Points earned for this song (Guess Mode only)
  genre?: string   // Genre for GENRE_HOPPER achievement (added v0.0.24)
  guessDetails?: {  // Detailed guess results for achievements (added v0.0.25)
    titleCorrect: boolean
    artistCorrect: boolean
    yearPoints: 0 | 1 | 2 | 5  // 5=exact, 2=±1 year, 1=±2 years, 0=wrong
  }
}

export interface Player {
  name: string
  timeline: Song[]  // Songs with optional points property
  cards: number  // Count of correctly placed cards
  score: number  // Points (Guess Mode only)
  isBot?: boolean  // Bot player flag (v0.0.32)
  botDifficulty?: 'easy' | 'medium' | 'hard'  // Bot difficulty level (v0.0.32)
}

// ============================================================================
// Game Modes
// ============================================================================

export enum GameMode {
  HARDCORE = 'hardcore',
  TIMELINE_PERSONAL = 'timeline_personal',
  TIMELINE_GLOBAL = 'timeline_global'
}

export interface GameModeInfo {
  name: string
  description: string
  icon: string
  rules: string[]
  scoring: string
  features: string[]
}

// ============================================================================
// Game State
// ============================================================================

export interface GameState {
  players: Player[]
  currentPlayer: number
  currentSong: Song | null
  gameMode: GameMode | null
  globalTimeline: GlobalTimelineCard[]  // For TIMELINE_GLOBAL mode
  playedSongs: string[]   // Song IDs to prevent duplicates
  timestamp: number
  randomStartPosition: boolean
  isGameStarted: boolean
  waitingForGuess: boolean
}

export interface GlobalTimelineCard {
  song: Song
  playerId: number  // Index of player who placed this card
}

export interface SavedGameState extends GameState {
  version: string
  savedAt?: number
}

// ============================================================================
// Game History
// ============================================================================

export interface HistoryEntry {
  id: number  // Timestamp
  timestamp: number
  date: string  // ISO string
  winner: {
    name: string
    cards: number
    score: number
  }
  players: Array<{
    name: string
    cards: number
    score: number
    timeline: Array<{
      id: string
      title: string
      artist: string
      year: number
      genre?: string  // Genre for statistics (added v0.0.31)
    }>
  }>
  gameMode: GameMode
  /** Legacy field from the physical-card era; ignored. */
  gameVariant?: string
  duration?: number
  totalRounds?: number
}

export interface GameHistoryData {
  version: string
  games: HistoryEntry[]
}

// ============================================================================
// UI State
// ============================================================================

export interface ModalOptions {
  required?: boolean  // Can't close by clicking outside
  wide?: boolean      // Wider modal
  noPadding?: boolean // No padding in modal body
  disableEscapeKey?: boolean // Disable ESC key to close
  disableBackdropClick?: boolean // Disable backdrop click to close
  hideCloseButton?: boolean // Hide the X close button
}

export interface ModalButton {
  text: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  closeOnClick?: boolean
  className?: string
}

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration: number
  action?: { label: string; onClick: () => void }
}

export interface ToastOptions {
  duration?: number
  type?: 'success' | 'error' | 'warning' | 'info'
}

// ============================================================================
// Text Matching
// ============================================================================

export interface GuessResult {
  titleMatch: boolean
  artistMatch: boolean
  bothMatch: boolean
  yearCorrect?: boolean
  correctCount: number
}

// ============================================================================
// Achievements
// ============================================================================

export * from './achievements'

// ============================================================================
// Utility Types
// ============================================================================

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
