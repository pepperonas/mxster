/**
 * M3 Expressive springs — the single source of truth for motion in mxtape.
 *
 * Material 3 Expressive specifies motion as physical springs (stiffness k and
 * damping ratio ζ, mass 1). From these parameters we derive:
 *   1. Motion (motion/react) transitions: real springs that keep velocity when
 *      an animation is interrupted or retargeted.
 *   2. CSS `linear()` easings + durations sampled from the exact closed-form
 *      solution, written into design-tokens.css (see springs.test.ts —
 *      `UPDATE_SPRING_CSS=1 npx vitest run springs` regenerates the block).
 *
 * Spatial springs move position/size/shape and may overshoot.
 * Effects springs (ζ = 1, critically damped) drive colour/opacity and never do.
 */

export interface SpringSpec {
  stiffness: number
  dampingRatio: number
}

export const M3_SPRINGS = {
  spatialFast: { stiffness: 800, dampingRatio: 0.6 },
  spatialDefault: { stiffness: 380, dampingRatio: 0.8 },
  spatialSlow: { stiffness: 200, dampingRatio: 0.8 },
  effectsFast: { stiffness: 3800, dampingRatio: 1 },
  effectsDefault: { stiffness: 1600, dampingRatio: 1 },
  effectsSlow: { stiffness: 800, dampingRatio: 1 }
} as const satisfies Record<string, SpringSpec>

export type SpringName = keyof typeof M3_SPRINGS

export interface MotionSpring {
  type: 'spring'
  stiffness: number
  damping: number
  mass: number
}

/** Motion's spring uses absolute damping: c = 2ζ√(k·m). */
export function toMotionSpring({ stiffness, dampingRatio }: SpringSpec): MotionSpring {
  return {
    type: 'spring',
    stiffness,
    damping: Math.round(2 * dampingRatio * Math.sqrt(stiffness) * 100) / 100,
    mass: 1
  }
}

/** Ready-to-use Motion transitions: `transition={spring.spatialDefault}`. */
export const spring = Object.fromEntries(
  Object.entries(M3_SPRINGS).map(([name, spec]) => [name, toMotionSpring(spec)])
) as Record<SpringName, MotionSpring>

/** How a dragged card springs back when released away from a gap (dock and board alike). */
export const dragReturn = { bounceStiffness: 380, bounceDamping: 26 } as const

/**
 * Normalised position 0 → 1 of a spring released from rest at 0 towards 1.
 * Underdamped: 1 − e^(−ζωt)(cos ω_d t + (ζω/ω_d) sin ω_d t)
 * Critical:    1 − e^(−ωt)(1 + ωt)
 */
export function springPosition({ stiffness, dampingRatio: z }: SpringSpec, t: number): number {
  const w = Math.sqrt(stiffness)
  if (z >= 1) return 1 - Math.exp(-w * t) * (1 + w * t)
  const wd = w * Math.sqrt(1 - z * z)
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t))
}

/** Time until the oscillation envelope stays within `tolerance` of the target. */
export function springSettleTime({ stiffness, dampingRatio: z }: SpringSpec, tolerance = 0.001): number {
  const w = Math.sqrt(stiffness)
  if (z >= 1) {
    // e^(−ωt)(1+ωt) is monotonic — solve by stepping.
    let t = 0
    while (Math.exp(-w * t) * (1 + w * t) > tolerance) t += 0.0005
    return t
  }
  const wd = w * Math.sqrt(1 - z * z)
  const amplitude = Math.sqrt(1 + ((z * w) / wd) ** 2)
  return Math.log(amplitude / tolerance) / (z * w)
}

export interface CssSpring {
  durationMs: number
  easing: string
}

/** Sample the spring at 60 Hz into a CSS `linear()` easing. */
export function springToCss(spec: SpringSpec, tolerance = 0.001): CssSpring {
  const duration = springSettleTime(spec, tolerance)
  const steps = Math.max(2, Math.ceil(duration * 60))
  const points: string[] = []
  for (let i = 0; i <= steps; i++) {
    const v = i === steps ? 1 : springPosition(spec, (duration * i) / steps)
    points.push(String(Math.round(v * 1000) / 1000))
  }
  return { durationMs: Math.round(duration * 1000), easing: `linear(${points.join(', ')})` }
}

const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

/** The generated block inside design-tokens.css (between the BEGIN/END markers). */
export function springCssBlock(): string {
  const lines = Object.entries(M3_SPRINGS).map(([name, spec]) => {
    const { durationMs, easing } = springToCss(spec)
    const [kind, speed] = kebab(name).split('-') as [string, string]
    return `    --m3-dur-${kind}-${speed}: ${durationMs}ms;\n    --m3-ease-${kind}-${speed}: ${easing};`
  })
  return [
    '@supports (transition-timing-function: linear(0, 1)) {',
    '  :root {',
    ...lines,
    '  }',
    '}'
  ].join('\n')
}
