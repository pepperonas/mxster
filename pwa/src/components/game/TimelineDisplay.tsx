/**
 * Timeline Display Component
 * Shows the chronological timeline of cards
 */

import { useGame, useSettings } from '@/contexts'

interface TimelineDisplayProps {
  playerId?: number // Optional: Show specific player's timeline (Timeline Personal mode)
}

export function TimelineDisplay({ playerId }: TimelineDisplayProps) {
  const { players, currentPlayer, gameMode, globalTimeline } = useGame()
  const { settings } = useSettings()

  // Determine which timeline to show
  const timeline =
    gameMode === 'timeline_global'
      ? globalTimeline
      : playerId !== undefined
        ? players[playerId]?.timeline || []
        : players[currentPlayer]?.timeline || []

  const playerName =
    playerId !== undefined ? players[playerId]?.name : players[currentPlayer]?.name

  // Create 10 slots (filled or empty)
  const slots = Array.from({ length: 10 }, (_, index) => {
    if (gameMode === 'timeline_global') {
      // Global timeline: timeline is GlobalTimelineCard[]
      const card = timeline[index] || null
      return {
        slotNumber: index + 1,
        song: card ? card.song : null,
        playerId: card ? card.playerId : null
      }
    } else {
      // Personal/Guess timeline: timeline is Song[]
      return {
        slotNumber: index + 1,
        song: timeline[index] || null,
        playerId: null
      }
    }
  })

  const cardCount = timeline.length

  return (
    <div className="glass rounded-2xl p-6 border-2 border-accent/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gradient">
          {gameMode === 'timeline_global' ? 'Globale Timeline' : `Timeline: ${playerName}`}
        </h3>
        <span className="text-sm font-bold text-secondary glass px-4 py-2 rounded-lg border border-accent/20">
          {cardCount}/10
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-primary rounded-full overflow-hidden mb-4 border border-accent/20">
        <div
          className="h-full bg-gradient-to-r from-secondary to-accent transition-all duration-500 shadow-glow-sm"
          style={{ width: `${(cardCount / 10) * 100}%` }}
        />
      </div>

      {/* Player Standings (Global Timeline only) */}
      {gameMode === 'timeline_global' && (
        <div className="mb-4 p-4 glass border border-accent/20 rounded-lg">
          <h4 className="text-sm font-bold text-text-secondary mb-3">Spieler-Punktestand</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {players.map((player, index) => (
              <div
                key={index}
                className={`
                  p-2 rounded-lg border transition-all
                  ${index === currentPlayer
                    ? 'bg-accent/20 border-accent shadow-glow-sm'
                    : 'bg-primary/30 border-accent/20'
                  }
                `}
              >
                <div className="text-xs font-semibold truncate">{player.name}</div>
                <div className="text-sm font-bold text-secondary">{player.cards}/10 Karten</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card Grid: Responsive - 2 cols on mobile (2×5), 4 on tablet, 5 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {slots.map((slot) => (
          <div
            key={slot.slotNumber}
            className={`
              rounded-xl p-3 border-2 transition-all
              aspect-[3/4] flex flex-col justify-center items-center relative
              ${
                slot.song
                  ? 'glass border-accent/50 hover:border-accent hover:shadow-glow-sm'
                  : 'bg-transparent border-accent/20 border-dashed opacity-40'
              }
            `}
          >
            {slot.song ? (
              <>
                {/* Success Badge - Show points in Guess Mode, checkmark otherwise */}
                <div className="absolute top-1 right-1 w-6 h-6 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center text-xs font-bold shadow-glow-sm">
                  {gameMode === 'guess' && slot.song.points !== undefined
                    ? slot.song.points
                    : '✓'
                  }
                </div>

                {/* Player Badge (Global Timeline only) - Responsive */}
                {gameMode === 'timeline_global' && slot.playerId !== null && (
                  <div
                    className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary/90 border border-accent/50 rounded text-[10px] sm:text-[8px] font-bold text-secondary shadow-glow-sm"
                    title={`Platziert von: ${players[slot.playerId]?.name}`}
                  >
                    {/* Show single letter on mobile, 3 letters on desktop */}
                    <span className="inline sm:hidden">{players[slot.playerId]?.name.charAt(0).toUpperCase()}</span>
                    <span className="hidden sm:inline">{players[slot.playerId]?.name.substring(0, 3).toUpperCase()}</span>
                  </div>
                )}

                {/* Year - Responsive */}
                <div className={`text-2xl sm:text-xl font-bold text-gradient mb-1 ${settings.hideYearsInTimeline ? 'blur-md select-none' : ''}`}>
                  {slot.song.year}
                </div>

                {/* Title (truncated) - Responsive */}
                <div
                  className="text-xs sm:text-[11px] text-text-secondary overflow-hidden text-ellipsis whitespace-nowrap w-full text-center"
                  title={`${slot.song.title} - ${slot.song.artist}`}
                >
                  {slot.song.title}
                </div>

                {/* Artist (truncated) - Responsive */}
                <div
                  className="text-[10px] sm:text-[9px] text-text-secondary/60 overflow-hidden text-ellipsis whitespace-nowrap w-full text-center mt-0.5"
                  title={slot.song.artist}
                >
                  {slot.song.artist}
                </div>
              </>
            ) : (
              /* Empty Slot */
              <div className="text-2xl font-bold text-gray-600 opacity-30">
                {slot.slotNumber}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
