/**
 * Score Overview Component
 * Shows all players' scores in Guess mode
 */

import { useGame } from '@/contexts'
import { TrophyIcon } from '@/utils/icons'

export function ScoreOverview() {
  const { players, currentPlayer, gameMode } = useGame()

  // Only show in Guess mode
  if (gameMode !== 'guess') return null

  // Sort players by score (descending)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-800">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <TrophyIcon size={24} color="#a855f7" />
        <h3 className="text-xl font-bold text-white">Punkteübersicht</h3>
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
                flex items-center justify-between p-4 rounded-lg transition-all
                ${
                  isCurrentPlayer
                    ? 'bg-purple-900/50 border-2 border-purple-600'
                    : 'bg-gray-800/50 border-2 border-gray-700'
                }
              `}
            >
              {/* Rank & Name */}
              <div className="flex items-center gap-3">
                <span className="text-2xl w-10 text-center">
                  {index < 3 ? medals[index] : `#${index + 1}`}
                </span>
                <div>
                  <p className="font-bold text-white">{player.name}</p>
                  <p className="text-xs text-gray-400">{player.cards} Karten</p>
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-400">{player.score}</div>
                <div className="text-xs text-gray-400">Punkte</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Info */}
      <div className="mt-6 pt-4 border-t border-gray-800 text-center text-sm text-gray-400">
        🏆 Gewinner: Meiste Punkte nach 10 Karten
      </div>
    </div>
  )
}
