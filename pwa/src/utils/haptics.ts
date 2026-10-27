/**
 * Subtle vibration on phones.
 *
 * Fixed, short patterns — a tap to feel, never a buzz. Silent without
 * `navigator.vibrate` (iPhones, desktop browsers), on devices with a fine
 * pointer (a laptop with a vibration API would still not need it) and when
 * the setting is off. The setting is mirrored here by SettingsProvider, so
 * the drag code and the feedback layer can call `haptic()` without a context.
 */

export type HapticKind = 'grab' | 'tick' | 'drop' | 'success' | 'miss' | 'win'

export const HAPTIC_PATTERNS: Record<HapticKind, number | number[]> = {
  grab: 8,
  tick: 5,
  drop: 10,
  success: [12, 50, 18],
  miss: 28,
  win: [15, 60, 15, 60, 30]
}

/** Ticks while dragging come at most this often. */
export const TICK_GAP_MS = 60

let enabled = true
let lastTick = -Infinity

export function setHapticsEnabled(on: boolean): void {
  enabled = on
}

/** Can this device vibrate at all (decides whether the setting is shown)? */
export function canVibrate(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(pointer: coarse)').matches
}

export function haptic(kind: HapticKind, now: number = performance.now()): boolean {
  if (!enabled || !canVibrate()) return false
  if (kind === 'tick') {
    if (now - lastTick < TICK_GAP_MS) return false
    lastTick = now
  }
  try {
    return navigator.vibrate(HAPTIC_PATTERNS[kind])
  } catch {
    return false
  }
}

/** Tests only. */
export function resetHaptics(): void {
  enabled = true
  lastTick = -Infinity
}
