/**
 * Online objection window (pure).
 *
 * After a card is placed, everyone allowed to object either objects or taps
 * "Kein Einspruch"; once nobody is left to wait for, or the countdown runs
 * out, the host's device turns the card over. Nobody — not the placer, not
 * the host — can turn it over early for the others. (On one device the group
 * at the table decides, so there the old reveal button stays.)
 *
 * Times are server times (ms), so every device shows the same countdown.
 */
import type { PendingPlacement } from './turn'

export const OBJECTION_WINDOW_MS = 10_000

/** Who may still object: allowed, has not passed, is not away. */
export function waitingOn(pending: PendingPlacement, absent: readonly number[] = []): number[] {
  const passed = pending.passed ?? []
  return pending.challengers.filter((i) => !passed.includes(i) && !absent.includes(i))
}

export type WindowStep = 'none' | 'start' | 'reveal'

/** What the host's device does next with an open objection window. */
export function windowStep(pending: PendingPlacement | null, absent: readonly number[], serverNow: number): WindowStep {
  if (!pending || pending.choosing !== null || pending.claim) return 'none'
  if (waitingOn(pending, absent).length === 0) return 'reveal'
  if (pending.deadlineAt == null) return 'start'
  return serverNow >= pending.deadlineAt ? 'reveal' : 'none'
}

/** Whole seconds left on the countdown (0 when it has run out). */
export function secondsLeft(deadlineAt: number | null | undefined, serverNow: number): number | null {
  if (deadlineAt == null) return null
  return Math.max(0, Math.ceil((deadlineAt - serverNow) / 1000))
}
