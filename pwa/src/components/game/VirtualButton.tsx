/**
 * Virtual Button Component
 * "Next Song" button for Virtual mode - draws random song from database
 */

import { useGame } from '@/contexts'
import { songs } from '@/data/songs'

interface VirtualButtonProps {
  onClick: () => void
}

export function VirtualButton({ onClick }: VirtualButtonProps) {
  const { playedSongs } = useGame()

  const availableCount = songs.length - playedSongs.length

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-gray-800 text-center">
      <h3 className="text-2xl font-bold mb-6">Virtueller Modus</h3>

      <button
        onClick={onClick}
        disabled={availableCount === 0}
        className={`
          w-full px-12 py-6 rounded-2xl font-bold text-xl transition-all
          ${
            availableCount === 0
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-glow-accent transform hover:scale-105'
          }
        `}
      >
        🎲 Zufälligen Song ziehen
      </button>

      <div className="mt-4 px-4 py-2 bg-purple-900/30 rounded-lg">
        <p className="text-sm font-semibold">
          Verfügbare Songs:{' '}
          <span className={availableCount === 0 ? 'text-red-400' : 'text-purple-400'}>
            {availableCount}/{songs.length}
          </span>
        </p>
      </div>

      {availableCount === 0 && (
        <div className="mt-4 p-3 bg-red-900/30 rounded-lg text-red-300 text-sm">
          ⚠️ Alle Songs wurden bereits gespielt!
        </div>
      )}
    </div>
  )
}
