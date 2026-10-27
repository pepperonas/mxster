/**
 * PlacementDock — the bottom sheet of the timeline modes.
 *
 * States (crossfaded with a layout spring):
 *  - placing: the song card lives here. Drag it onto the board, or tap a gap
 *    on the board. Dropping/tapping puts the card into the gap as a preview;
 *    one confirm places it (a wrong drop costs a card, so no fling-to-commit).
 *  - challenge-offer: the card lies face down; others may object (Einspruch)
 *    or it is turned over.
 *  - challenge-choose: the objecting player taps another gap and confirms.
 *  - revealed: the verdict with cover, year, progress and the song's fact;
 *    "Nächster Spieler".
 *  - bot: the bot is thinking.
 *
 * Drag physics: the card tilts with its horizontal velocity (spring-smoothed),
 * lifts on grab, snaps back to the dock if released away from the board.
 * Gap centres are measured on grab (page coordinates), the page auto-scrolls
 * when the pointer nears the top/bottom edge, and the target gap comes from
 * computeInsertionIndex (velocity projection + hysteresis).
 */
import { useEffect, useRef, type RefObject } from 'react'
import { AnimatePresence, m, useMotionValue, useSpring, useTransform, useVelocity, type PanInfo } from 'motion/react'
import type { Song } from '@/types'
import { computeInsertionIndex, isNearBoard, autoScrollSpeed } from '@/game/boardGeometry'
import { spring } from '@/motion/springs'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { pendingCardLayoutId } from './TimelineBoard'
import { PositionStrip } from './PositionStrip'
import { Icon } from '@/components/ui/Icon'
import { SongCover, SongInfo } from './SongInfo'

const EDGE_ZONE = 56
const EDGE_DWELL_MS = 350

/** Top edge for auto-scroll: below the sticky header and player bar. */
function stickyTop(): number {
  const bar = document.querySelector<HTMLElement>('[data-player-bar]')
  const bottom = bar?.getBoundingClientRect().bottom ?? 0
  return Math.max(64, bottom)
}

export interface DockChallenger {
  seat: number
  name: string
  left: number
}

export type DockState =
  | { kind: 'placing'; song: Song; previewGap: number | null; timeline: Song[] }
  | { kind: 'challenge-offer'; placerName: string; challengers: DockChallenger[]; timeline: Song[]; gap: number }
  | { kind: 'challenge-choose'; challengerName: string; previewGap: number | null; timeline: Song[] }
  | {
      kind: 'revealed'
      song: Song
      isCorrect: boolean
      isFirstCard: boolean
      cards: number
      playerName: string
      challenge: { name: string; won: boolean } | null
      /** Wrong card: where it would have belonged ("Zwischen 1991 und 2003"). */
      rightPlace?: string
    }
  | { kind: 'bot'; playerName: string }

interface PlacementDockProps {
  state: DockState | null
  boardRef: RefObject<HTMLOListElement | null>
  onHoverGap: (gap: number | null) => void
  onPreview: (gap: number | null) => void
  onConfirm: () => void
  onContinue: () => void
  onChallenge?: (seat: number) => void
  onCancelChallenge?: () => void
  onReveal?: () => void
  /** Total cards needed to win (display only). */
  goal?: number
}

export function PlacementDock({
  state,
  boardRef,
  onHoverGap,
  onPreview,
  onConfirm,
  onContinue,
  onChallenge,
  onCancelChallenge,
  onReveal,
  goal = 10
}: PlacementDockProps) {
  const stateKey = !state
    ? 'none'
    : state.kind === 'placing' || state.kind === 'challenge-choose'
      ? `${state.kind}-${state.previewGap === null ? 'pick' : 'confirm'}`
      : state.kind

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
      <div className="mx-auto max-w-3xl px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <AnimatePresence mode="popLayout" initial={false}>
          {state && (
            <m.section
              key={stateKey}
              layout
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24, transition: spring.effectsDefault }}
              transition={spring.spatialDefault}
              className="pointer-events-auto rounded-m3-xl bg-md-surface-container-high/95 backdrop-blur-md border border-md-outline-variant/60 shadow-m3-3 p-3 sm:p-4"
              aria-label="Karte platzieren"
            >
              {state.kind === 'placing' && state.previewGap === null && (
                <DragStage song={state.song} boardRef={boardRef} onHoverGap={onHoverGap} onDrop={onPreview} />
              )}
              {state.kind === 'placing' && state.previewGap !== null && (
                <ConfirmStage
                  timeline={state.timeline}
                  gap={state.previewGap}
                  onBack={() => onPreview(null)}
                  onConfirm={onConfirm}
                />
              )}
              {state.kind === 'challenge-offer' && (
                <ChallengeOfferStage state={state} onChallenge={(seat) => onChallenge?.(seat)} onReveal={() => onReveal?.()} />
              )}
              {state.kind === 'challenge-choose' && state.previewGap === null && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <p className="flex-1 text-title-sm text-md-on-surface">
                    <span className="block text-label-md text-md-on-surface-variant">Einspruch von {state.challengerName}</span>
                    Wohin gehört der Song? Tippe eine Lücke an.
                  </p>
                  <button type="button" onClick={() => onCancelChallenge?.()} className="btn btn-text">
                    Doch kein Einspruch
                  </button>
                </div>
              )}
              {state.kind === 'challenge-choose' && state.previewGap !== null && (
                <ConfirmStage
                  title={`Einspruch von ${state.challengerName}`}
                  tone="tertiary"
                  timeline={state.timeline}
                  gap={state.previewGap}
                  confirmText="Einspruch einlegen"
                  onBack={() => onPreview(null)}
                  onConfirm={onConfirm}
                />
              )}
              {state.kind === 'revealed' && <ResultStage state={state} goal={goal} onContinue={onContinue} />}
              {state.kind === 'bot' && <BotStage name={state.playerName} />}
            </m.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── drag ──────────────────────────────────────────────────────────────────

interface DragStageProps {
  song: Song
  boardRef: RefObject<HTMLOListElement | null>
  onHoverGap: (gap: number | null) => void
  onDrop: (gap: number) => void
}

function DragStage({ song, boardRef, onHoverGap, onDrop }: DragStageProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const xVelocity = useVelocity(x)
  const tilt = useSpring(useTransform(xVelocity, [-1600, 1600], [-9, 9], { clamp: true }), spring.spatialFast)

  const drag = useRef<{
    centres: number[]
    board: { left: number; right: number; top: number; bottom: number }
    clientX: number
    clientY: number
    velocityY: number
    hover: number | null
    raf: number
  } | null>(null)

  const measure = () => {
    const board = boardRef.current
    if (!board) return null
    const sx = window.scrollX
    const sy = window.scrollY
    const centres = Array.from(board.querySelectorAll<HTMLElement>('[data-gap-index]'))
      .sort((a, b) => Number(a.dataset.gapIndex) - Number(b.dataset.gapIndex))
      .map((el) => {
        const r = el.getBoundingClientRect()
        return r.top + r.height / 2 + sy
      })
    const r = board.getBoundingClientRect()
    return { centres, board: { left: r.left + sx, right: r.right + sx, top: r.top + sy, bottom: r.bottom + sy } }
  }

  const resolveHover = () => {
    const d = drag.current
    if (!d) return null
    const pageX = d.clientX + window.scrollX
    const pageY = d.clientY + window.scrollY
    if (!isNearBoard(d.board, pageX, pageY)) return null
    return computeInsertionIndex({ centres: d.centres, pointer: pageY, velocity: d.velocityY, current: d.hover })
  }

  const updateHover = () => {
    const d = drag.current
    if (!d) return
    const next = resolveHover()
    if (next !== d.hover) {
      d.hover = next
      onHoverGap(next)
    }
  }

  const onDragStart = (event: PointerEvent | MouseEvent | TouchEvent) => {
    const geometry = measure()
    if (!geometry) return
    const point = pointerOf(event)
    // Measured on our own element: Motion hands over a window-level event
    const dockEl = stageRef.current?.closest('section')
    const edges = { top: stickyTop(), bottom: dockEl ? dockEl.getBoundingClientRect().top : window.innerHeight - 140 }
    let armed = false
    let edgeSince: number | null = null
    // The gesture gets the main thread: the WebGL background steps down
    drag.current = { ...geometry, clientX: point.x, clientY: point.y, velocityY: 0, hover: null, raf: 0 }
    const tick = () => {
      const d = drag.current
      if (!d) return
      // The card starts inside the dock, i.e. inside the bottom edge zone: only
      // scroll once it has been lifted above the dock, and never while it is
      // back over the dock (that's the way to cancel).
      if (d.clientY < edges.bottom - 8) armed = true
      const raw = armed && d.clientY <= edges.bottom ? autoScrollSpeed(d.clientY, edges.top, edges.bottom, EDGE_ZONE) : 0
      // Only scroll after the card rests at an edge for a moment: aiming at a
      // gap right next to the dock must not run the page away.
      const now = performance.now()
      if (raw === 0) edgeSince = null
      else if (edgeSince === null) edgeSince = now
      const speed = raw !== 0 && edgeSince !== null && now - edgeSince > EDGE_DWELL_MS ? raw : 0
      if (speed !== 0) {
        window.scrollBy(0, speed)
        updateHover()
      }
      d.raf = requestAnimationFrame(tick)
    }
    drag.current.raf = requestAnimationFrame(tick)
  }

  const onDrag = (event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    const d = drag.current
    if (!d) return
    const point = pointerOf(event)
    d.clientX = point.x
    d.clientY = point.y
    d.velocityY = info.velocity.y
    updateHover()
  }

  const onDragEnd = () => {
    const d = drag.current
    if (!d) return
    cancelAnimationFrame(d.raf)
    const target = resolveHover()
    drag.current = null
    onHoverGap(null)
    if (target !== null) onDrop(target)
  }

  useEffect(
    () => () => {
      if (drag.current) {
        cancelAnimationFrame(drag.current.raf)
      }
    },
    []
  )

  return (
    <div ref={stageRef} className="flex flex-col gap-2">
      <m.div
        layoutId={pendingCardLayoutId(song.id)}
        drag
        dragSnapToOrigin
        dragElastic={0.18}
        dragTransition={{ bounceStiffness: 380, bounceDamping: 26 }}
        onDragStart={onDragStart}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
        whileDrag={{ scale: 1.05, boxShadow: 'var(--md-sys-elevation-4)', zIndex: 50 }}
        style={{ x, rotate: tilt }}
        transition={spring.spatialDefault}
        className="relative flex items-center gap-3 min-h-[56px] px-3 py-1.5 rounded-m3-lg border-2 border-md-primary bg-md-primary-container text-md-on-primary-container touch-none select-none cursor-grab active:cursor-grabbing"
        aria-label={`${song.title} von ${song.artist} — ziehe die Karte auf die Zeitleiste oder tippe eine Lücke`}
        role="group"
      >
        <span className="flex-shrink-0 w-[4.25rem] h-10 grid place-items-center rounded-m3-md bg-md-surface-container-highest text-title-md text-md-on-surface-variant tabular-nums">
          ????
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-title-sm truncate">{song.title}</span>
          <span className="block text-body-sm opacity-80 truncate">{song.artist}</span>
        </span>
        <GripIcon />
      </m.div>
      <p className="text-center text-body-sm text-md-on-surface-variant">Karte in eine Lücke ziehen oder Lücke antippen</p>
    </div>
  )
}

function pointerOf(event: PointerEvent | MouseEvent | TouchEvent): { x: number; y: number } {
  if ('touches' in event) {
    const t = event.touches[0] ?? event.changedTouches[0]
    return { x: t.clientX, y: t.clientY }
  }
  return { x: event.clientX, y: event.clientY }
}

function GripIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="flex-shrink-0 opacity-70">
      {[6, 12, 18].map((y) => (
        <g key={y}>
          <circle cx="9" cy={y} r="1.6" />
          <circle cx="15" cy={y} r="1.6" />
        </g>
      ))}
    </svg>
  )
}

// ─── confirm ───────────────────────────────────────────────────────────────

function ConfirmStage({
  timeline,
  gap,
  onBack,
  onConfirm,
  title = 'Platzieren – oder andere Lücke antippen',
  confirmText = 'Hier platzieren',
  tone = 'primary'
}: {
  timeline: Song[]
  gap: number
  onBack: () => void
  onConfirm: () => void
  title?: string
  confirmText?: string
  tone?: 'primary' | 'tertiary'
}) {
  const confirmRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    confirmRef.current?.focus({ preventScroll: true })
  }, [gap])

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0 space-y-2">
        <p className="text-label-md text-md-on-surface-variant">{title}</p>
        <PositionStrip timeline={timeline} gap={gap} tone={tone} />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onBack} className="btn btn-text flex-1 sm:flex-none">
          Zurück
        </button>
        <button ref={confirmRef} type="button" onClick={onConfirm} className="btn btn-brand flex-1 sm:flex-none">
          {confirmText}
        </button>
      </div>
    </div>
  )
}

// ─── challenge ─────────────────────────────────────────────────────────────

function ChallengeOfferStage({
  state,
  onChallenge,
  onReveal
}: {
  state: Extract<DockState, { kind: 'challenge-offer' }>
  onChallenge: (seat: number) => void
  onReveal: () => void
}) {
  const revealRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    revealRef.current?.focus({ preventScroll: true })
  }, [])
  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-2">
        <p className="text-title-md text-md-on-surface">{state.placerName} hat gelegt</p>
        <PositionStrip timeline={state.timeline} gap={state.gap} />
        <p className="text-body-sm text-md-on-surface-variant">Liegt die Karte falsch? Wer widerspricht, legt sie woandershin.</p>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Einspruch einlegen">
        {state.challengers.map((c) => (
          <button
            key={c.seat}
            type="button"
            className="chip m3-state-layer"
            onClick={() => onChallenge(c.seat)}
            aria-label={`${c.name} legt Einspruch ein, noch ${c.left} übrig`}
          >
            <Icon name="hand" size={18} />
            {c.name}
            <ChallengeDots left={c.left} />
          </button>
        ))}
      </div>
      <button ref={revealRef} type="button" onClick={onReveal} className="btn btn-brand">
        Kein Einspruch – aufdecken
      </button>
    </div>
  )
}

/** Remaining objections as small filled dots (max three). */
export function ChallengeDots({ left, max = 3 }: { left: number; max?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < left ? 'bg-current' : 'bg-current opacity-25'}`} />
      ))}
    </span>
  )
}

// ─── result ────────────────────────────────────────────────────────────────

function verdictText(state: Extract<DockState, { kind: 'revealed' }>): { title: string; detail?: string; good: boolean } {
  const { isFirstCard, isCorrect, challenge } = state
  if (isFirstCard) return { title: 'Startkarte gelegt', good: true }
  if (!challenge)
    return isCorrect
      ? { title: 'Richtig platziert!', good: true }
      : { title: 'Leider falsch', detail: state.rightPlace ? `Richtig wäre: ${state.rightPlace}.` : undefined, good: false }
  if (isCorrect) return { title: 'Richtig platziert!', detail: `Der Einspruch von ${challenge.name} war daneben.`, good: true }
  if (challenge.won) return { title: 'Einspruch erfolgreich!', detail: `${challenge.name} bekommt die Karte.`, good: true }
  return { title: 'Beide daneben', detail: 'Die Karte bekommt niemand.', good: false }
}

function ResultStage({
  state,
  goal,
  onContinue
}: {
  state: Extract<DockState, { kind: 'revealed' }>
  goal: number
  onContinue: () => void
}) {
  const nextRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true })
  }, [])
  const { isCorrect, song, cards, playerName } = state
  const verdict = verdictText(state)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="relative flex-shrink-0">
            <SongCover song={song} size={52} />
            <m.span
              initial={{ scale: 0.4, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={spring.spatialFast}
              className={`absolute -right-1.5 -bottom-1.5 w-6 h-6 grid place-items-center rounded-m3-full ring-2 ring-md-surface-container-high ${
                verdict.good ? 'bg-md-success-container text-md-on-success-container' : 'bg-md-error-container text-md-on-error-container'
              }`}
              aria-hidden="true"
            >
              {verdict.good ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M7 7l10 10M17 7L7 17" />
                </svg>
              )}
            </m.span>
          </span>
          <div className="min-w-0">
            <p className="text-title-md text-md-on-surface">{verdict.title}</p>
            <p className="text-body-sm text-md-on-surface-variant truncate">
              {song.title} – {song.artist} · <span className="tabular-nums">{song.year}</span>
            </p>
            {verdict.detail && <p className="text-body-sm text-md-on-surface">{verdict.detail}</p>}
            {!state.challenge?.won && (
              <p className="text-body-sm text-md-on-surface-variant tabular-nums">
                {playerName}: <AnimatedNumber value={cards} from={isCorrect ? cards - 1 : cards} />/{goal}
              </p>
            )}
          </div>
        </div>
        <button ref={nextRef} type="button" onClick={onContinue} className="btn btn-brand">
          Weiter
        </button>
      </div>
      <SongInfo song={song} head="none" delay={0.2} />
    </div>
  )
}

// ─── bot ───────────────────────────────────────────────────────────────────

function BotStage({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-2 text-title-sm text-md-on-surface">
      <Icon name="bot" size={20} />
      <span>{name} überlegt</span>
      <span className="flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <m.span
            key={i}
            className="w-1.5 h-1.5 rounded-m3-full bg-current"
            animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </span>
    </div>
  )
}
