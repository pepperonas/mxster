/**
 * How the background waves swell with the music, as numbers (pure, tested).
 *
 * `energy` (0 = silence, 1 = playing) follows the music with a critically
 * damped spring: it starts from rest without a jolt, glides up when a song
 * starts and settles down more slowly when it pauses — no overshoot, no step.
 * The pulse is a sine whose depth is scaled by the energy, so it fades in and
 * out with the swell instead of switching on and off.
 */

/** Height of the waves at rest (scaleY). */
export const REST = 0.75
/** Extra height while playing, and how much the pulse adds on top. */
export const LIFT = 0.35
export const PULSE = 0.25
/** One pulse, in seconds. */
export const PULSE_S = 2.4
/** Spring stiffness (rad/s): rising ≈ 1.5 s, falling ≈ 2.5 s to settle. */
export const RISE_W = 3.2
export const FALL_W = 2
/** Longest step the spring takes (a background tab resumes calmly). */
export const MAX_DT = 0.1

export interface SwellState {
  energy: number
  velocity: number
  /** Pulse phase, 0–1. */
  phase: number
}

export const AT_REST: SwellState = { energy: 0, velocity: 0, phase: 0 }

/** One step of `dt` seconds towards `target` (0 or 1). */
export function stepSwell(s: SwellState, target: number, dt: number): SwellState {
  const t = Math.min(Math.max(dt, 0), MAX_DT)
  const w = target > s.energy ? RISE_W : FALL_W
  const accel = w * w * (target - s.energy) - 2 * w * s.velocity
  const velocity = s.velocity + accel * t
  let energy = s.energy + velocity * t
  energy = Math.min(1, Math.max(0, energy))
  const phase = (s.phase + t / PULSE_S) % 1
  return { energy, velocity, phase }
}

/** Settled: close enough to the target and nearly still — the loop may stop. */
export function settled(s: SwellState, target: number): boolean {
  return Math.abs(s.energy - target) < 0.001 && Math.abs(s.velocity) < 0.002
}

/** scaleY of the waves. */
export function swellScale(s: SwellState): number {
  const pulse = 0.5 - 0.5 * Math.cos(2 * Math.PI * s.phase)
  return REST + s.energy * (LIFT + PULSE * pulse)
}
