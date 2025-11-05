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
}

// ============================================================================
// Game Modes & Variants
// ============================================================================

export enum GameMode {
  HARDCORE = 'hardcore',
  TIMELINE_PERSONAL = 'timeline_personal',
  TIMELINE_GLOBAL = 'timeline_global'
}

export enum GameVariant {
  PHYSICAL = 'physical',  // QR scanner + DJ role
  VIRTUAL = 'virtual'     // Random song button
}

export interface GameModeInfo {
  name: string
  description: string
  icon: string
  rules: string[]
  scoring: string
  features: string[]
}

export interface GameVariantInfo {
  name: string
  description: string
  icon: string
  requirements: string[]
  features: string[]
}

// ============================================================================
// Game State
// ============================================================================

export interface GameState {
  players: Player[]
  currentPlayer: number
  currentDJ: number
  currentSong: Song | null
  gameMode: GameMode | null
  gameVariant: GameVariant | null
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
    }>
  }>
  gameMode: GameMode
  gameVariant: GameVariant
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
}

export interface ToastOptions {
  duration?: number
  type?: 'success' | 'error' | 'warning' | 'info'
}

// ============================================================================
// Beat Sync & Animations
// ============================================================================

export enum BackgroundAnimation {
  WAVE_3D = 'wave_3d',
  PULSE = 'pulse',
  FLASH = 'flash',
  GRADIENT = 'gradient',
  GLOW = 'glow',
  NONE = 'none'
}

export interface BeatSyncConfig {
  enabled: boolean
  animationType: BackgroundAnimation
  intensity: number  // 0-100
}

export interface BeatData {
  start: number
  duration: number
  confidence: number
}

export interface SpotifyAudioAnalysis {
  track: {
    tempo: number
    duration: number
  }
  beats: BeatData[]
  bars: Array<{
    start: number
    duration: number
    confidence: number
  }>
  sections: Array<{
    start: number
    duration: number
    tempo: number
    key: number
    mode: number
  }>
}

// ============================================================================
// QR Scanner
// ============================================================================

export interface QRScanResult {
  data: string
  timestamp: number
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
