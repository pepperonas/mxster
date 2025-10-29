/**
 * Guess Form Component
 * Input fields for guessing title, artist, year
 */

import { useState } from 'react'
import { useGame, useUI } from '@/contexts'

interface GuessFormProps {
  onSubmit: (title: string, artist: string, year: string) => void
  onSkip: () => void
}

export function GuessForm({ onSubmit, onSkip }: GuessFormProps) {
  const { gameMode } = useGame()
  const { showModal } = useUI()
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [year, setYear] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // In Timeline modes, only year is required
    if (gameMode !== 'guess') {
      if (year) {
        onSubmit(title, artist, year)
        clearForm()
      }
      return
    }

    // In Guess mode, at least title OR artist should be filled
    if (!title && !artist && !year) {
      alert('Bitte mindestens ein Feld ausfüllen')
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
        { label: 'Abbrechen', variant: 'secondary' },
        {
          label: 'Überspringen',
          variant: 'danger',
          onClick: () => {
            onSkip()
            clearForm()
          }
        }
      ]
    )
  }

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-gray-800">
      <h3 className="text-2xl font-bold mb-6 text-center">
        {gameMode === 'guess' ? 'Was ist deine Vermutung?' : 'Optional: Rate den Song'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-400 mb-2">
            Titel {gameMode === 'guess' && '(+1 Punkt)'}
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Song-Titel eingeben..."
            className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-600 focus:outline-none"
          />
        </div>

        {/* Artist Input */}
        <div>
          <label htmlFor="artist" className="block text-sm font-medium text-gray-400 mb-2">
            Interpret {gameMode === 'guess' && '(+1 Punkt)'}
          </label>
          <input
            type="text"
            id="artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Interpret eingeben..."
            className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-600 focus:outline-none"
          />
        </div>

        {/* Year Input */}
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-400 mb-2">
            Jahr {gameMode === 'guess' && '(+1 Punkt)'}
          </label>
          <input
            type="number"
            id="year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="1990"
            min="1950"
            max={new Date().getFullYear()}
            className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-600 focus:outline-none"
          />
        </div>

        {/* Info */}
        {gameMode === 'guess' && (
          <div className="p-4 bg-purple-900/30 rounded-lg text-sm text-purple-300">
            💡 <strong>Fuzzy Matching:</strong> Tippfehler werden toleriert, Groß-/Kleinschreibung
            spielt keine Rolle!
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleSkipClick}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-medium"
          >
            Überspringen
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-bold"
          >
            {gameMode === 'guess' ? 'Rate absenden' : 'Weiter'}
          </button>
        </div>
      </form>
    </div>
  )
}
