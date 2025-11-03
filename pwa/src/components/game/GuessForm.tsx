/**
 * Guess Form Component
 * Input fields for guessing title, artist, year
 */

import { useState, useEffect, useRef } from 'react'
import { useGame, useUI } from '@/contexts'

interface GuessFormProps {
  onSubmit: (title: string, artist: string, year: string) => void
  onSkip: () => void
}

export function GuessForm({ onSubmit, onSkip }: GuessFormProps) {
  const { gameMode, players, currentPlayer } = useGame()
  const { showModal, closeModal } = useUI()
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [year, setYear] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Get current player name
  const playerName = players[currentPlayer]?.name || 'Spieler'

  // Auto-focus on title input when component mounts (Desktop/Laptop only)
  useEffect(() => {
    // Detect if device is mobile (touch-enabled with small screen)
    const isMobile = 'ontouchstart' in window && window.innerWidth < 768

    // Only auto-focus on desktop/laptop to prevent mobile keyboard popup
    if (!isMobile && titleInputRef.current) {
      // Small delay to ensure component is fully rendered
      setTimeout(() => {
        titleInputRef.current?.focus()
      }, 100)
    }
  }, [currentPlayer]) // Re-focus when player changes

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // In Timeline modes, only year is required
    if (gameMode !== 'hardcore') {
      if (year) {
        onSubmit(title, artist, year)
        clearForm()
      }
      return
    }

    // In Guess mode, at least title OR artist should be filled
    if (!title && !artist && !year) {
      showModal(
        '⚠️ Eingabe erforderlich',
        <p className="text-gray-300">
          Bitte fülle mindestens ein Feld aus, um deine Vermutung abzugeben.
        </p>,
        [
          {
            text: 'Verstanden',
            variant: 'primary',
            onClick: () => {}
          }
        ]
      )
      return
    }

    onSubmit(title, artist, year)
    clearForm()
  }

  const clearForm = () => {
    setTitle('')
    setArtist('')
    setYear('')
  }

  const handleSkipClick = () => {
    showModal(
      'Song überspringen?',
      <p className="text-gray-300">
        Möchtest du diesen Song wirklich überspringen? Du erhältst keine Punkte.
      </p>,
      [
        { text: 'Abbrechen', variant: 'secondary' },
        {
          text: 'Überspringen',
          variant: 'danger',
          closeOnClick: false,
          onClick: () => {
            console.log('🚫 Skip confirmed - closing modal and calling onSkip')
            closeModal()
            onSkip()
            clearForm()
          }
        }
      ]
    )
  }

  return (
    <div className="glass rounded-2xl p-8 border-2 border-accent/30">
      <h3 className="text-2xl font-bold mb-6 text-center text-gradient">
        {gameMode === 'hardcore'
          ? `${playerName}, was ist deine Vermutung?`
          : `${playerName}, rate optional den Song`}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-2">
            Titel {gameMode === 'hardcore' && '(+5 Punkte)'}
          </label>
          <input
            ref={titleInputRef}
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Song-Titel eingeben..."
            autoComplete="off"
            className="w-full px-4 py-3 bg-primary border-2 border-accent/30 rounded-lg text-white placeholder-gray-500 focus:border-accent focus:shadow-glow-accent focus:outline-none focus:ring-0 transition-all"
          />
        </div>

        {/* Artist Input */}
        <div>
          <label htmlFor="artist" className="block text-sm font-medium text-text-secondary mb-2">
            Interpret {gameMode === 'hardcore' && '(+5 Punkte)'}
          </label>
          <input
            type="text"
            id="artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Interpret eingeben..."
            autoComplete="off"
            className="w-full px-4 py-3 bg-primary border-2 border-accent/30 rounded-lg text-white placeholder-gray-500 focus:border-accent focus:shadow-glow-accent focus:outline-none focus:ring-0 transition-all"
          />
        </div>

        {/* Year Input */}
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-text-secondary mb-2">
            Jahr {gameMode === 'hardcore' && '(+5/2/1 Punkte)'}
          </label>
          <input
            type="number"
            id="year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="1990"
            min="1950"
            max={new Date().getFullYear()}
            autoComplete="off"
            className="w-full px-4 py-3 bg-primary border-2 border-accent/30 rounded-lg text-white placeholder-gray-500 focus:border-accent focus:shadow-glow-accent focus:outline-none focus:ring-0 transition-all"
          />
        </div>

        {/* Info */}
        {gameMode === 'hardcore' && (
          <div className="glass p-4 rounded-lg text-sm text-text-secondary border border-accent/20">
            💡 <strong className="text-white">Fuzzy Matching:</strong> Tippfehler werden toleriert, Groß-/Kleinschreibung spielt keine Rolle!
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleSkipClick}
            className="btn btn-secondary flex-1"
          >
            Überspringen
          </button>
          <button
            type="submit"
            className="btn btn-accent flex-1 shadow-glow-accent"
          >
            {gameMode === 'hardcore' ? '✓ Antwort prüfen' : 'Weiter'}
          </button>
        </div>
      </form>
    </div>
  )
}
