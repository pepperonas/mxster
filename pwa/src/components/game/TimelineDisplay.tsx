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
      <div className="glass rounded-2xl p-12 border-2 border-accent/30 text-center">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-2xl font-bold text-gradient mb-2">Keine Karten</h3>
        <p className="text-text-secondary">
          {gameMode === 'timeline_global'
            ? 'Die Timeline ist noch leer'
            : `${playerName} hat noch keine Karten`}
        </p>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-6 border-2 border-accent/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gradient">
          {gameMode === 'timeline_global' ? 'Globale Timeline' : `Timeline: ${playerName}`}
        </h3>
        <span className="glass px-4 py-2 rounded-full text-secondary font-semibold border border-accent/20">
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
        <div className="mt-6 pt-4 border-t border-accent/20">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Fortschritt</span>
            <span className="text-secondary font-semibold">{timeline.length}/10</span>
          </div>
          <div className="mt-2 h-2 bg-primary rounded-full overflow-hidden border border-accent/20">
            <div
              className="h-full bg-gradient-to-r from-secondary to-accent transition-all duration-300 shadow-glow-sm"
              style={{ width: `${(timeline.length / 10) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
