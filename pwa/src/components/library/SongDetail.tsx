/**
 * A song from the library in a dialog: large cover glowing in its colour,
 * title, artist, year, album, genre, the "Did you know?" fact, the group's hit
 * rate, and two actions — listen to 30 seconds (from where the song starts)
 * and copy "Artist – Title". Playback stops when the dialog closes.
 */
import { useEffect, useRef, useState } from 'react'
import { m } from 'motion/react'
import type { Song } from '@/types'
import { SongCover, factFor } from '@/components/game/SongInfo'
import { Icon } from '@/components/ui/Icon'
import { getPreviewPlayer, type PlayerState } from '@/services/PreviewPlayerService'
import { coverSrc } from '@/utils/cover'
import { useCoverColor } from '@/utils/coverColor'
import { copySong } from '@/utils/copySong'
import { useUI } from '@/contexts'
import { spring } from '@/motion/springs'
import { useLang, useMessages } from '@/i18n'
import { libraryText } from '@/i18n/messages/library'
import { setupText } from '@/i18n/messages/setup'
import { genreGroup } from '@/game/songPool'

/** How long "Listen" plays. */
export const LISTEN_S = 30

export function SongDetail({ song, rate }: { song: Song; rate?: { tries: number; right: number } }) {
  const t = useMessages(libraryText)
  const setup = useMessages(setupText)
  const { lang } = useLang()
  const { addToast } = useUI()
  const glow = useCoverColor(coverSrc(song))
  const fact = factFor(song, lang)
  const [state, setState] = useState<PlayerState>('idle')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const player = getPreviewPlayer()
    return () => {
      window.clearTimeout(timer.current)
      player.setConfig({})
      player.stop()
    }
  }, [])

  const playing = state === 'playing' || state === 'loading'
  const toggle = () => {
    const player = getPreviewPlayer()
    if (playing) {
      window.clearTimeout(timer.current)
      player.stop()
      return
    }
    player.setConfig({ onStateChange: setState, onEnd: () => setState('idle') })
    void player.play(song, (song.startMs ?? 0) / 1000).catch(() => setState('error'))
    timer.current = window.setTimeout(() => player.stop(), LISTEN_S * 1000)
  }

  return (
    <div className="space-y-5" data-song-detail>
      <div className="relative grid place-items-center pt-2">
        <span
          aria-hidden="true"
          className="absolute inset-0 -m-4 rounded-full pointer-events-none transition-opacity duration-m3-effects-slow"
          style={{
            opacity: glow ? 1 : 0,
            background: glow ? `radial-gradient(closest-side, rgb(${glow.join(' ')} / 0.45), rgb(${glow.join(' ')} / 0))` : undefined
          }}
        />
        <m.span
          className="relative block w-[min(64vw,240px)] aspect-square rounded-m3-lg overflow-hidden shadow-m3-3 [&>span:first-child]:!w-full [&>span:first-child]:!h-full [&>span:first-child]:!rounded-none"
          initial={{ scale: 0.85, opacity: 0, rotate: -3 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={spring.spatialDefault}
        >
          <SongCover song={song} size={240} />
        </m.span>
      </div>

      <div className="text-center">
        <p className="text-poster num-poster text-md-primary" style={{ fontSize: '2.4rem', lineHeight: 1 }}>
          {song.year}
        </p>
        <p className="text-title-lg mt-2">{song.title}</p>
        <p className="text-body-lg text-md-on-surface-variant">{song.artist}</p>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-body-md">
        {song.album && (
          <>
            <dt className="text-md-on-surface-variant">{t.album}</dt>
            <dd>{song.album}</dd>
          </>
        )}
        {song.genre && (
          <>
            <dt className="text-md-on-surface-variant">{t.genre}</dt>
            <dd>{setup[`genre_${genreGroup(song.genre)}`]}</dd>
          </>
        )}
        <dt className="text-md-on-surface-variant">{t.yourRate}</dt>
        <dd className="num-poster">{rate && rate.tries > 0 ? t.rateValue(rate.right, rate.tries) : t.notPlayed}</dd>
      </dl>

      {fact && (
        <div className="rounded-m3-lg bg-md-surface-container-high p-4">
          <p className="text-label-lg text-md-primary">{t.didYouKnow}</p>
          <p className="text-body-md mt-1">{fact}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" className="btn btn-brand m3-state-layer flex-1" onClick={toggle} aria-pressed={playing}>
          <Icon name={playing ? 'pause' : 'play'} />
          {playing ? t.stop : t.listen}
        </button>
        <button type="button" className="btn btn-tonal m3-state-layer flex-1" onClick={() => void copySong(song, addToast, t)}>
          <Icon name="copy" />
          {t.copy}
        </button>
      </div>
    </div>
  )
}
