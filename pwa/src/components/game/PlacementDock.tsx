/**
 * PlacementDock — the bottom sheet of the timeline modes.
 *
 * States (crossfaded with a layout spring):
 *  - placing: the song card lives here. Drag it onto the board, or tap a gap
 *    on the board. Dropping/tapping puts the card into the gap as a preview;
 *    one confirm places it (a wrong drop costs a card, so no fling-to-commit).
 *  - revealed: the verdict with the year and the progress; "Nächster Spieler".
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
import { gapLabel } from '@/game/placement'
import { spring } from '@/motion/springs'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { PENDING_CARD_LAYOUT_ID } from './TimelineBoard'
import { quietBackground } from '@/motion/backgroundControl'

const ACTION_BAR_HEIGHT = 64

export type DockState =
  | { kind: 'placing'; song: Song; previewGap: number | null; timeline: Song[] }
  | { kind: 'revealed'; song: Song; isCorrect: boolean; isFirstCard: boolean; cards: number; playerName: string }
  | { kind: 'bot'; playerName: string }

interface PlacementDockProps {
  state: DockState | null
  boardRef: RefObject<HTMLOListElement | null>
  onHoverGap: (gap: number | null) => void
  onPreview: (gap: number | null) => void
  onConfirm: () => void
  onContinue: () => void
  /** Total cards needed to win (display only). */
  goal?: number
}

export function PlacementDock({ state, boardRef, onHoverGap, onPreview, onConfirm, onContinue, goal = 10 }: PlacementDockProps) {
  const stateKey = !state
    ? 'none'
    : state.kind === 'placing'
      ? state.previewGap === null
        ? 'drag'
        : 'confirm'
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
                  label={gapLabel(state.timeline, state.previewGap)}
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
    release: () => void
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
    // The gesture gets the main thread: the WebGL background steps down
    drag.current = { ...geometry, clientX: point.x, clientY: point.y, velocityY: 0, hover: null, raf: 0, release: quietBackground('drag') }
    const tick = () => {
      const d = drag.current
      if (!d) return
      const dockTop = window.innerHeight - 140
      const speed = autoScrollSpeed(d.clientY, ACTION_BAR_HEIGHT, dockTop)
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
    d.release()
    const target = resolveHover()
    drag.current = null
    onHoverGap(null)
    if (target !== null) onDrop(target)
  }

  useEffect(
    () => () => {
      if (drag.current) {
        cancelAnimationFrame(drag.current.raf)
        drag.current.release()
      }
    },
    []
  )

  return (
    <div className="flex flex-col gap-2">
      <m.div
        layoutId={PENDING_CARD_LAYOUT_ID}
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
        className="relative flex items-center gap-3 min-h-[64px] px-3 py-2 rounded-m3-lg border-2 border-md-primary bg-md-primary-container text-md-on-primary-container touch-none select-none cursor-grab active:cursor-grabbing"
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
      <p className="text-center text-body-sm text-md-on-surface-variant">
        Ziehe die Karte in die richtige Lücke – oder tippe eine Lücke an.
      </p>
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

function ConfirmStage({ label, onBack, onConfirm }: { label: string; onBack: () => void; onConfirm: () => void }) {
  const confirmRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    confirmRef.current?.focus({ preventScroll: true })
  }, [label])

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <p className="flex-1 text-title-sm text-text-primary">
        <span className="block text-label-md text-md-on-surface-variant">Platzieren</span>
        {label}
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={onBack} className="btn btn-txt flex-1 sm:flex-none">
          Zurück
        </button>
        <button ref={confirmRef} type="button" onClick={onConfirm} className="btn btn-accent flex-1 sm:flex-none">
          Hier platzieren
        </button>
      </div>
    </div>
  )
}

// ─── result ────────────────────────────────────────────────────────────────

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
  const { isCorrect, isFirstCard, song, cards, playerName } = state

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <m.span
          initial={{ scale: 0.4, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={spring.spatialFast}
          className={`flex-shrink-0 w-11 h-11 grid place-items-center rounded-m3-full ${
            isCorrect ? 'bg-md-success-container text-md-on-success-container' : 'bg-md-error-container text-md-on-error-container'
          }`}
          aria-hidden="true"
        >
          {isCorrect ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <path d="M7 7l10 10M17 7L7 17" />
            </svg>
          )}
        </m.span>
        <div className="min-w-0">
          <p className="text-title-md text-text-primary">
            {isFirstCard ? 'Startkarte gelegt' : isCorrect ? 'Richtig platziert!' : 'Leider falsch'}
          </p>
          <p className="text-body-sm text-md-on-surface-variant truncate">
            {song.title} · <span className="tabular-nums">{song.year}</span>
            {' · '}
            {playerName}: <AnimatedNumber value={cards} from={isCorrect ? cards - 1 : cards} />/{goal} Karten
          </p>
        </div>
      </div>
      <button ref={nextRef} type="button" onClick={onContinue} className="btn btn-accent">
        Nächster Spieler
      </button>
    </div>
  )
}

// ─── bot ───────────────────────────────────────────────────────────────────

function BotStage({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-2 text-title-sm text-text-primary">
      <span aria-hidden="true">🤖</span>
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
