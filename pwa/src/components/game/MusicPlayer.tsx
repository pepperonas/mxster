/**
 * Music Player Component
 * Placeholder for Spotify Web Playback SDK integration (Phase 10)
 */

import type { Song } from '@/types'
import { MusicIcon } from '@/utils/icons'

interface MusicPlayerProps {
  song: Song | null
}

export function MusicPlayer({ song }: MusicPlayerProps) {
  if (!song) return null

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-purple-600">
      {/* Song Info */}
      <div className="flex items-center gap-6 mb-6">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-4xl shadow-glow-sm">
          <MusicIcon size={48} color="white" />
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-white mb-1">Song wird abgespielt...</h3>
          <p className="text-gray-400">Rate Titel, Interpret und Jahr</p>
        </div>
      </div>

      {/* Playback Controls Placeholder */}
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse"
              style={{ width: '30%' }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>0:15</span>
            <span>3:45</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
            ⏮
          </button>
          <button className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors text-2xl">
            ▶️
          </button>
          <button className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
            ⏭
          </button>
        </div>
      </div>

      {/* Phase 10 Note */}
      <div className="mt-6 p-4 bg-yellow-900/30 rounded-lg text-sm text-yellow-300">
        ⚠️ <strong>Phase 10:</strong> Spotify Web Playback SDK wird hier integriert
      </div>
    </div>
  )
}
