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
    <div className="glass rounded-2xl p-8 border-2 border-accent/30 hover:border-accent transition-colors text-center">
      <h3 className="text-2xl font-bold mb-6 text-gradient">Virtueller Modus</h3>

      <button
        onClick={onClick}
        disabled={availableCount === 0}
        className={`
          w-full px-12 py-6 rounded-2xl font-bold text-xl transition-all
          ${
            availableCount === 0
              ? 'bg-gray-700 text-text-secondary cursor-not-allowed'
              : 'bg-gradient-to-r from-secondary to-accent hover:from-secondary hover:to-accent text-white shadow-glow-accent transform hover:scale-105'
          }
        `}
      >
        🎲 Zufälligen Song ziehen
      </button>

      <div className="mt-4 px-4 py-2 glass rounded-lg border border-accent/20">
        <p className="text-sm font-semibold">
          Verfügbare Songs:{' '}
          <span className={availableCount === 0 ? 'text-red-400' : 'text-secondary'}>
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
