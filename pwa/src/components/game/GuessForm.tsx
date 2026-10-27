/**
 * Guess Form Component
 * Input fields for guessing title, artist, year
 */

import { useState, useEffect, useRef } from 'react'
import { useGame, useUI } from '@/contexts'
import { useMessages } from '@/i18n'
import { gameText } from '@/i18n/messages/game'

interface GuessFormProps {
  onSubmit: (title: string, artist: string, year: string) => void
  onSkip: () => void
}

export function GuessForm({ onSubmit, onSkip }: GuessFormProps) {
  const t = useMessages(gameText)
  const { gameMode, players, currentPlayer, tiebreak } = useGame()
  const { showModal, closeModal } = useUI()
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [year, setYear] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Get current player name
  const playerName = players[currentPlayer]?.name || t.playerFallback

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
        t.noAnswer,
        <p className="text-md-on-surface-variant">{t.noAnswerBody}</p>,
        [
          {
            text: t.understood,
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
      t.skipQuestion,
      <p className="text-md-on-surface-variant">{t.skipBody}</p>,
      [
        // In Hardcore mode: Make "Abbrechen" primary so Enter closes modal instead of skipping
        { text: t.cancel, variant: gameMode === 'hardcore' ? 'primary' : 'secondary' },
        {
          text: t.skip,
          variant: 'danger',
          closeOnClick: false,
          onClick: () => {
            closeModal()
            onSkip()
            clearForm()
          }
        }
      ]
    )
  }

  return (
    <div className="surface p-5 sm:p-6">
      <h3 className="text-title-lg mb-4 text-md-on-surface">
        {gameMode === 'hardcore'
          ? t.guessHardcore(playerName)
          : t.guessOptional(playerName)}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div>
          <label htmlFor="title" className="block text-label-lg text-md-on-surface-variant mb-1.5">
            {t.title} {gameMode === 'hardcore' && t.plus5}
          </label>
          <input
            ref={titleInputRef}
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.titlePlaceholder}
            autoComplete="off"
            className="field"
          />
        </div>

        {/* Artist Input */}
        <div>
          <label htmlFor="artist" className="block text-label-lg text-md-on-surface-variant mb-1.5">
            {t.artist} {gameMode === 'hardcore' && t.plus5}
          </label>
          <input
            type="text"
            id="artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder={t.artistPlaceholder}
            autoComplete="off"
            className="field"
          />
        </div>

        {/* Year Input */}
        <div>
          <label htmlFor="year" className="block text-label-lg text-md-on-surface-variant mb-1.5">
            {t.year} {gameMode === 'hardcore' && t.plusYear}
          </label>
          <input
            type="number"
            inputMode="numeric"
            id="year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="1990"
            min="1950"
            max={new Date().getFullYear()}
            autoComplete="off"
            className="field"
          />
        </div>

        {/* Info */}
        {gameMode === 'hardcore' && (
          <p className="text-body-sm text-md-on-surface-variant">
            {t.typosHint}
          </p>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          {!tiebreak && (
            <button
              type="button"
              onClick={handleSkipClick}
              className="btn btn-tonal m3-state-layer flex-1"
            >
              {t.skip}
            </button>
          )}
          <button
            type="submit"
            className="btn btn-brand m3-state-layer flex-[1.4]"
          >
            {gameMode === 'hardcore' ? t.check : t.next}
          </button>
        </div>
      </form>
    </div>
  )
}
