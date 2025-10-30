/**
 * Callback Screen
 * Handles Spotify OAuth callback
 */

import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSpotifyAuth } from '@/hooks'

export function CallbackScreen() {
  const navigate = useNavigate()
  const { handleCallback } = useSpotifyAuth()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [error, setError] = useState<string>('')
  const hasProcessedRef = useRef(false)

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasProcessedRef.current) {
      console.log('⏭️ Callback already processed, skipping')
      return
    }

    hasProcessedRef.current = true
    console.log('🔄 Processing Spotify callback...')

    const processCallback = async () => {
      try {
        const accessToken = await handleCallback()

        if (accessToken) {
          setStatus('success')
          console.log('✅ Callback successful, redirecting to mode selection')
          // Redirect to mode selection after successful login
          setTimeout(() => {
            navigate('/mode-selection')
          }, 1500)
        } else {
          setStatus('error')
          setError('Keine Zugangsdaten erhalten')
          console.error('❌ No access token received')
        }
      } catch (err) {
        setStatus('error')
        const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler'
        setError(errorMessage)
        console.error('❌ Callback processing failed:', errorMessage)
      }
    }

    processCallback()
  }, [handleCallback, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center relative z-10">
      <div className="text-center space-y-6">
        {status === 'processing' && (
          <>
            <div className="text-6xl animate-bounce">🎵</div>
            <h1 className="text-3xl font-bold text-gradient">
              Verbinde mit Spotify...
            </h1>
            <div className="flex justify-center gap-2">
              <div className="w-3 h-3 bg-secondary rounded-full animate-pulse" />
              <div className="w-3 h-3 bg-secondary rounded-full animate-pulse delay-100" />
              <div className="w-3 h-3 bg-secondary rounded-full animate-pulse delay-200" />
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl">✅</div>
            <h1 className="text-3xl font-bold text-green-400">
              Erfolgreich verbunden!
            </h1>
            <p className="text-text-secondary">Du wirst weitergeleitet...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl">❌</div>
            <h1 className="text-3xl font-bold text-red-400">
              Verbindung fehlgeschlagen
            </h1>
            <p className="text-text-secondary">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="btn btn-accent"
            >
              Zurück zur Startseite
            </button>
          </>
        )}
      </div>
    </div>
  )
}
