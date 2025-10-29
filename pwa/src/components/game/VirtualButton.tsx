/**
 * Virtual Button Component
 * "Next Song" button for Virtual mode - draws random song from database
 */

import { useState } from 'react'
import { useGame } from '@/contexts'
import { songs } from '@/data/songs'

export function VirtualButton() {
  const { playedSongs, setCurrentSong } = useGame()
  const [isLoading, setIsLoading] = useState(false)

  const handleDrawSong = () => {
    setIsLoading(true)

    // Get available songs (not yet played)
    const availableSongs = songs.filter((song) => !playedSongs.includes(song.id))

    if (availableSongs.length === 0) {
      alert('Alle Songs wurden bereits gespielt!')
      setIsLoading(false)
      return
    }

    // Draw random song
    const randomIndex = Math.floor(Math.random() * availableSongs.length)
    const randomSong = availableSongs[randomIndex]

    // Simulate loading delay for dramatic effect
    setTimeout(() => {
      setCurrentSong(randomSong)
      setIsLoading(false)
    }, 500)
  }

  const availableCount = songs.length - playedSongs.length

  return (
    <div className="text-center">
      <button
        onClick={handleDrawSong}
        disabled={isLoading || availableCount === 0}
        className={`
          px-12 py-6 rounded-2xl font-bold text-xl transition-all
          ${
            isLoading || availableCount === 0
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-glow-accent'
          }
        `}
      >
        {isLoading ? (
          <>
            <span className="inline-block animate-spin mr-2">⏳</span>
            Ziehe Song...
          </>
        ) : (
          <>
            🎲 Nächsten Song ziehen
          </>
        )}
      </button>

      <p className="text-sm text-gray-400 mt-3">
        {availableCount} von {songs.length} Songs verfügbar
      </p>
    </div>
  )
}
