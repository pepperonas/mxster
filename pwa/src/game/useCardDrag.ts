/**
 * useCardDrag — one drag physics for the card being placed, whether it is
 * picked up from the dock or moved again from its gap on the board.
 *
 * Gap centres are measured on grab (page coordinates; every element with
 * `data-gap-index` counts, the waiting card itself included, so it can be
 * dropped back where it was). The page auto-scrolls when the pointer rests
 * near the top/bottom edge, and the target gap comes from
 * computeInsertionIndex (velocity projection + hysteresis). The card tilts
 * with its horizontal velocity. Phones feel the grab, each new target and the
 * drop (utils/haptics).
 */
import { useEffect, useRef, type RefObject } from 'react'
import { useMotionValue, useSpring, useTransform, useVelocity, type PanInfo } from 'motion/react'
import { computeInsertionIndex, isNearBoard, autoScrollSpeed } from './boardGeometry'
import { spring } from '@/motion/springs'
import { haptic } from '@/utils/haptics'

const EDGE_ZONE = 56
const EDGE_DWELL_MS = 350

/** Top edge for auto-scroll: below the sticky header and player bar. */
function stickyTop(): number {
  const bar = document.querySelector<HTMLElement>('[data-player-bar]')
  const bottom = bar?.getBoundingClientRect().bottom ?? 0
  return Math.max(64, bottom)
}

/** Bottom edge for auto-scroll: the top of the placement dock. */
function dockTop(): number {
  const dock = document.querySelector<HTMLElement>('[data-dock]')
  return dock ? dock.getBoundingClientRect().top : window.innerHeight - 140
}

export function pointerOf(event: PointerEvent | MouseEvent | TouchEvent): { x: number; y: number } {
  if ('touches' in event) {
    const t = event.touches[0] ?? event.changedTouches[0]
    return { x: t.clientX, y: t.clientY }
  }
  return { x: event.clientX, y: event.clientY }
}

interface CardDragOptions {
  boardRef: RefObject<HTMLOListElement | null>
  onHoverGap: (gap: number | null) => void
  /** Released over a gap. Not called when released away from the board. */
  onDrop: (gap: number) => void
  /** The gap the card already sits in (moving it again): not highlighted, no drop. */
  home?: number | null
}

export function useCardDrag({ boardRef, onHoverGap, onDrop, home = null }: CardDragOptions) {
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
      const shown = next === home ? null : next
      onHoverGap(shown)
      if (shown !== null) haptic('tick')
    }
  }

  const onDragStart = (event: PointerEvent | MouseEvent | TouchEvent) => {
    const geometry = measure()
    if (!geometry) return
    const point = pointerOf(event)
    // Measured on the page: Motion hands over a window-level event
    const edges = { top: stickyTop(), bottom: dockTop() }
    let armed = false
    let edgeSince: number | null = null
    haptic('grab')
    drag.current = { ...geometry, clientX: point.x, clientY: point.y, velocityY: 0, hover: home, raf: 0 }
    const tick = () => {
      const d = drag.current
      if (!d) return
      // A card from the dock starts inside the bottom edge zone: only scroll
      // once it has been lifted above the dock, and never while it is back
      // over the dock (that's the way to cancel).
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
    if (target !== null && target !== home) {
      haptic('drop')
      onDrop(target)
    }
  }

  useEffect(
    () => () => {
      if (drag.current) cancelAnimationFrame(drag.current.raf)
    },
    []
  )

  return { x, tilt, onDragStart, onDrag, onDragEnd }
}
