/**
 * What there is to know about a song once it is revealed: cover, title,
 * artist, album and — when we have one — a short "Wusstest du?" fact.
 * Shown under the hardcore verdict and in the timeline result dock.
 */
import { useState } from 'react'
import { m } from 'motion/react'
import type { Song } from '@/types'
import { Icon } from '@/components/ui/Icon'
import { coverSrc } from '@/utils/cover'
import { spring } from '@/motion/springs'

interface SongInfoProps {
  song: Song
  /**
   * full: cover, title, artist, album · album: cover and album (title and
   * artist are shown elsewhere) · none: only the fact.
   */
  head?: 'full' | 'album' | 'none'
  delay?: number
}

export function SongCover({ song, size }: { song: Song; size: number }) {
  const [failed, setFailed] = useState(false)
  return (
    <span
      className="flex-shrink-0 grid place-items-center overflow-hidden rounded-m3-md bg-md-surface-container-highest text-md-on-surface-variant"
      style={{ width: size, height: size }}
    >
      {failed ? (
        <Icon name="album" size={Math.round(size * 0.5)} />
      ) : (
        <img
          src={coverSrc(song)}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      )}
    </span>
  )
}

export function SongInfo({ song, head = 'full', delay = 0 }: SongInfoProps) {
  if (head === 'none' && !song.fact) return null
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring.effectsDefault, delay }}
      className="space-y-3"
    >
      {head === 'full' && (
        <div className="flex items-center gap-3">
          <SongCover song={song} size={64} />
          <div className="min-w-0">
            <p className="text-title-sm truncate">{song.title}</p>
            <p className="text-body-sm text-md-on-surface-variant truncate">{song.artist}</p>
            {song.album && <p className="text-body-sm text-md-on-surface-variant truncate">Album: {song.album}</p>}
          </div>
        </div>
      )}
      {head === 'album' && (
        <div className="flex items-center gap-3">
          <SongCover song={song} size={48} />
          <p className="min-w-0 text-body-md text-md-on-surface-variant">
            <span className="block text-label-md">Album</span>
            <span className="block text-md-on-surface truncate">{song.album || song.title}</span>
          </p>
        </div>
      )}
      {song.fact && (
        <p className="flex gap-2 text-body-sm text-md-on-surface-variant">
          <Icon name="lightbulb" size={18} className="flex-shrink-0 mt-0.5 text-md-tertiary" />
          <span>
            <span className="text-md-on-surface">Wusstest du? </span>
            {song.fact}
          </span>
        </p>
      )}
    </m.div>
  )
}
