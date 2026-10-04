/**
 * Drag-to-gap geometry (pure).
 *
 * Gap centres are measured once when a drag starts (page coordinates, layout
 * without any gap opened), so the computation never chases a layout that it
 * changes itself. The pointer position is projected a little along its
 * velocity so a deliberate flick lands where it is heading — clamped to one
 * row, because a wrong drop costs the player a card.
 */

/** How far ahead (seconds) the release velocity projects the pointer. */
export const PROJECTION_S = 0.12
/** A new gap must be this much closer than the current one to take over. */
export const HYSTERESIS_PX = 8

export interface InsertionInput {
  /** Gap centres along the board axis, page coordinates, ascending. */
  centres: number[]
  /** Pointer position along the same axis (page coordinates). */
  pointer: number
  /** Pointer velocity along the axis (px/s). */
  velocity?: number
  /** Gap currently highlighted (for hysteresis). */
  current?: number | null
  /** Typical distance between gap centres — caps the projection. */
  rowSize?: number
}

export function computeInsertionIndex({
  centres,
  pointer,
  velocity = 0,
  current = null,
  rowSize
}: InsertionInput): number | null {
  if (centres.length === 0) return null
  const step = rowSize ?? (centres.length > 1 ? (centres[centres.length - 1] - centres[0]) / (centres.length - 1) : 0)
  const reach = velocity * PROJECTION_S
  const projected = pointer + (step > 0 ? Math.max(-step, Math.min(step, reach)) : 0)

  let best = 0
  let bestDist = Infinity
  centres.forEach((c, i) => {
    const d = Math.abs(c - projected)
    if (d < bestDist) {
      best = i
      bestDist = d
    }
  })

  if (current !== null && current !== best && current >= 0 && current < centres.length) {
    const currentDist = Math.abs(centres[current] - projected)
    if (currentDist - bestDist < HYSTERESIS_PX) return current
  }
  return best
}

export interface Rect {
  left: number
  right: number
  top: number
  bottom: number
}

/** Is the pointer close enough to the board for a drop to count? */
export function isNearBoard(rect: Rect, x: number, y: number, margin = 48): boolean {
  return x >= rect.left - margin && x <= rect.right + margin && y >= rect.top - margin && y <= rect.bottom + margin
}

/**
 * Edge auto-scroll speed (px per frame) for a pointer near the top/bottom of
 * the scrollable area: quadratic ramp inside the edge zone, capped.
 */
export function autoScrollSpeed(pointerY: number, top: number, bottom: number, zone = 72, max = 18): number {
  if (pointerY < top + zone) {
    const t = Math.min(1, (top + zone - pointerY) / zone)
    return -Math.round(max * t * t)
  }
  if (pointerY > bottom - zone) {
    const t = Math.min(1, (pointerY - (bottom - zone)) / zone)
    return Math.round(max * t * t)
  }
  return 0
}
