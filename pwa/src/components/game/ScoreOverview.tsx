/**
 * Score Overview Component
 * Shows all players' scores in Guess mode
 */

import { useGame } from '@/contexts'
import { TrophyIcon } from '@/utils/icons'

export function ScoreOverview() {
  const { players, currentPlayer, gameMode } = useGame()

  // Only show in Guess mode
  if (gameMode !== 'hardcore') return null

  // Sort players by score (descending)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="glass rounded-m3-xl p-6 border-2 border-accent/30">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <TrophyIcon size={24} color="#a855f7" />
        <h3 className="text-title-lg text-gradient">Punkteübersicht</h3>
      </div>

      {/* Players List */}
      <div className="space-y-3">
        {sortedPlayers.map((player, index) => {
          const playerIndex = players.findIndex((p) => p.name === player.name)
          const isCurrentPlayer = playerIndex === currentPlayer

          return (
            <div
              key={player.name}
              className={`
                flex items-center justify-between p-4 rounded-m3-md transition-all glass
                ${
                  isCurrentPlayer
                    ? 'border-2 border-accent shadow-glow-accent'
                    : 'border-2 border-accent/30 hover:border-accent/50'
                }
              `}
            >
              {/* Rank & Name */}
              <div className="flex items-center gap-3">
                <span className="text-2xl w-10 text-center">
                  {index < 3 ? medals[index] : `#${index + 1}`}
                </span>
                <div>
                  <p className="font-bold text-text-primary">{player.name}</p>
                  <p className="text-xs text-text-secondary">{player.cards} Karten</p>
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <div className="text-2xl font-bold text-brand tabular-nums">{player.score}</div>
                <div className="text-xs text-text-secondary">Punkte</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Info */}
      <div className="mt-6 pt-4 border-t border-accent/20 text-center text-sm text-text-secondary">
        🏆 Gewinner: Meisten Punkte nach 10 Karten
      </div>
    </div>
  )
}
