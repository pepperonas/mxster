/**
 * Password Protection Dialog
 * One-time password check for self-hosted MP3 access (legal protection)
 */

import { useState, useEffect, useRef } from 'react'
import { useUI } from '@/contexts'

interface PasswordProtectionDialogProps {
  onSuccess: () => void
  onCancel: () => void
}

export function PasswordProtectionDialog({ onSuccess, onCancel }: PasswordProtectionDialogProps) {
  const { addToast } = useUI()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input field on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onCancel])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()

    if (password.toLowerCase() === 'ydl') {
      // Correct password - grant access
      localStorage.setItem('audio_access_granted', 'true')
      addToast('Zugang gewährt! 🎵', 'success')
      onSuccess()
    } else {
      // Wrong password - show error and return to landing page
      setError(true)
      addToast('Falsches Passwort', 'error')
      setTimeout(() => {
        onCancel()
      }, 1500)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pt-20 pb-6 px-4 bg-md-scrim/60 backdrop-blur-sm"
      style={{ animation: 'm3-scrim-in var(--m3-dur-effects-slow) var(--m3-ease-effects-slow) both' }}
    >
      <div className="m3-dialog-panel p-4 sm:p-6 lg:p-8 max-w-md w-full max-h-[calc(100vh-12rem)] sm:max-h-[85vh] overflow-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🔒</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">Zugang erforderlich</h2>
          <p className="text-text-secondary">
            Zum Schutz der selbst-gehosteten Audiodateien ist ein Passwort erforderlich.
          </p>
        </div>

        {/* Legal Grey Area Explanation */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-accent/10 border border-accent/30 rounded-m3-md">
          <p className="text-sm text-accent mb-2">
            <strong>⚠️ Rechtlicher Hinweis:</strong>
          </p>
          <p className="text-xs text-text-secondary">
            Diese Audiodateien stammen aus YouTube-Downloads (ydl) und befinden sich in einer rechtlichen Grauzone.
            Die Passwortabfrage dient dem rechtlichen Schutz des Entwicklers.
            Die Nutzung erfolgt auf eigene Verantwortung - nur für private, nicht-kommerzielle, bildungsbasierte Zwecke.
          </p>
        </div>

        {/* Password Hint */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-secondary/10 border border-secondary/30 rounded-m3-md">
          <p className="text-sm text-secondary text-center">
            <strong>💡 Passwort</strong>: ydl
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
              Passwort eingeben
            </label>
            <input
              ref={inputRef}
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(false)
              }}
              className={`w-full px-4 py-3 glass rounded-m3-md border-2 ${
                error ? 'border-md-error/50' : 'border-accent/30'
              } focus:border-accent focus:outline-none transition-colors text-text-primary`}
              placeholder="Passwort..."
              autoComplete="off"
            />
            {error && (
              <p className="text-md-error text-sm mt-2">❌ Falsches Passwort</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 btn btn-outline px-6 py-3 font-medium"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!password}
              className="flex-1 btn btn-accent px-6 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Bestätigen
            </button>
          </div>
        </form>

        {/* Footer Info */}
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-accent/20">
          <p className="text-xs text-text-secondary text-center">
            ℹ️ Diese Abfrage erfolgt nur einmal. Nach erfolgreicher Eingabe hast du dauerhaften Zugang.
          </p>
        </div>
      </div>
    </div>
  )
}
