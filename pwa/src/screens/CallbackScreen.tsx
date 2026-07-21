/**
 * Callback Screen
 * Handles Spotify OAuth callback
 */

import { useEffect, useState, useRef } from 'react'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { useSpotifyAuth } from '@/hooks'
import { LoadingIndicator } from '@/components/ui/LoadingIndicator'

export function CallbackScreen() {
  const navigate = useAppNavigate()
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
      <div className="flex flex-col items-center text-center space-y-6">
        {status === 'processing' && (
          <LoadingIndicator size={64} label="Verbinde mit Spotify..." />
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl">✅</div>
            <h1 className="text-headline-md text-secondary">
              Erfolgreich verbunden!
            </h1>
            <p className="text-body-md text-text-secondary">Du wirst weitergeleitet...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl">❌</div>
            <h1 className="text-headline-md text-md-error">
              Verbindung fehlgeschlagen
            </h1>
            <p className="text-body-md text-text-secondary">{error}</p>
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
