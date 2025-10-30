/**
 * Timeline Personal View Component
 * Shows ALL players' timelines simultaneously in Timeline Personal mode
 */

import { useGame } from '@/contexts'
import type { Player } from '@/types'

export function TimelinePersonalView() {
  const { players, currentPlayer } = useGame()

  const renderPlayerTimeline = (player: Player, playerIndex: number) => {
    const isCurrentPlayer = playerIndex === currentPlayer
    const slots = Array.from({ length: 10 }, (_, index) => ({
      slotNumber: index + 1,
      song: player.timeline[index] || null
    }))

    return (
      <div
        key={playerIndex}
        className={`
          glass rounded-2xl p-6 border-2 transition-all
          ${isCurrentPlayer ? 'border-accent shadow-glow-accent' : 'border-accent/30'}
        `}
      >
        {/* Player Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-gradient">{player.name}</h3>
            {isCurrentPlayer && (
              <span className="text-xs glass px-3 py-1 rounded-full font-semibold border border-accent/20 text-secondary">
                ← Aktuell
              </span>
            )}
          </div>
          <div className="text-sm font-bold text-secondary glass px-4 py-2 rounded-lg border border-accent/20">
            {player.cards}/10
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-primary rounded-full overflow-hidden mb-4 border border-accent/20">
          <div
            className="h-full bg-gradient-to-r from-secondary to-accent transition-all duration-500 shadow-glow-sm"
            style={{ width: `${(player.cards / 10) * 100}%` }}
          />
        </div>

        {/* Card Grid: 5 per row, 2 rows */}
        <div className="grid grid-cols-5 gap-3">
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
                  {/* Success Badge */}
                  <div className="absolute top-1 right-1 w-4 h-4 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center text-xs shadow-glow-sm">
                    ✓
                  </div>

                  {/* Year */}
                  <div className="text-xl font-bold text-gradient mb-1">
                    {slot.song.year}
                  </div>

                  {/* Title (truncated) */}
                  <div
                    className="text-[9px] text-text-secondary overflow-hidden text-ellipsis whitespace-nowrap w-full text-center"
                    title={`${slot.song.title} - ${slot.song.artist}`}
                  >
                    {slot.song.title}
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

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-white">Persönliche Timeline</h2>
        <p className="text-text-secondary text-sm mt-1">
          Jeder Spieler baut seine eigene Timeline auf
        </p>
      </div>

      {/* All Players' Timelines */}
      <div className="grid gap-6">
        {players.map((player, index) => renderPlayerTimeline(player, index))}
      </div>
    </div>
  )
}
