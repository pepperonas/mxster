/**
 * Turntable — the record player at the centre of the game.
 *
 * The record spins while the song plays, a ring around it shows the position,
 * and the label in the middle is the control: play/pause during the song, the
 * year once the card is revealed. With no song on the platter the big button
 * below draws the next one.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { Vinyl } from '@/components/ui/Vinyl'
import { Icon } from '@/components/ui/Icon'
import { useSettings, useUI } from '@/contexts'
import { getPreviewPlayer, type PlayerState } from '@/services/PreviewPlayerService'
import { spring } from '@/motion/springs'
import type { Song } from '@/types'

interface TurntableProps {
  song: Song | null
  /** Year shown on the label after a reveal. */
  revealYear?: number | null
  revealCorrect?: boolean | null
  /** Album cover printed on the label after the reveal. */
  revealCover?: string | null
  /** Shown when no song is on the platter. */
  drawLabel?: string
  onDraw?: () => void
  drawDisabled?: boolean
}

const RANDOM_START_MAX_S = 150 // ~3.5 min average song, keep ≥ 60 s left

export function Turntable({ song, revealYear, revealCorrect, revealCover, drawLabel = 'Song ziehen', onDraw, drawDisabled }: TurntableProps) {
  const { settings } = useSettings()
  const { addToast } = useUI()
  const player = useRef(getPreviewPlayer())
  const [state, setState] = useState<PlayerState>('idle')
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const p = player.current
    p.setConfig({
      onStateChange: setState,
      onError: (msg) => addToast(msg, 'error'),
      onEnd: () => setPosition(0)
    })
    return () => {
      p.stop()
      p.setConfig({})
    }
  }, [addToast])

  // New song → play it (optionally from a random position)
  const songKey = song?.id ?? null
  useEffect(() => {
    if (!song) {
      player.current.stop()
      setPosition(0)
      setDuration(0)
      return
    }
    const start = settings.randomStartPosition ? Math.floor(Math.random() * RANDOM_START_MAX_S) : 0
    player.current.play(song, start).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songKey])

  // Position polling while playing (4 Hz is plenty for a ring)
  useEffect(() => {
    if (state !== 'playing') return
    const id = window.setInterval(() => {
      setPosition(player.current.getCurrentTime())
      setDuration(player.current.getDuration())
    }, 250)
    return () => window.clearInterval(id)
  }, [state])

  const playing = state === 'playing'
  const loading = state === 'loading'
  const toggle = useCallback(() => {
    if (playing) player.current.pause()
    else player.current.resume()
  }, [playing])

  const progress = duration > 0 ? Math.min(1, position / duration) : 0
  const revealed = revealYear != null

  return (
    <section aria-label="Plattenspieler" className="flex flex-col items-center">
      <div className="relative" style={{ width: 'min(76vw, 320px)', aspectRatio: '1' }}>
        <ProgressHalo progress={song ? progress : 0} />
        <m.div
          className="absolute inset-[6%]"
          animate={{ scale: song ? 1 : 0.94, opacity: song ? 1 : 0.85 }}
          transition={spring.spatialDefault}
        >
          <Vinyl
            size="100%"
            spinning={playing && !revealed}
            labelColor={revealed ? labelColorFor(revealCorrect) : undefined}
            labelImage={revealed ? revealCover : null}
            labelRing={revealed ? ringColorFor(revealCorrect) : undefined}
          />
        </m.div>

        {/* Centre control */}
        <div className="absolute inset-0 grid place-items-center">
          <AnimatePresence mode="popLayout" initial={false}>
            {revealed ? (
              <m.div
                key="year"
                initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.6, opacity: 0, transition: spring.effectsFast }}
                transition={spring.spatialFast}
                className="text-poster tabular"
                style={{ fontSize: 'clamp(1.6rem, 8vw, 2.2rem)', color: '#fff', textShadow: '0 1px 6px rgb(0 0 0 / 0.55)' }}
                aria-live="polite"
              >
                {revealYear}
              </m.div>
            ) : song ? (
              <m.button
                key="control"
                type="button"
                onClick={toggle}
                disabled={loading}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, borderRadius: playing ? 'var(--m3-shape-lg)' : 'var(--m3-shape-full)' }}
                exit={{ scale: 0.5, opacity: 0, transition: spring.effectsFast }}
                whileTap={{ scale: 0.88 }}
                transition={spring.spatialFast}
                className="grid place-items-center w-[26%] aspect-square m3-state-layer"
                style={{ background: 'rgb(var(--mx-brand))', color: 'rgb(var(--mx-on-brand))' }}
                aria-label={playing ? 'Pause' : 'Abspielen'}
              >
                {loading ? <span className="m3-loading-arc" style={{ borderTopColor: 'currentColor', borderRightColor: 'currentColor' }} /> : <Icon name={playing ? 'pause' : 'play'} size={32} />}
              </m.button>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-4 h-6 text-label-lg text-md-on-surface-variant tabular" aria-live="polite">
        {song ? (revealed ? '' : loading ? 'Song wird geladen …' : `${formatTime(position)} / ${formatTime(duration)}`) : ''}
      </div>

      <AnimatePresence initial={false}>
        {!song && onDraw && (
          <m.button
            key="draw"
            type="button"
            onClick={onDraw}
            disabled={drawDisabled}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: spring.effectsFast }}
            transition={spring.spatialDefault}
            className="btn btn-lg btn-brand m3-state-layer mt-2 w-full max-w-xs"
          >
            <Icon name="note" />
            {drawLabel}
          </m.button>
        )}
      </AnimatePresence>
    </section>
  )
}

/** Thin ring around the record: the song's position. */
function ProgressHalo({ progress }: { progress: number }) {
  const r = 48.5
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90" aria-hidden="true">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(var(--md-sys-color-surface-container-highest))" strokeWidth="1.4" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="rgb(var(--md-sys-color-primary))"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - progress)}
        style={{ transition: 'stroke-dashoffset 250ms linear' }}
      />
    </svg>
  )
}

function labelColorFor(correct: boolean | null | undefined) {
  if (correct === true) return 'rgb(var(--md-ref-success-40))'
  if (correct === false) return 'rgb(var(--md-ref-error-40))'
  return undefined
}

function ringColorFor(correct: boolean | null | undefined) {
  if (correct === true) return 'rgb(var(--md-ref-success-60))'
  if (correct === false) return 'rgb(var(--md-ref-error-60))'
  return 'rgb(var(--mx-label))'
}

function formatTime(s: number) {
  const t = Math.max(0, Math.floor(s))
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
}
