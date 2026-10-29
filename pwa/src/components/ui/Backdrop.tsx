/**
 * The background: a few fine sound waves along the lower part of the screen,
 * drifting sideways at different speeds (CSS). While a song plays (see
 * useBackdropPlaying) they swell and pulse gently; the swell follows a spring
 * (backdropSwell.ts), so it glides in on play and settles on pause instead of
 * jumping. Only transform changes; the paths are built once and repeat
 * seamlessly (each path covers two periods and slides by one).
 */
import { useEffect, useRef, type CSSProperties } from 'react'
import { isBackdropPlaying, subscribeBackdropPlaying } from '@/hooks/useBackdropPlaying'
import { prefersReducedMotion } from '@/motion/policy'
import { AT_REST, settled, stepSwell, swellScale, type SwellState } from './backdropSwell'

const PERIOD = 1200
const HEIGHT = 200

interface Wave {
  /** [harmonic, amplitude, phase] — harmonics are whole numbers, so the wave repeats every PERIOD */
  parts: [number, number, number][]
  y: number
  tone: 'ink' | 'brand' | 'warm'
}

const WAVES: Wave[] = [
  { parts: [[2, 26, 0], [5, 9, 1.1], [9, 4, 2.3]], y: 70, tone: 'ink' },
  { parts: [[3, 22, 0.8], [7, 7, 0.2]], y: 96, tone: 'brand' },
  { parts: [[1, 30, 2.1], [4, 10, 0.5], [11, 3, 1.7]], y: 118, tone: 'ink' },
  { parts: [[2, 18, 1.6], [6, 8, 2.9]], y: 140, tone: 'warm' },
  { parts: [[3, 14, 0.3], [8, 5, 1.2]], y: 160, tone: 'ink' }
]

export function wavePath({ parts, y }: Pick<Wave, 'parts' | 'y'>): string {
  const step = 12
  const pts: string[] = []
  for (let x = 0; x <= PERIOD * 2; x += step) {
    const v = parts.reduce((sum, [k, a, p]) => sum + a * Math.sin((2 * Math.PI * k * x) / PERIOD + p), 0)
    pts.push(`${x} ${(y + v).toFixed(1)}`)
  }
  return `M${pts.join(' L')}`
}

/** Runs the swell spring while it has somewhere to go, and stops when settled. */
function useSwell(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    let state: SwellState = AT_REST
    let frame = 0
    let last = 0
    const tick = (now: number) => {
      const target = isBackdropPlaying() ? 1 : 0
      state = stepSwell(state, target, last ? (now - last) / 1000 : 0)
      last = now
      if (ref.current) ref.current.style.transform = `scaleY(${swellScale(state).toFixed(4)})`
      // playing keeps pulsing; silence stops the loop once the waves are at rest
      frame = target === 0 && settled(state, 0) ? 0 : requestAnimationFrame(tick)
      if (!frame) {
        state = AT_REST
        last = 0
      }
    }
    const wake = () => {
      if (prefersReducedMotion() || frame) return
      last = 0
      frame = requestAnimationFrame(tick)
    }
    const off = subscribeBackdropPlaying(wake)
    if (isBackdropPlaying()) wake()
    return () => {
      off()
      cancelAnimationFrame(frame)
    }
  }, [ref])
}

export function Backdrop() {
  const swell = useRef<HTMLDivElement>(null)
  useSwell(swell)
  return (
    <div className="mx-backdrop" aria-hidden="true">
      <div className="mx-backdrop-swell" ref={swell}>
        {WAVES.map((w, i) => (
          <svg
            key={i}
            className="mx-backdrop-wave"
            data-tone={w.tone}
            style={{ '--i': i } as CSSProperties}
            viewBox={`0 0 ${PERIOD * 2} ${HEIGHT}`}
            preserveAspectRatio="none"
          >
            <path d={wavePath(w)} fill="none" vectorEffect="non-scaling-stroke" />
          </svg>
        ))}
      </div>
    </div>
  )
}
