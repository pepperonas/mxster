/**
 * Callback Screen
 * Handles Spotify OAuth callback
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSpotifyAuth } from '@/hooks'

export function CallbackScreen() {
  const navigate = useNavigate()
  const { handleCallback } = useSpotifyAuth()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const processCallback = async () => {
      try {
        const accessToken = await handleCallback()

        if (accessToken) {
          setStatus('success')
          // Redirect to mode selection after successful login
          setTimeout(() => {
            navigate('/mode-selection')
          }, 1500)
        } else {
          setStatus('error')
          setError('Keine Zugangsdaten erhalten')
        }
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
      }
    }

    processCallback()
  }, [handleCallback, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        {status === 'processing' && (
          <>
            <div className="text-6xl animate-bounce">🎵</div>
            <h1 className="text-3xl font-bold text-gradient">
              Verbinde mit Spotify...
            </h1>
            <div className="flex justify-center gap-2">
              <div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse" />
              <div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse delay-100" />
              <div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse delay-200" />
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl">✅</div>
            <h1 className="text-3xl font-bold text-green-400">
              Erfolgreich verbunden!
            </h1>
            <p className="text-gray-400">Du wirst weitergeleitet...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl">❌</div>
            <h1 className="text-3xl font-bold text-red-400">
              Verbindung fehlgeschlagen
            </h1>
            <p className="text-gray-400">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Zurück zur Startseite
            </button>
          </>
        )}
      </div>
    </div>
  )
}
