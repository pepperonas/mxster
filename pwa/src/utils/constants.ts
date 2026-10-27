/**
 * Application Constants
 */
import { msg } from '@/i18n'
import { modesText } from '@/i18n/messages/modes'

// Version
export const APP_VERSION = '0.0.22'

// LocalStorage Keys
export const STORAGE_KEYS = {
  GAME_STATE: 'mxster_game_state',
  GAME_HISTORY: 'mxster_game_history',  // Keep compatibility with old GameHistory class
  SPOTIFY_TOKENS: 'spotify_auth_tokens',
  BEAT_SYNC_CONFIG: 'beat_sync_config',
  SETTINGS: 'app_settings'
} as const

// Game Configuration
export const GAME_CONFIG = {
  WIN_CONDITION_CARDS: 10,
  SCAN_DEBOUNCE_MS: 3000,
  MAX_HISTORY_GAMES: 50,
  MIN_REMAINING_PLAYBACK_MS: 60000  // 60 seconds for random start position
} as const

// Spotify Configuration
export const SPOTIFY_CONFIG = {
  SCOPES: [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state'
  ] as string[],  // Cast to mutable array
  TOKEN_REFRESH_THRESHOLD_MS: 5 * 60 * 1000,  // 5 minutes
  TOKEN_REFRESH_CHECK_INTERVAL_MS: 10 * 60 * 1000  // 10 minutes
} as const

// Audio Configuration
export const AUDIO_CONFIG = {
  DEFAULT_VOLUME: 0.8,
  PREVIEW_DURATION_MS: 30000  // 30 seconds
} as const

// Beat Sync Configuration
export const BEAT_SYNC_CONFIG = {
  MAX_SCHEDULED_BEATS: 50,
  RESCHEDULE_AT_BEAT: 25,
  MIN_BEAT_INTERVAL_MS: 100,
  INTENSITY_DECAY_RATE: 0.85,
  PARTICLE_COUNT: 10000
} as const

// UI Configuration
export const UI_CONFIG = {
  TOAST_DEFAULT_DURATION_MS: 3000,
  LONG_PRESS_DURATION_MS: 2000,
  MODAL_ANIMATION_DURATION_MS: 300
} as const

// QR Scanner Configuration
export const QR_CONFIG = {
  MAX_SCANS_PER_SECOND: 10,
  IDEAL_VIDEO_WIDTH: 1920,
  IDEAL_VIDEO_HEIGHT: 1080,
  PREFERRED_CAMERA: 'environment'  // Back camera
} as const

// Text Matching Configuration
export const TEXT_MATCHING_CONFIG = {
  MAX_LEVENSHTEIN_DISTANCE: 3,
  YEAR_TOLERANCE: 0  // Exact year match required
} as const

// Three.js Configuration
export const THREE_CONFIG = {
  CAMERA_POSITION: { x: 0, y: 80, z: 140 },
  MAX_PIXEL_RATIO: 2,
  GRID_SIZE: 100,
  PARTICLE_SIZE: 0.8
} as const

// Error Messages (getters: current language on every read)
export const ERROR_MESSAGES = {
  get SPOTIFY_PREMIUM_REQUIRED() {
    return msg(modesText).errPremium
  },
  get CAMERA_PERMISSION_DENIED() {
    return msg(modesText).errCamera
  },
  get NO_AUDIO_AVAILABLE() {
    return msg(modesText).errNoAudio
  },
  get NETWORK_ERROR() {
    return msg(modesText).errNetwork
  },
  get SONG_ALREADY_PLAYED() {
    return msg(modesText).errAlreadyPlayed
  },
  get INVALID_QR_CODE() {
    return msg(modesText).errQr
  }
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  get GAME_SAVED() {
    return msg(modesText).okSaved
  },
  get GAME_LOADED() {
    return msg(modesText).okLoaded
  },
  get SONG_ADDED() {
    return msg(modesText).okSongAdded
  },
  get PLAYER_ADDED() {
    return msg(modesText).okPlayerAdded
  }
} as const
