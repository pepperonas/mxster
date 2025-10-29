// ============================================================================
// Spotify Authentication Types
// ============================================================================

export interface SpotifyTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number  // Unix timestamp
  tokenType: string
  scope: string
}

export interface SpotifyAuthConfig {
  clientId: string
  clientSecret?: string
  redirectUri: string
  scopes: string[]
}

export interface PKCETokens {
  codeVerifier: string
  codeChallenge: string
}

// ============================================================================
// Spotify Player Types
// ============================================================================

export interface SpotifyPlayerState {
  paused: boolean
  position: number
  duration: number
  track_window: {
    current_track: SpotifyTrack
  }
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ name: string }>
  album: {
    name: string
    images: Array<{ url: string }>
  }
  duration_ms: number
  uri: string
}

export interface SpotifyDevice {
  id: string
  name: string
  type: string
  is_active: boolean
  is_private_session: boolean
  is_restricted: boolean
  volume_percent: number
}

// ============================================================================
// Spotify Web Playback SDK Types
// ============================================================================

export interface SpotifyPlayer {
  connect(): Promise<boolean>
  disconnect(): void
  addListener(event: string, callback: (data: any) => void): void
  removeListener(event: string): void
  getCurrentState(): Promise<SpotifyPlayerState | null>
  setVolume(volume: number): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  togglePlay(): Promise<void>
  seek(position_ms: number): Promise<void>
  previousTrack(): Promise<void>
  nextTrack(): Promise<void>
  _options: {
    name: string
    getOAuthToken: (cb: (token: string) => void) => void
    volume: number
  }
}

export interface WebPlaybackSDK {
  Player: new (options: {
    name: string
    getOAuthToken: (cb: (token: string) => void) => void
    volume?: number
  }) => SpotifyPlayer
}

declare global {
  interface Window {
    Spotify?: WebPlaybackSDK
    onSpotifyWebPlaybackSDKReady?: () => void
  }
}

// ============================================================================
// Spotify API Response Types
// ============================================================================

export interface SpotifyTrackResponse {
  id: string
  name: string
  artists: Array<{
    id: string
    name: string
  }>
  album: {
    id: string
    name: string
    release_date: string
    images: Array<{
      url: string
      height: number
      width: number
    }>
  }
  duration_ms: number
  preview_url: string | null
  uri: string
  external_urls: {
    spotify: string
  }
}

export interface SpotifyAudioFeatures {
  id: string
  tempo: number
  time_signature: number
  key: number
  mode: number
  energy: number
  danceability: number
  valence: number
  acousticness: number
  instrumentalness: number
  liveness: number
  speechiness: number
  duration_ms: number
}

export interface SpotifyPlaylistResponse {
  id: string
  name: string
  description: string
  tracks: {
    total: number
    items: Array<{
      track: SpotifyTrackResponse
    }>
  }
}

// ============================================================================
// Spotify Error Types
// ============================================================================

export interface SpotifyAPIError {
  error: {
    status: number
    message: string
  }
}

export class SpotifyAuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'SpotifyAuthError'
  }
}

export class SpotifyPlayerError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'SpotifyPlayerError'
  }
}
