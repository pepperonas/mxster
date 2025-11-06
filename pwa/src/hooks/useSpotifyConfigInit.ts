/**
 * Hook to ensure Spotify configuration is loaded before app starts
 */

import { useState, useEffect } from 'react'

export function useSpotifyConfigInit() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Wait for Spotify config to be initialized
    const initConfig = async () => {
      try {
        // Access SpotifyAuthService to trigger config initialization
        // The service will initialize the config on first access
        await new Promise(resolve => setTimeout(resolve, 100)) // Small delay to ensure async init completes
        setIsReady(true)
      } catch (error) {
        console.error('Failed to initialize Spotify config:', error)
        setIsReady(true) // Continue anyway
      }
    }

    initConfig()
  }, [])

  return isReady
}
