import type { ReactNode } from 'react'
import { m } from 'motion/react'
import { spring } from '@/motion/springs'

/** M3 circular progress (determinate) with content in the middle. */
export function ProgressRing({
  value,
  max,
  size = 56,
  stroke = 4,
  done = false,
  children
}: {
  value: number
  max: number
  size?: number
  stroke?: number
  done?: boolean
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return (
    <span className="relative grid place-items-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke="rgb(var(--md-sys-color-secondary-container))" />
        <m.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={done ? 'rgb(var(--md-sys-color-tertiary))' : 'rgb(var(--md-sys-color-primary))'}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - (done ? 1 : ratio)) }}
          transition={spring.spatialSlow}
        />
      </svg>
      <span className="relative">{children}</span>
    </span>
  )
}
