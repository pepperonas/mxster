/**
 * M3 segmented buttons with a sliding selection pill.
 * The pill is one shared element (layoutId per control), so changing the
 * choice moves it on the spatial-fast spring instead of recolouring in place.
 * Semantics: a radiogroup; arrow keys move the choice.
 */
import { useId, type KeyboardEvent } from 'react'
import { m } from 'motion/react'
import { spring } from '@/motion/springs'

export interface Segment<T extends string | number> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string | number> {
  label: string
  segments: Segment<T>[]
  value: T
  onChange: (value: T) => void
  stackOnMobile?: boolean
}

export function SegmentedControl<T extends string | number>({
  label,
  segments,
  value,
  onChange,
  stackOnMobile = false
}: SegmentedControlProps<T>) {
  const pillId = useId()
  const index = segments.findIndex((s) => s.value === value)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = segments[(index + step + segments.length) % segments.length]
    onChange(next.value)
    const group = e.currentTarget
    requestAnimationFrame(() => group.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus())
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`flex gap-1 p-1 rounded-m3-xl bg-md-surface-container-high ${stackOnMobile ? 'flex-col sm:flex-row' : ''}`}
    >
      {segments.map((segment) => {
        const selected = segment.value === value
        return (
          <button
            key={segment.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(segment.value)}
            className={`relative flex-1 min-h-[48px] px-4 rounded-m3-lg text-label-lg transition-colors duration-m3-effects ease-m3-effects m3-state-layer ${
              selected ? 'text-md-on-secondary-container' : 'text-md-on-surface-variant'
            }`}
          >
            {selected && (
              <m.span
                layoutId={`segment-pill-${pillId}`}
                transition={spring.spatialFast}
                className="absolute inset-0 rounded-m3-lg bg-md-secondary-container shadow-m3-1"
                aria-hidden="true"
              />
            )}
            <span className="relative">{segment.label}</span>
          </button>
        )
      })}
    </div>
  )
}
