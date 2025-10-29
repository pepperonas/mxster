import { useCallback, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts'
import { SpotifyAuthService } from '@/services/SpotifyAuthService'
import { SPOTIFY_CONFIG } from '@/utils/constants'

/**
 * Hook for Spotify OAuth authentication
 * Provides login, logout, token refresh, and automatic token management
 */
export function useSpotifyAuth() {
  const auth = useAuth()
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Start OAuth login flow
   */
  const login = useCallback(async () => {
    try {
      await SpotifyAuthService.login()
      // Note: This will redirect, so code after this won't execute
    } catch (error) {
      console.error('❌ Login failed:', error)
      throw error
    }
  }, [])

  /**
   * Handle OAuth callback
   */
  const handleCallback = useCallback(async () => {
    try {
      const tokens = await SpotifyAuthService.handleCallback()
      if (tokens) {
        auth.setTokens(tokens)
        return tokens.accessToken
      }
      return null
    } catch (error) {
      console.error('❌ Callback handling failed:', error)
      return null
    }
  }, [auth])

  /**
   * Refresh access token
   */
  const refreshToken = useCallback(async () => {
    if (!auth.refreshToken) {
      console.error('❌ No refresh token available')
      return false
    }

    try {
      const tokens = await SpotifyAuthService.refreshAccessToken(auth.refreshToken)
      if (tokens) {
        auth.setTokens(tokens)
        return true
      }
      return false
    } catch (error) {
      console.error('❌ Token refresh failed:', error)
      return false
    }
  }, [auth])

  /**
   * Check if logged in and token is valid
   * Automatically refreshes if needed
   */
  const isLoggedIn = useCallback(async () => {
    if (!auth.accessToken || !auth.expiresAt) {
      return false
    }

    // Check if token needs refresh
    if (SpotifyAuthService.needsRefresh(auth.expiresAt)) {
      console.log('🔄 Token expires soon, refreshing...')
      const refreshed = await refreshToken()
      if (refreshed) {
        console.log('✅ Token refreshed successfully')
        return true
      }
      console.log('❌ Token expired and refresh failed')
      return false
    }

    return true
  }, [auth.accessToken, auth.expiresAt, refreshToken])

  /**
   * Logout and clear tokens
   */
  const logout = useCallback(() => {
    stopRefreshCheck()
    auth.logout()
    console.log('✅ Logged out')
  }, [auth])

  /**
   * Start periodic token refresh check
   */
  const startRefreshCheck = useCallback(() => {
    // Stop existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
    }

    // Check every 10 minutes
    refreshIntervalRef.current = setInterval(
      async () => {
        console.log('⏰ Periodic token check...')
        const isValid = await isLoggedIn()
        if (!isValid) {
          console.log('❌ Token invalid, session ended')
          stopRefreshCheck()
          auth.logout()
        }
      },
      SPOTIFY_CONFIG.TOKEN_REFRESH_CHECK_INTERVAL_MS
    )

    console.log('✅ Token refresh check started')
  }, [isLoggedIn, auth])

  /**
   * Stop periodic token refresh check
   */
  const stopRefreshCheck = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
      refreshIntervalRef.current = null
      console.log('🛑 Token refresh check stopped')
    }
  }, [])

  /**
   * Get current access token
   * Automatically refreshes if needed
   */
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!auth.accessToken || !auth.expiresAt) {
      return null
    }

    // Check if token needs refresh
    if (SpotifyAuthService.needsRefresh(auth.expiresAt)) {
      const refreshed = await refreshToken()
      if (!refreshed) {
        return null
      }
    }

    return auth.accessToken
  }, [auth.accessToken, auth.expiresAt, refreshToken])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      stopRefreshCheck()
    }
  }, [stopRefreshCheck])

  return {
    // State from AuthContext
    isLoggedIn: auth.isLoggedIn,
    accessToken: auth.accessToken,
    isLoading: auth.isLoading,

    // Methods
    login,
    logout,
    handleCallback,
    refreshToken,
    checkIsLoggedIn: isLoggedIn,
    getAccessToken,
    startRefreshCheck,
    stopRefreshCheck
  }
}
