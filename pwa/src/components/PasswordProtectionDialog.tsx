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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass rounded-2xl p-8 max-w-md w-full border-2 border-accent/30 animate-scale-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-3xl font-bold text-gradient mb-2">Zugang erforderlich</h2>
          <p className="text-text-secondary">
            Zum Schutz der selbst-gehosteten Audiodateien ist ein Passwort erforderlich.
          </p>
        </div>

        {/* Password Hint */}
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-300 text-center">
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
              className={`w-full px-4 py-3 glass rounded-lg border-2 ${
                error ? 'border-red-500/50' : 'border-accent/30'
              } focus:border-accent focus:outline-none transition-colors text-white`}
              placeholder="Passwort..."
              autoComplete="off"
            />
            {error && (
              <p className="text-red-400 text-sm mt-2">❌ Falsches Passwort</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 glass rounded-lg border-2 border-gray-500/30 hover:border-gray-500/50 transition-colors text-gray-300 hover:text-white font-medium"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!password}
              className="flex-1 px-6 py-3 bg-gradient-to-br from-secondary to-accent rounded-lg border-2 border-accent/30 hover:border-accent transition-all shadow-glow-accent disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium"
            >
              Bestätigen
            </button>
          </div>
        </form>

        {/* Footer Info */}
        <div className="mt-6 pt-6 border-t border-accent/20">
          <p className="text-xs text-text-secondary text-center">
            ℹ️ Diese Abfrage erfolgt nur einmal. Nach erfolgreicher Eingabe hast du dauerhaften Zugang.
          </p>
        </div>
      </div>
    </div>
  )
}
