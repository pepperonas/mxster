/**
 * The record's motor: it spins up when the music starts and coasts to a stop
 * when it pauses, the way a turntable platter does — instead of jumping from
 * standstill to full speed and freezing mid-turn.
 *
 * The rotation stays the CSS animation in tailwind.css (`.vinyl`); this hook
 * only eases its playbackRate between 0 and 1 and keeps it running while the
 * platter still turns. Without the Web Animations API (tests, old browsers)
 * or with reduced motion it simply follows `spinning`, as before.
 */
import { useEffect, useState, type RefObject } from 'react'
import { prefersReducedMotion } from '@/motion/policy'

/** Spin-up and run-out times (ms). A platter starts quicker than it coasts. */
export const MOTOR = { upMs: 700, downMs: 1400 }

/** Speed at a moment of a ramp (0…1 progress): eased out, so it starts with a pull and settles. */
export function rampRate(from: number, to: number, t: number): number {
  const k = Math.min(1, Math.max(0, t))
  const eased = 1 - (1 - k) ** 3
  return from + (to - from) * eased
}

export function useRecordMotor(ref: RefObject<Element | null>, spinning: boolean): boolean {
  // What data-spinning says: true while the platter turns, including the run-out
  const [turning, setTurning] = useState(spinning)

  useEffect(() => {
    const el = ref.current as (Element & { getAnimations?: () => Animation[] }) | null
    const anim = el?.getAnimations?.()[0]
    if (!anim || prefersReducedMotion()) {
      setTurning(spinning)
      return
    }
    const from = turning ? anim.playbackRate : 0
    const to = spinning ? 1 : 0
    if (from === to) {
      setTurning(spinning)
      return
    }
    anim.playbackRate = from
    setTurning(true)
    const duration = spinning ? MOTOR.upMs : MOTOR.downMs
    const start = performance.now()
    let frame = 0
    const step = (now: number) => {
      const t = (now - start) / duration
      anim.playbackRate = rampRate(from, to, t)
      if (t < 1) frame = requestAnimationFrame(step)
      else if (!spinning) {
        // Stopped: pause where it is and leave the rate ready for the next start
        setTurning(false)
        anim.playbackRate = 1
      }
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
    // `turning` is read once per change of `spinning`, on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, ref])

  return turning
}
