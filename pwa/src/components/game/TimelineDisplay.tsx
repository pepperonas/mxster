/**
 * Timeline Display Component
 * Shows the chronological timeline of cards
 */

import { useGame } from '@/contexts'
import { TimelineCard } from './TimelineCard'

interface TimelineDisplayProps {
  playerId?: number // Optional: Show specific player's timeline (Timeline Personal mode)
}

export function TimelineDisplay({ playerId }: TimelineDisplayProps) {
  const { players, currentPlayer, gameMode, globalTimeline } = useGame()

  // Determine which timeline to show
  const timeline =
    gameMode === 'timeline_global'
      ? globalTimeline
      : playerId !== undefined
        ? players[playerId]?.timeline || []
        : players[currentPlayer]?.timeline || []

  const playerName =
    playerId !== undefined ? players[playerId]?.name : players[currentPlayer]?.name

  if (timeline.length === 0) {
    return (
      <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-12 border-2 border-gray-800 text-center">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-2xl font-bold text-gray-400 mb-2">Keine Karten</h3>
        <p className="text-gray-500">
          {gameMode === 'timeline_global'
            ? 'Die Timeline ist noch leer'
            : `${playerName} hat noch keine Karten`}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">
          {gameMode === 'timeline_global' ? 'Globale Timeline' : `Timeline: ${playerName}`}
        </h3>
        <span className="px-4 py-2 bg-purple-600/30 rounded-full text-purple-300 font-semibold">
          {timeline.length} {timeline.length === 1 ? 'Karte' : 'Karten'}
        </span>
      </div>

      {/* Timeline */}
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {timeline.map((song, index) => (
          <TimelineCard key={`${song.id}-${index}`} song={song} index={index} />
        ))}
      </div>

      {/* Progress */}
      {timeline.length < 10 && (
        <div className="mt-6 pt-4 border-t border-gray-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Fortschritt</span>
            <span className="text-purple-400 font-semibold">{timeline.length}/10</span>
          </div>
          <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
              style={{ width: `${(timeline.length / 10) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
