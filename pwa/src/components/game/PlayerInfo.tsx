/**
 * Player Info Component
 * Shows current player, DJ (if physical mode), and stats
 */

import { useGame } from '@/contexts'
import { requiresDJ } from '@/utils/gameModes'

export function PlayerInfo() {
  const { players, currentPlayer, currentDJ, gameMode, gameVariant } = useGame()

  if (players.length === 0) return null

  const player = players[currentPlayer]
  const needsDJ = requiresDJ(gameMode, gameVariant)
  const isDJ = needsDJ && currentPlayer === currentDJ

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-600">
      <div className="flex items-center justify-between">
        {/* Current Player */}
        <div className="flex items-center gap-4">
          <div className="text-5xl">{isDJ ? '🎧' : '🎮'}</div>
          <div>
            <p className="text-sm text-gray-400 uppercase tracking-wider">
              {isDJ ? 'DJ (scannt QR-Codes)' : 'Aktiver Spieler'}
            </p>
            <h2 className="text-3xl font-bold text-white">{player.name}</h2>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">{player.cards}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Karten</div>
          </div>
          {gameMode === 'guess' && (
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{player.score}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Punkte</div>
            </div>
          )}
        </div>
      </div>

      {/* DJ in Physical Guess Mode - Show other players waiting */}
      {needsDJ && isDJ && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <p className="text-sm text-gray-400 text-center">
            🎵 Scanne die nächste Karte, die anderen Spieler warten...
          </p>
        </div>
      )}
    </div>
  )
}
