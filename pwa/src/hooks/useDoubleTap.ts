/**
 * A double tap that works the same with a finger and a mouse. `dblclick` is
 * not reliable on touch screens, so taps are timed by hand from pointerup:
 * two taps of the same pointer type within DOUBLE_TAP_MS and DOUBLE_TAP_PX.
 * A tap that ended a drag or a scroll never counts (the pointer moved).
 */
import { useRef, type PointerEvent } from 'react'

export const DOUBLE_TAP_MS = 320
export const DOUBLE_TAP_PX = 24
/** A finger that moved further than this between down and up was dragging or scrolling, not tapping. */
export const TAP_SLOP_PX = 10

export interface Tap {
  t: number
  x: number
  y: number
  type: string
}

export function isDoubleTap(prev: Tap | null, next: Tap): boolean {
  if (!prev || prev.type !== next.type) return false
  const dt = next.t - prev.t
  return dt >= 0 && dt <= DOUBLE_TAP_MS && Math.hypot(next.x - prev.x, next.y - prev.y) <= DOUBLE_TAP_PX
}

export function useDoubleTap(onDoubleTap: (() => void) | undefined) {
  const last = useRef<Tap | null>(null)
  const down = useRef<{ x: number; y: number } | null>(null)
  if (!onDoubleTap) return {}
  return {
    onPointerDown: (e: PointerEvent) => {
      down.current = { x: e.clientX, y: e.clientY }
    },
    onPointerUp: (e: PointerEvent) => {
      const start = down.current
      down.current = null
      if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > TAP_SLOP_PX) {
        last.current = null
        return
      }
      const tap = { t: e.timeStamp, x: e.clientX, y: e.clientY, type: e.pointerType }
      if (isDoubleTap(last.current, tap)) {
        last.current = null
        onDoubleTap()
      } else last.current = tap
    }
  }
}
