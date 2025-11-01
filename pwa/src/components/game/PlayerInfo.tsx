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
    <div className="glass rounded-2xl p-6 border-2 border-accent/30 hover:border-accent transition-colors">
      <div className="flex items-center justify-between">
        {/* Current Player */}
        <div className="flex items-center gap-4">
          <div className="text-5xl">{isDJ ? '🎧' : '🎮'}</div>
          <div>
            <p className="text-sm text-text-secondary uppercase tracking-wider">
              {isDJ ? 'DJ (scannt QR-Codes)' : 'Aktiver Spieler'}
            </p>
            <h2 className="text-3xl font-bold text-gradient">{player.name}</h2>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient">{player.cards}</div>
            <div className="text-xs text-text-secondary uppercase tracking-wider">Karten</div>
          </div>
          {gameMode === 'hardcore' && (
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient">{player.score}</div>
              <div className="text-xs text-text-secondary uppercase tracking-wider">Punkte</div>
            </div>
          )}
        </div>
      </div>

      {/* DJ in Physical Guess Mode - Show other players waiting */}
      {needsDJ && isDJ && (
        <div className="mt-4 pt-4 border-t border-accent/20">
          <p className="text-sm text-text-secondary text-center">
            🎵 Scanne die nächste Karte, die anderen Spieler warten...
          </p>
        </div>
      )}
    </div>
  )
}
