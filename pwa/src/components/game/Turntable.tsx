/**
 * Turntable — the record player at the centre of the game.
 *
 * The record spins while the song plays, a ring around it shows the position,
 * and the label in the middle is the control: play/pause during the song, the
 * year once the card is revealed. With no song on the platter the big button
 * below draws the next one.
 *
 * compact: on phones, once a song is on the platter, the player shrinks into a
 * slim bar (small record, who is on turn, progress, play/pause) so the board
 * gets the screen. The record travels between both layouts as one shared
 * element; the audio is untouched (same component, same player).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { Vinyl } from '@/components/ui/Vinyl'
import { Icon } from '@/components/ui/Icon'
import { useSettings, useUI } from '@/contexts'
import { getPreviewPlayer, type PlayerState } from '@/services/PreviewPlayerService'
import { spring } from '@/motion/springs'
import type { Song } from '@/types'
import type { AudioCue } from '@/online/protocol'
import { cuePosition } from '@/online/clock'
import { useBackdropPlaying } from '@/hooks/useBackdropPlaying'
import { useMessages } from '@/i18n'
import { gameText } from '@/i18n/messages/game'

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
  /** Slim bar layout (phones while a song is on the platter). */
  compact?: boolean
  /** Who is on turn, shown in the compact bar. */
  caption?: string
  /**
   * Online rounds:
   *  - 'host': plays like 'local' and reports every start, pause and jump (onCue);
   *  - 'follow': plays in sync with the host's cue ("Jeder bei sich");
   *  - 'silent': plays nothing, another device has the music ("Gemeinsam im Raum":
   *    the device of whoever is on turn, see musicSeat).
   * The role may change during a song (the music moves to another device):
   * the device that takes over continues from the last cue, the one that
   * hands over stops.
   */
  audioRole?: 'local' | 'host' | 'follow' | 'silent'
  /** 'silent': whose device has the music (default: the host). */
  musicAt?: string
  cue?: AudioCue | null
  clockOffset?: () => number
  onCue?: (cue: Omit<AudioCue, 'at'>) => void
}

/** A follower jumps when it is further than this from the host (seconds). */
const SYNC_TOLERANCE_S = 0.25

const RANDOM_START_MAX_S = 150 // ~3.5 min average song, keep ≥ 60 s left

export function Turntable({
  song,
  revealYear,
  revealCorrect,
  revealCover,
  drawLabel,
  onDraw,
  drawDisabled,
  compact = false,
  caption,
  audioRole = 'local',
  cue = null,
  clockOffset = () => 0,
  onCue,
  musicAt
}: TurntableProps) {
  const t = useMessages(gameText)
  const { settings } = useSettings()
  const { addToast } = useUI()
  const player = useRef(getPreviewPlayer())
  // A stable report: the room context hands a new onCue after every cue, and
  // reporting again on that would loop (each report is a new cue)
  const onCueRef = useRef(onCue)
  onCueRef.current = onCue
  const [state, setState] = useState<PlayerState>('idle')
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  /** The browser blocked autoplay (after a reload): ask for a tap, no toast. */
  const [blocked, setBlocked] = useState(false)
  useEffect(() => {
    if (state === 'playing') setBlocked(false)
  }, [state])

  useEffect(() => {
    const p = player.current
    p.setConfig({
      onStateChange: setState,
      onError: (msg) => addToast(msg, 'error'),
      onBlocked: () => setBlocked(true),
      onEnd: () => setPosition(0)
    })
    return () => {
      p.stop()
      p.setConfig({})
    }
  }, [addToast])

  // New song → play it (optionally from a random position). Followers wait
  // for the host's cue, silent devices never play.
  const songKey = song?.id ?? null
  useEffect(() => {
    setBlocked(false)
    if (!song) {
      player.current.stop()
      setPosition(0)
      setDuration(0)
      if (audioRole === 'host') onCueRef.current?.({ songId: null, playing: false, positionMs: 0 })
      return
    }
    if (audioRole === 'follow' || audioRole === 'silent') return
    const start = settings.randomStartPosition ? Math.floor(Math.random() * RANDOM_START_MAX_S) : 0
    player.current.play(song, start).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songKey])

  // The music moves to or away from this device in the middle of a song
  const lastRole = useRef(audioRole)
  useEffect(() => {
    const before = lastRole.current
    lastRole.current = audioRole
    if (before === audioRole) return
    const p = player.current
    if (audioRole === 'silent') {
      p.stop()
      return
    }
    if (audioRole !== 'host' || before !== 'silent' || !song) return
    // Take over where the previous device was (paused stays paused)
    if (cue && cue.songId === song.id) {
      if (cue.playing) p.play(song, cuePosition(cue, Date.now(), clockOffset())).catch(() => {})
    } else {
      p.play(song, 0).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioRole])

  // Host: tell the others where the music is — on every start/pause, and every
  // few seconds while playing (late joiners, slow devices)
  const report = useCallback(() => {
    if (audioRole !== 'host' || !song) return
    onCueRef.current?.({
      songId: song.id,
      playing: player.current.getState() === 'playing',
      positionMs: Math.round(player.current.getCurrentTime() * 1000)
    })
  }, [audioRole, song])
  const heard = useRef(false)
  useEffect(() => {
    // Also when a song ends (idle) or is stopped: the host's step clock gives
    // 30 s to place once the music has stopped
    if (state === 'playing' || state === 'paused') report()
    else if ((state === 'idle' || state === 'stopped') && heard.current) report()
    heard.current = state === 'playing' || state === 'paused'
  }, [state, report])
  useEffect(() => {
    if (audioRole !== 'host' || state !== 'playing') return
    const id = window.setInterval(report, 4000)
    return () => window.clearInterval(id)
  }, [audioRole, state, report])

  // Follower: start, jump or pause to match the host's cue; re-check every 2 s
  useEffect(() => {
    if (audioRole !== 'follow' || !song) return
    const sync = () => {
      if (!cue || cue.songId !== song.id) return
      const target = cuePosition(cue, Date.now(), clockOffset())
      const p = player.current
      if (p.getSongId() !== song.id) {
        if (cue.playing) p.play(song, target).catch(() => {})
        return
      }
      if (!cue.playing) {
        if (p.getState() === 'playing') p.pause()
        return
      }
      if (p.getState() === 'paused') p.resume()
      if (Math.abs(p.getCurrentTime() - target) > SYNC_TOLERANCE_S) p.seek(target)
    }
    sync()
    const id = window.setInterval(sync, 2000)
    return () => window.clearInterval(id)
  }, [audioRole, song, cue, clockOffset])

  // Position polling while playing (4 Hz is plenty for a ring)
  useEffect(() => {
    if (state !== 'playing') return
    const id = window.setInterval(() => {
      setPosition(player.current.getCurrentTime())
      setDuration(player.current.getDuration())
    }, 250)
    return () => window.clearInterval(id)
  }, [state])

  // Silent device: show the host's music, never play it
  const silentPlaying = audioRole === 'silent' && Boolean(song && cue?.songId === song.id && cue.playing)
  useEffect(() => {
    if (audioRole !== 'silent' || !song || !cue || cue.songId !== song.id) return
    const tick = () => setPosition(cuePosition(cue, Date.now(), clockOffset()))
    tick()
    if (!cue.playing) return
    const id = window.setInterval(tick, 500)
    return () => window.clearInterval(id)
  }, [audioRole, song, cue, clockOffset])

  const playing = audioRole === 'silent' ? silentPlaying : state === 'playing'
  const loading = audioRole !== 'silent' && state === 'loading'
  useBackdropPlaying(playing)
  const toggle = useCallback(() => {
    if (audioRole === 'silent') return
    if (playing) player.current.pause()
    else player.current.resume()
  }, [playing, audioRole])

  const progress = duration > 0 ? Math.min(1, position / duration) : 0
  const revealed = revealYear != null
  const record = (
    <Vinyl
      size="100%"
      spinning={playing && !revealed}
      labelColor={revealed ? labelColorFor(revealCorrect) : undefined}
      labelImage={revealed ? revealCover : null}
      labelRing={revealed ? ringColorFor(revealCorrect) : undefined}
    />
  )

  if (compact && song) {
    return (
      <section
        aria-label={t.turntable}
        className="flex items-center gap-3 pl-2 pr-2 py-2 rounded-m3-xl bg-md-surface-container-high/95 backdrop-blur-md shadow-m3-1"
      >
        <m.div layoutId="turntable-record" transition={spring.spatialDefault} className="relative flex-shrink-0 w-14 h-14">
          {record}
          {revealed && (
            <span
              className="absolute inset-0 grid place-items-center text-label-lg tabular font-bold"
              style={{ color: '#fff', textShadow: '0 1px 4px rgb(0 0 0 / 0.7)' }}
            >
              {revealYear}
            </span>
          )}
        </m.div>
        <div className="min-w-0 flex-1">
          <p className="text-title-sm text-md-on-surface truncate" aria-live="polite">
            {blocked
              ? t.tapToPlay
              : revealed
                ? t.songIsFrom(revealYear ?? '')
                : audioRole === 'silent'
                  ? `${caption ?? t.playing} · ${musicAt ? t.atName(musicAt) : t.atHost}`
                  : (caption ?? t.playing)}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1 flex-1 rounded-m3-full bg-md-surface-container-highest overflow-hidden" role="presentation">
              <div
                className="h-full rounded-m3-full bg-md-primary origin-left"
                style={{ transform: `scaleX(${progress})`, transition: 'transform 250ms linear' }}
              />
            </div>
            <span className="text-label-sm text-md-on-surface-variant tabular">{loading ? '…' : formatTime(position)}</span>
          </div>
        </div>
        {audioRole !== 'silent' && (
          <button
            type="button"
            onClick={toggle}
            disabled={loading}
            className={`flex-shrink-0 grid place-items-center w-12 h-12 rounded-m3-full m3-state-layer ${blocked ? 'mx-attention' : ''}`}
            style={{ background: 'rgb(var(--mx-brand))', color: 'rgb(var(--mx-on-brand))' }}
            aria-label={playing ? t.pause : t.play}
          >
            {loading ? (
              <span className="m3-loading-arc" style={{ borderTopColor: 'currentColor', borderRightColor: 'currentColor' }} />
            ) : (
              <Icon name={playing ? 'pause' : 'play'} />
            )}
          </button>
        )}
      </section>
    )
  }

  return (
    <section aria-label={t.turntable} className="flex flex-col items-center">
      <div className="relative" style={{ width: 'min(76vw, 320px)', aspectRatio: '1' }}>
        <ProgressHalo progress={song ? progress : 0} />
        <m.div layoutId="turntable-record" transition={spring.spatialDefault} className="absolute inset-[6%]">
          <m.div
            className="w-full h-full"
            animate={{ scale: song ? 1 : 0.94, opacity: song ? 1 : 0.85 }}
            transition={spring.spatialDefault}
          >
            {record}
          </m.div>
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
            ) : song && audioRole !== 'silent' ? (
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
                aria-label={playing ? t.pause : t.play}
              >
                {loading ? (
                  <span className="m3-loading-arc" style={{ borderTopColor: 'currentColor', borderRightColor: 'currentColor' }} />
                ) : (
                  <Icon name={playing ? 'pause' : 'play'} size={32} />
                )}
              </m.button>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-4 h-6 text-label-lg text-md-on-surface-variant tabular" aria-live="polite">
        {song
          ? revealed
            ? ''
            : audioRole === 'silent'
              ? musicAt
                ? t.playingAt(musicAt, formatTime(position))
                : t.playingAtHost(formatTime(position))
              : blocked
                ? t.tapRecordToPlay
                : loading
                  ? t.loading
                  : `${formatTime(position)} / ${formatTime(duration)}`
          : ''}
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
            {drawLabel ?? t.drawSong}
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
