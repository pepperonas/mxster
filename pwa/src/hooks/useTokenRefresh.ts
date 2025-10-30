/**
 * Background Token Refresh Hook
 * Automatically refreshes Spotify access token before expiry
 */

import { useEffect } from 'react'
import { SpotifyAuthService } from '@/services'

const TOKEN_CHECK_INTERVAL = 5 * 60 * 1000 // Check every 5 minutes
const TOKEN_REFRESH_THRESHOLD = 10 * 60 * 1000 // Refresh if expires within 10 minutes

export function useTokenRefresh() {
  useEffect(() => {
    console.log('🔄 Starting background token refresh service...')

    const checkAndRefreshToken = async () => {
      try {
        // Get stored tokens
        const accessToken = localStorage.getItem('spotify_access_token')
        const refreshToken = localStorage.getItem('spotify_refresh_token')
        const expiresAtStr = localStorage.getItem('spotify_expires_at')

        if (!accessToken || !refreshToken || !expiresAtStr) {
          // No tokens stored, nothing to refresh
          return
        }

        const expiresAt = parseInt(expiresAtStr)
        const now = Date.now()
        const timeUntilExpiry = expiresAt - now

        // Check if token needs refresh
        if (timeUntilExpiry < TOKEN_REFRESH_THRESHOLD) {
          console.log('🔄 Token expiring soon, refreshing...', {
            timeUntilExpiry: Math.floor(timeUntilExpiry / 1000 / 60) + ' minutes'
          })

          const newTokens = await SpotifyAuthService.refreshAccessToken(refreshToken)

          if (newTokens) {
            // Save refreshed tokens
            localStorage.setItem('spotify_access_token', newTokens.accessToken)
            localStorage.setItem('spotify_refresh_token', newTokens.refreshToken)
            localStorage.setItem('spotify_expires_at', newTokens.expiresAt.toString())

            console.log('✅ Token refreshed successfully', {
              newExpiresAt: new Date(newTokens.expiresAt).toLocaleString('de-DE')
            })
          } else {
            console.error('❌ Token refresh failed')
          }
        } else {
          console.log('✅ Token still valid', {
            timeUntilExpiry: Math.floor(timeUntilExpiry / 1000 / 60) + ' minutes'
          })
        }
      } catch (error) {
        console.error('❌ Token refresh check failed:', error)
      }
    }

    // Initial check
    checkAndRefreshToken()

    // Set up interval for background refresh
    const intervalId = setInterval(checkAndRefreshToken, TOKEN_CHECK_INTERVAL)

    console.log('✅ Background token refresh service started')

    // Cleanup on unmount
    return () => {
      console.log('🔌 Stopping background token refresh service...')
      clearInterval(intervalId)
    }
  }, [])
}
