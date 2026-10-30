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
 *
 * Motion adds window scroll to the drag offset (right for a card in the page
 * flow, which scrolls with the page). The dock card sits in a fixed dock and
 * does not move with the page, so it drifted away from the pointer while the
 * page auto-scrolled — and not even by the scrolled distance (measured: 448 px
 * offset for 368 px of scroll). `fixed` cards therefore get `shift`, a
 * counter-offset for a wrapper that keeps the card exactly where the pointer
 * moved it: shift = pointer travel − Motion's offset (`y`, which the card must
 * take as its style).
 */
import { useEffect, useRef, type RefObject } from 'react'
import { animate, useMotionValue, useSpring, useTransform, useVelocity, type PanInfo } from 'motion/react'
import { computeInsertionIndex, isNearBoard, edgeScrollRaw, edgeScrollStep } from './boardGeometry'
import { dragReturn, spring } from '@/motion/springs'
import { haptic } from '@/utils/haptics'

/** Depth of the edge zone (px): only the last strip before an edge scrolls. */
export const EDGE_ZONE = 44

/**
 * Top edge for auto-scroll: below the sticky header, and below the player bar
 * only while that bar is stuck to the top. A bar in the normal flow sits
 * somewhere on the page — taken as the edge, the page ran upwards as soon as
 * the card moved up a little.
 */
export function stickyTop(): number {
  const header = 64
  const bar = document.querySelector<HTMLElement>('[data-player-bar]')
  if (!bar || getComputedStyle(bar).position !== 'sticky') return header
  const rect = bar.getBoundingClientRect()
  // stuck = sitting at its sticky offset right under the header
  return rect.top <= header + 1 ? Math.max(header, rect.bottom) : header
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
  /** The card sits in a fixed container (the dock): counter Motion's scroll compensation. */
  fixed?: boolean
}

/** Counter-offset for a card in a fixed container: what Motion's offset adds beyond the pointer's travel. */
export function fixedShift(pointerTravel: number, motionOffset: number): number {
  return pointerTravel - motionOffset
}

export function useCardDrag({ boardRef, onHoverGap, onDrop, home = null, fixed = false }: CardDragOptions) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const shift = useMotionValue(0)
  const unfollow = useRef<(() => void) | null>(null)
  const followRef = useRef<(() => void) | null>(null)
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
    let edgeDir = 0
    let lastFrame = 0
    let carry = 0
    haptic('grab')
    if (fixed) {
      unfollow.current?.()
      shift.stop()
      // where the card shows now (a snap-back may still be under way)
      const startVisual = y.get() + shift.get()
      const startY = point.y
      const follow = () => {
        const d = drag.current
        if (d) shift.set(fixedShift(startVisual + d.clientY - startY, y.get()))
      }
      unfollow.current = y.on('change', follow)
      followRef.current = follow
    }
    drag.current = { ...geometry, clientX: point.x, clientY: point.y, velocityY: 0, hover: home, raf: 0 }
    const tick = () => {
      const d = drag.current
      if (!d) return
      // A card from the dock starts inside the bottom edge zone: only scroll
      // once it has been lifted above the dock; after that the dock itself
      // counts as the bottom edge (see edgeScrollRaw)
      if (d.clientY < edges.bottom - 8) armed = true
      const raw = edgeScrollRaw(d.clientY, edges.top, edges.bottom, armed, EDGE_ZONE)
      // Only scroll after the card rests at an edge for a moment, then ease in
      // (time-based): aiming at a gap near an edge must not run the page away.
      const now = performance.now()
      if (raw === 0 || (edgeDir !== 0 && Math.sign(raw) !== edgeDir)) edgeSince = null
      if (raw !== 0 && edgeSince === null) edgeSince = now
      edgeDir = Math.sign(raw)
      const speed = edgeScrollStep(raw, edgeSince === null ? 0 : now - edgeSince, lastFrame ? now - lastFrame : 0)
      lastFrame = now
      carry = speed === 0 ? 0 : carry + speed
      const whole = Math.trunc(carry)
      if (whole !== 0) {
        carry -= whole
        window.scrollBy(0, whole)
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
    followRef.current?.()
    updateHover()
  }

  const onDragEnd = () => {
    const d = drag.current
    if (!d) return
    cancelAnimationFrame(d.raf)
    if (fixed) {
      unfollow.current?.()
      unfollow.current = null
      followRef.current = null
      // springs home together with the card (dragSnapToOrigin)
      animate(shift, 0, { type: 'spring', stiffness: dragReturn.bounceStiffness, damping: dragReturn.bounceDamping })
    }
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
      unfollow.current?.()
    },
    []
  )

  return { x, y, shift, tilt, onDragStart, onDrag, onDragEnd }
}
