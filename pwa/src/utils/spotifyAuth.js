import config from '../../spotify.config.js'

class SpotifyAuth {
  constructor() {
    this.accessToken = null
    this.refreshToken = null
    this.expiresAt = null
  }

  // Generiere Code Verifier für PKCE (empfohlen ab 2025)
  generateCodeVerifier() {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  // Generiere Code Challenge für PKCE
  async generateCodeChallenge(verifier) {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  // Get redirect URI based on environment
  getRedirectUri() {
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5174/callback'
    }
    return 'https://mxster.de/callback'
  }

  // Starte OAuth Flow (Authorization Code mit PKCE)
  async login() {
    const codeVerifier = this.generateCodeVerifier()
    const codeChallenge = await this.generateCodeChallenge(codeVerifier)

    // Speichere Code Verifier für späteren Token-Exchange
    sessionStorage.setItem('spotify_code_verifier', codeVerifier)

    // Erstelle Authorization URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: this.getRedirectUri(),
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      scope: config.scopes.join(' ')
    })

    // Redirect zu Spotify Login
    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`
  }

  // Handle Callback nach Login
  async handleCallback() {
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

    // Hole Code Verifier
    const codeVerifier = sessionStorage.getItem('spotify_code_verifier')
    if (!codeVerifier) {
      console.error('Code Verifier nicht gefunden')
      return null
    }

    // Tausche Code gegen Access Token
    const tokenData = await this.exchangeCodeForToken(code, codeVerifier)

    if (tokenData) {
      this.setTokens(tokenData)
      sessionStorage.removeItem('spotify_code_verifier')

      // Speichere Tokens in localStorage für Session-Persistenz
      this.saveToStorage()

      return this.accessToken
    }

    return null
  }

  // Tausche Authorization Code gegen Access Token
  async exchangeCodeForToken(code, codeVerifier) {
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

  // Setze Tokens
  setTokens(data) {
    this.accessToken = data.access_token
    this.refreshToken = data.refresh_token
    this.expiresAt = Date.now() + (data.expires_in * 1000)
  }

  // Speichere Tokens in localStorage
  saveToStorage() {
    localStorage.setItem('spotify_access_token', this.accessToken)
    localStorage.setItem('spotify_refresh_token', this.refreshToken || '')
    localStorage.setItem('spotify_expires_at', this.expiresAt.toString())
  }

  // Lade Tokens aus localStorage
  loadFromStorage() {
    this.accessToken = localStorage.getItem('spotify_access_token')
    this.refreshToken = localStorage.getItem('spotify_refresh_token')
    const expiresAt = localStorage.getItem('spotify_expires_at')
    this.expiresAt = expiresAt ? parseInt(expiresAt) : null

    return this.isLoggedIn()
  }

  // Prüfe ob eingeloggt und Token gültig
  isLoggedIn() {
    if (!this.accessToken || !this.expiresAt) {
      return false
    }

    // Token abgelaufen?
    if (Date.now() >= this.expiresAt) {
      return false
    }

    return true
  }

  // Logout
  logout() {
    this.accessToken = null
    this.refreshToken = null
    this.expiresAt = null
    localStorage.removeItem('spotify_access_token')
    localStorage.removeItem('spotify_refresh_token')
    localStorage.removeItem('spotify_expires_at')
  }

  // Hole Access Token
  getAccessToken() {
    return this.accessToken
  }
}

export default new SpotifyAuth()
