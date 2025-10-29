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
        relative p-4 rounded-xl border-2 transition-all
        ${
          isHighlighted
            ? 'bg-purple-900/50 border-purple-500 shadow-glow-sm'
            : 'bg-gray-800/50 border-gray-700'
        }
      `}
    >
      {/* Card Number */}
      <div className="absolute -top-3 -left-3 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
        {index + 1}
      </div>

      {/* Song Info */}
      <div className="pl-3">
        <h4 className="font-bold text-white text-lg mb-1">{song.title}</h4>
        <p className="text-gray-400 text-sm mb-2">{song.artist}</p>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-purple-600/30 rounded-full text-purple-300 text-xs font-semibold">
            {song.year}
          </span>
          {song.album && (
            <span className="text-gray-500 text-xs truncate" title={song.album}>
              {song.album}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
