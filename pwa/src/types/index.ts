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
}

export interface Player {
  name: string
  timeline: Song[]
  cards: number  // Count of correctly placed cards
  score: number  // Points (Guess Mode only)
}

// ============================================================================
// Game Modes & Variants
// ============================================================================

export enum GameMode {
  GUESS = 'guess',
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
  globalTimeline: Song[]  // For TIMELINE_GLOBAL mode
  playedSongs: string[]   // Song IDs to prevent duplicates
  timestamp: number
  randomStartPosition: boolean
}

export interface SavedGameState extends GameState {
  version: string
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
}

export interface ModalButton {
  text: string
  onclick: string | (() => void)
  className?: string
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
// Utility Types
// ============================================================================

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
