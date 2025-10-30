import config from '../../spotify.config.js'

/**
 * Token response from Spotify API
 */
interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
}

class SpotifyAuth {
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private expiresAt: number | null = null
  private refreshCheckInterval: NodeJS.Timeout | null = null

  /**
   * Start periodic token check (every 10 minutes)
   */
  startRefreshCheck(): void {
    // Stop existing interval
    if (this.refreshCheckInterval) {
      clearInterval(this.refreshCheckInterval)
    }

    // Check every 10 minutes
    this.refreshCheckInterval = setInterval(async () => {
      console.log('⏰ Periodischer Token-Check...')
      const isValid = await this.isLoggedIn()
      if (!isValid) {
        console.log('❌ Token ungültig, Session beendet')
        if (this.refreshCheckInterval) {
          clearInterval(this.refreshCheckInterval)
        }
        // Optional: Show message to user
        if (window.game) {
          alert('Deine Spotify-Session ist abgelaufen. Bitte melde dich neu an.')
          window.game.renderLoginScreen()
        }
      }
    }, 10 * 60 * 1000) // 10 minutes
  }

  /**
   * Stop periodic token check
   */
  stopRefreshCheck(): void {
    if (this.refreshCheckInterval) {
      clearInterval(this.refreshCheckInterval)
      this.refreshCheckInterval = null
    }
  }

  /**
   * Generate Code Verifier for PKCE (recommended since 2025)
   */
  generateCodeVerifier(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  /**
   * Generate Code Challenge for PKCE
   */
  async generateCodeChallenge(verifier: string): Promise<string> {
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
  getRedirectUri(): string {
    const hostname = window.location.hostname
    const port = window.location.port

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Use 127.0.0.1 for Spotify OAuth compatibility
      return `http://127.0.0.1:${port || '5173'}/callback`
    }
    return 'https://mxster.de/callback'
  }

  /**
   * Start OAuth Flow (Authorization Code with PKCE)
   */
  async login(): Promise<void> {
    const codeVerifier = this.generateCodeVerifier()
    const codeChallenge = await this.generateCodeChallenge(codeVerifier)

    // Store Code Verifier for later token exchange
    sessionStorage.setItem('spotify_code_verifier', codeVerifier)

    // Create Authorization URL
    const redirectUri = this.getRedirectUri()
    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      scope: config.scopes.join(' ')
    })

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`

    // DEBUG: Log the exact redirect URI and URL
    console.log('=== SPOTIFY AUTH DEBUG ===')
    console.log('Redirect URI:', redirectUri)
    console.log('Client ID:', config.clientId)
    console.log('Full Auth URL:', authUrl)
    console.log('=========================')

    // Redirect to Spotify Login
    window.location.href = authUrl
  }

  /**
   * Handle Callback after login
   */
  async handleCallback(): Promise<string | null> {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    if (error) {
      console.error('Spotify Auth Error:', error)
      return null
    }

    if (!code) {
      return null
    }

    // Get Code Verifier
    const codeVerifier = sessionStorage.getItem('spotify_code_verifier')
    if (!codeVerifier) {
      console.error('Code Verifier nicht gefunden')
      return null
    }

    // Exchange Code for Access Token
    const tokenData = await this.exchangeCodeForToken(code, codeVerifier)

    if (tokenData) {
      this.setTokens(tokenData)
      sessionStorage.removeItem('spotify_code_verifier')

      // Save tokens to localStorage for session persistence
      this.saveToStorage()

      return this.accessToken
    }

    return null
  }

  /**
   * Exchange Authorization Code for Access Token
   */
  async exchangeCodeForToken(code: string, codeVerifier: string): Promise<TokenResponse | null> {
    const params = new URLSearchParams({
      client_id: config.clientId,
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
        console.error('Token Exchange Error:', error)
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('Token Exchange Failed:', error)
      return null
    }
  }

  /**
   * Set tokens
   */
  setTokens(data: TokenResponse): void {
    this.accessToken = data.access_token
    this.refreshToken = data.refresh_token || null
    this.expiresAt = Date.now() + (data.expires_in * 1000)
  }

  /**
   * Save tokens to localStorage
   */
  saveToStorage(): void {
    if (!this.accessToken || !this.expiresAt) return

    localStorage.setItem('spotify_access_token', this.accessToken)
    localStorage.setItem('spotify_refresh_token', this.refreshToken || '')
    localStorage.setItem('spotify_expires_at', this.expiresAt.toString())

    console.log('💾 Tokens in Storage gespeichert:', {
      hasAccessToken: !!this.accessToken,
      hasRefreshToken: !!this.refreshToken,
      expiresAt: new Date(this.expiresAt).toLocaleString('de-DE')
    })
  }

  /**
   * Load tokens from localStorage
   */
  async loadFromStorage(): Promise<boolean> {
    this.accessToken = localStorage.getItem('spotify_access_token')
    this.refreshToken = localStorage.getItem('spotify_refresh_token')
    const expiresAt = localStorage.getItem('spotify_expires_at')
    this.expiresAt = expiresAt ? parseInt(expiresAt) : null

    console.log('📦 Tokens aus Storage geladen:', {
      hasAccessToken: !!this.accessToken,
      hasRefreshToken: !!this.refreshToken,
      expiresAt: this.expiresAt ? new Date(this.expiresAt).toLocaleString('de-DE') : 'null'
    })

    return await this.isLoggedIn()
  }

  /**
   * Check if logged in and token is valid
   */
  async isLoggedIn(): Promise<boolean> {
    if (!this.accessToken || !this.expiresAt) {
      return false
    }

    // Token expiring soon? (5 minutes buffer)
    const fiveMinutes = 5 * 60 * 1000
    if (Date.now() >= (this.expiresAt - fiveMinutes)) {
      // Try to refresh token
      if (this.refreshToken) {
        console.log('🔄 Token läuft ab, refreshe...')
        const refreshed = await this.refreshAccessToken()
        if (refreshed) {
          console.log('✅ Token erfolgreich refreshed')
          return true
        }
      }
      console.log('❌ Token abgelaufen und kein Refresh möglich')
      return false
    }

    return true
  }

  /**
   * Refresh Access Token with Refresh Token
   */
  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken
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
        console.error('Token Refresh Error:', error)
        return false
      }

      const data: TokenResponse = await response.json()

      // Update tokens
      this.accessToken = data.access_token
      this.expiresAt = Date.now() + (data.expires_in * 1000)

      // Refresh token stays the same (not always reissued)
      if (data.refresh_token) {
        this.refreshToken = data.refresh_token
      }

      // Save new tokens
      this.saveToStorage()

      return true
    } catch (error) {
      console.error('Token Refresh Failed:', error)
      return false
    }
  }

  /**
   * Logout
   */
  logout(): void {
    this.stopRefreshCheck()
    this.accessToken = null
    this.refreshToken = null
    this.expiresAt = null
    localStorage.removeItem('spotify_access_token')
    localStorage.removeItem('spotify_refresh_token')
    localStorage.removeItem('spotify_expires_at')
  }

  /**
   * Get Access Token
   */
  getAccessToken(): string | null {
    return this.accessToken
  }
}

// Extend Window interface for game reference
declare global {
  interface Window {
    game?: {
      renderLoginScreen: () => void
      beatSyncEnabled?: boolean
    }
    beatAnimator?: {
      loadTrackAnalysis: (trackId: string, token: string) => Promise<void>
      start: (position: number) => void
      pause: () => void
      updatePosition: (position: number) => void
    }
  }
}

export default new SpotifyAuth()
