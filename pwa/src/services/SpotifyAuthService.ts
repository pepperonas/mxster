/**
 * Spotify OAuth Authentication Service
 * Handles OAuth PKCE flow, token management, and refresh
 */

import type { SpotifyTokens } from '@/types/spotify'
import { SPOTIFY_CONFIG } from '@/utils/constants'

// Spotify configuration
// In development: loads from spotify.config.js
// In production: uses environment variables
class SpotifyConfig {
  private static _clientId: string | null = null
  private static _scopes: string[] = SPOTIFY_CONFIG.SCOPES
  private static _initialized = false
  private static _initPromise: Promise<void> | null = null

  static async initialize() {
    if (this._initialized) return
    if (this._initPromise) return this._initPromise

    this._initPromise = (async () => {
      try {
        // Try to load config from spotify.config.js (for development)
        // @ts-ignore - Dynamic import for optional config
        const config = await import('../../spotify.config.js')
        if (config.default) {
          this._clientId = config.default.clientId
          this._scopes = config.default.scopes || SPOTIFY_CONFIG.SCOPES
          console.log('✅ Loaded Spotify config from spotify.config.js')
        }
      } catch (error) {
        // Fallback to environment variables (production)
        this._clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || null
        if (this._clientId) {
          console.log('✅ Loaded Spotify config from environment variables')
        } else {
          console.warn('⚠️ No Spotify config found')
        }
      }

      this._initialized = true
    })()

    return this._initPromise
  }

  static get clientId(): string {
    if (!this._initialized) {
      throw new Error('Spotify Client ID not configured. Call SpotifyConfig.initialize() first and wait for it to complete.')
    }
    if (!this._clientId) {
      throw new Error('Spotify Client ID not available. Check configuration.')
    }
    return this._clientId
  }

  static get scopes(): string[] {
    return this._scopes
  }

  static get isInitialized(): boolean {
    return this._initialized
  }
}

// Start initialization immediately (but don't wait for it here)
SpotifyConfig.initialize()

export class SpotifyAuthService {
  /**
   * Generate PKCE Code Verifier
   */
  static generateCodeVerifier(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  /**
   * Generate PKCE Code Challenge from verifier
   */
  static async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  /**
   * Get redirect URI based on environment
   */
  static getRedirectUri(): string {
    const hostname = window.location.hostname
    const port = window.location.port

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Always use 127.0.0.1 for Spotify OAuth compatibility
      return `http://127.0.0.1:${port || '5173'}/callback`
    }
    return 'https://mxster.de/callback'
  }

  /**
   * Start OAuth login flow
   * Redirects user to Spotify authorization page
   */
  static async login(): Promise<void> {
    // Ensure config is initialized before proceeding
    await SpotifyConfig.initialize()

    const codeVerifier = this.generateCodeVerifier()
    const codeChallenge = await this.generateCodeChallenge(codeVerifier)

    // Store code verifier for token exchange
    sessionStorage.setItem('spotify_code_verifier', codeVerifier)

    // Build authorization URL
    const redirectUri = this.getRedirectUri()
    const params = new URLSearchParams({
      client_id: SpotifyConfig.clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      scope: SpotifyConfig.scopes.join(' ')
    })

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`

    // DEBUG: Log exact redirect URI and auth URL
    console.log('=== SPOTIFY AUTH DEBUG ===')
    console.log('Redirect URI:', redirectUri)
    console.log('Client ID:', SpotifyConfig.clientId)
    console.log('Full Auth URL:', authUrl)
    console.log('=========================')

    // Redirect to Spotify login
    window.location.href = authUrl
  }

  /**
   * Handle OAuth callback
   * Exchanges authorization code for access token
   */
  static async handleCallback(): Promise<SpotifyTokens | null> {
    // Ensure config is initialized before proceeding
    await SpotifyConfig.initialize()

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    if (error) {
      console.error('❌ Spotify Auth Error:', error)
      return null
    }

    if (!code) {
      console.error('❌ No authorization code in callback')
      return null
    }

    // Retrieve code verifier
    const codeVerifier = sessionStorage.getItem('spotify_code_verifier')
    if (!codeVerifier) {
      console.error('❌ Code Verifier not found')
      return null
    }

    // Exchange code for tokens
    const tokenData = await this.exchangeCodeForToken(code, codeVerifier)

    if (tokenData) {
      // Clear code verifier
      sessionStorage.removeItem('spotify_code_verifier')
      return tokenData
    }

    return null
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(
    code: string,
    codeVerifier: string
  ): Promise<SpotifyTokens | null> {
    const params = new URLSearchParams({
      client_id: SpotifyConfig.clientId,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.getRedirectUri(),
      code_verifier: codeVerifier
    })

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ Token Exchange Error:', error)
        return null
      }

      const data = await response.json()

      const tokens: SpotifyTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + data.expires_in * 1000,
        tokenType: data.token_type,
        scope: data.scope
      }

      console.log('✅ Tokens received:', {
        hasAccessToken: !!tokens.accessToken,
        hasRefreshToken: !!tokens.refreshToken,
        expiresAt: new Date(tokens.expiresAt).toLocaleString('de-DE')
      })

      return tokens
    } catch (error) {
      console.error('❌ Token Exchange Failed:', error)
      return null
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<SpotifyTokens | null> {
    const params = new URLSearchParams({
      client_id: SpotifyConfig.clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ Token Refresh Error:', error)
        return null
      }

      const data = await response.json()

      const tokens: SpotifyTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken, // Keep old refresh token if not provided
        expiresAt: Date.now() + data.expires_in * 1000,
        tokenType: data.token_type,
        scope: data.scope
      }

      console.log('✅ Token refreshed')
      return tokens
    } catch (error) {
      console.error('❌ Token Refresh Failed:', error)
      return null
    }
  }

  /**
   * Check if token needs refresh (within 5 minutes of expiry)
   */
  static needsRefresh(expiresAt: number): boolean {
    return Date.now() >= expiresAt - SPOTIFY_CONFIG.TOKEN_REFRESH_THRESHOLD_MS
  }

  /**
   * Check if token is expired
   */
  static isExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt
  }
}
