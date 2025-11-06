/**
 * Player Info Component
 * Shows current player, DJ (if physical mode), and stats
 */

import { useGame } from '@/contexts'
import { requiresDJ } from '@/utils/gameModes'

interface PlayerInfoProps {
  isBotExecuting?: boolean
}

export function PlayerInfo({ isBotExecuting = false }: PlayerInfoProps = {}) {
  const { players, currentPlayer, currentDJ, gameMode, gameVariant } = useGame()

  if (players.length === 0 || !gameMode || !gameVariant) return null

  const player = players[currentPlayer]
  const needsDJ = requiresDJ(gameMode, gameVariant)
  const isDJ = needsDJ && currentPlayer === currentDJ

  return (
    <div className={`glass rounded-2xl p-6 border-2 ${player.isBot ? 'border-cyan-500/50 bg-gradient-to-br from-cyan-900/20 to-blue-900/20' : 'border-accent/30'} hover:border-accent transition-colors`}>
      <div className="flex items-center justify-between">
        {/* Current Player */}
        <div className="flex items-center gap-4">
          <div className="text-5xl">{player.isBot ? '🤖' : (isDJ ? '🎧' : '🎮')}</div>
          <div>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm text-text-secondary uppercase tracking-wider">
                  {player.isBot ? 'KI-Gegner' : (isDJ ? 'DJ (scannt QR-Codes)' : 'Aktiver Spieler')}
                </p>
                <h2 className="text-3xl font-bold text-gradient">{player.name}</h2>
              </div>
              {player.isBot && player.botDifficulty && (
                <span className={`
                  text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider
                  ${player.botDifficulty === 'easy' ? 'bg-green-600/40 text-green-300 border border-green-500/60' : ''}
                  ${player.botDifficulty === 'medium' ? 'bg-orange-600/40 text-orange-300 border border-orange-500/60' : ''}
                  ${player.botDifficulty === 'hard' ? 'bg-red-600/40 text-red-300 border border-red-500/60' : ''}
                `}>
                  {player.botDifficulty === 'easy' ? '😊 Leicht' : player.botDifficulty === 'medium' ? '🎯 Mittel' : '🔥 Schwer'}
                </span>
              )}
            </div>
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

      {/* Bot Thinking Indicator */}
      {player.isBot && isBotExecuting && (
        <div className="mt-4 pt-4 border-t border-cyan-500/30">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin text-2xl">🤖</div>
            <p className="text-sm text-cyan-300 font-medium animate-pulse">
              {player.botDifficulty === 'hard' ? 'Analysiert Möglichkeiten...' : player.botDifficulty === 'medium' ? 'Überlegt...' : 'Denkt nach...'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
