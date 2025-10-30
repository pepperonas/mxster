/**
 * Timeline Card Component
 * Single card in the timeline display
 */

import type { Song } from '@/types'

interface TimelineCardProps {
  song: Song
  index: number
  isHighlighted?: boolean
}

export function TimelineCard({ song, index, isHighlighted = false }: TimelineCardProps) {
  return (
    <div
      className={`
        relative p-4 rounded-xl border-2 transition-all overflow-visible group
        ${
          isHighlighted
            ? 'glass border-accent shadow-glow-accent'
            : 'glass border-accent/30 hover:border-accent/50'
        }
      `}
    >
      {/* Card Number */}
      <div className="absolute top-2 left-2 w-8 h-8 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center text-sm font-bold shadow-glow-sm z-10">
        {index + 1}
      </div>

      {/* Song Info */}
      <div className="pl-3">
        <h4 className="font-bold text-white text-lg mb-1 group-hover:text-gradient transition-colors">{song.title}</h4>
        <p className="text-text-secondary text-sm mb-2">{song.artist}</p>
        <div className="flex items-center gap-2">
          <span className="glass px-3 py-1 rounded-full text-secondary text-xs font-semibold border border-accent/20">
            {song.year}
          </span>
          {song.album && (
            <span className="text-text-secondary text-xs truncate" title={song.album}>
              {song.album}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
