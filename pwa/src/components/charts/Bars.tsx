/**
 * The small charts of the statistics. Marks follow one spec: thin bars with a
 * rounded data end and a square baseline, hairline recessive grid, values in
 * text colour (never the series colour), a tooltip on every mark.
 */
import { useState, type ReactNode } from 'react'
import { m } from 'motion/react'
import { spring } from '@/motion/springs'
import { prefersReducedMotion } from '@/motion/policy'
import { SERIES_COLORS } from './RadarChart'

// ── Stat tile ────────────────────────────────────────────────────────────────

export function StatTile({ label, value, note }: { label: string; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="surface p-4 min-w-0">
      <p className="text-label-lg text-md-on-surface-variant">{label}</p>
      <p className="mt-1 text-headline-sm text-md-on-surface truncate">{value}</p>
      {note && <p className="mt-0.5 text-body-sm text-md-on-surface-variant">{note}</p>}
    </div>
  )
}

// ── Horizontal bars (one row per entity) ────────────────────────────────────

export interface BarRow {
  key: string
  label: string
  /** Bar length, 0–max. */
  value: number
  /** Text at the bar end. */
  text: string
  /** Second line under the label. */
  sub?: string
  /** Emphasise this row (the account holder). */
  strong?: boolean
}

export function BarList({ rows, max, label }: { rows: BarRow[]; max: number; label: string }) {
  const still = prefersReducedMotion()
  return (
    <ul className="space-y-3" aria-label={label}>
      {rows.map((r, i) => {
        const w = max > 0 ? Math.max(r.value > 0 ? 0.02 : 0, r.value / max) : 0
        return (
          <li key={r.key} className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3">
            <span className="min-w-0">
              <span className={`block truncate text-body-md ${r.strong ? 'font-semibold text-md-on-surface' : 'text-md-on-surface'}`}>
                {r.label}
              </span>
              {r.sub && <span className="block truncate text-body-sm text-md-on-surface-variant">{r.sub}</span>}
            </span>
            <span className="relative h-3 rounded-r-[4px] bg-md-surface-container-highest overflow-hidden" title={`${r.label}: ${r.text}`}>
              <m.span
                className="absolute inset-y-0 left-0 rounded-r-[4px]"
                style={{
                  background: `rgb(${SERIES_COLORS[0]})`,
                  width: `${w * 100}%`,
                  transformOrigin: 'left'
                }}
                initial={still ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  ...spring.spatialDefault,
                  delay: still ? 0 : Math.min(i, 8) * 0.04
                }}
              />
            </span>
            <span className="text-title-sm tabular text-md-on-surface text-right">{r.text}</span>
          </li>
        )
      })}
    </ul>
  )
}

// ── Weekly columns ───────────────────────────────────────────────────────────

const weekFmt = new Intl.DateTimeFormat('de-DE', {
  day: 'numeric',
  month: 'short'
})

export function WeekColumns({ weeks, label }: { weeks: Array<{ start: number; rounds: number }>; label: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...weeks.map((w) => w.rounds))
  const top = max <= 4 ? max : Math.ceil(max / 2) * 2
  const still = prefersReducedMotion()
  const H = 112
  const shown = hover ?? weeks.length - 1

  return (
    <figure aria-label={label}>
      <div className="flex items-baseline justify-between gap-3 mb-3 min-h-[2.5rem]">
        <p className="text-body-md text-md-on-surface-variant">
          {hover === null ? 'Diese Woche' : `Woche ab ${weekFmt.format(weeks[shown].start)}`}
        </p>
        <p className="text-title-md tabular text-md-on-surface">
          {weeks[shown].rounds} {weeks[shown].rounds === 1 ? 'Runde' : 'Runden'}
        </p>
      </div>
      <div className="relative" style={{ height: H }}>
        {/* Grid: baseline and top value */}
        <div className="absolute inset-x-0 top-0 border-t border-md-outline-variant/60" aria-hidden />
        <span
          className="absolute -top-2.5 right-0 bg-md-surface-container-low pl-1 text-label-sm text-md-on-surface-variant tabular"
          aria-hidden
        >
          {top}
        </span>
        <div className="absolute inset-x-0 bottom-0 border-t border-md-outline-variant" aria-hidden />
        <ul className="absolute inset-0 flex items-end gap-[2px] pr-6">
          {weeks.map((w, i) => {
            const h = w.rounds > 0 ? Math.max(4, (w.rounds / top) * H) : 0
            const current = i === weeks.length - 1
            return (
              <li
                key={w.start}
                className="relative flex-1 h-full flex items-end justify-center"
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover((c) => (c === i ? null : c))}
                tabIndex={0}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                aria-label={`Woche ab ${weekFmt.format(w.start)}: ${w.rounds} ${w.rounds === 1 ? 'Runde' : 'Runden'}`}
              >
                <m.span
                  className="block w-full max-w-[24px] rounded-t-[4px]"
                  style={{
                    height: h,
                    background: `rgb(${SERIES_COLORS[0]})`,
                    opacity: hover === null ? (current ? 1 : 0.55) : hover === i ? 1 : 0.4,
                    transformOrigin: 'bottom'
                  }}
                  initial={still ? false : { scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{
                    ...spring.spatialDefault,
                    delay: still ? 0 : i * 0.025
                  }}
                />
              </li>
            )
          })}
        </ul>
      </div>
      <div className="flex justify-between pr-6 mt-1.5 text-label-sm text-md-on-surface-variant tabular" aria-hidden>
        <span>{weekFmt.format(weeks[0].start)}</span>
        <span>heute</span>
      </div>
    </figure>
  )
}

// ── Share bar (parts of a whole) ────────────────────────────────────────────

export function ShareBar({ parts, label }: { parts: Array<{ label: string; value: number }>; label: string }) {
  const total = parts.reduce((n, p) => n + p.value, 0)
  if (total === 0) return null
  const still = prefersReducedMotion()
  return (
    <figure aria-label={label}>
      <div className="flex h-4 gap-[2px] rounded-[4px] overflow-hidden" aria-hidden>
        {parts.map((p, i) =>
          p.value === 0 ? null : (
            <m.span
              key={p.label}
              className="h-full"
              title={`${p.label}: ${p.value}`}
              style={{
                background: `rgb(${SERIES_COLORS[i]})`,
                flexGrow: p.value,
                flexBasis: 0,
                transformOrigin: 'left'
              }}
              initial={still ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                ...spring.spatialDefault,
                delay: still ? 0 : i * 0.06
              }}
            />
          )
        )}
      </div>
      <ul className="mt-3 space-y-1.5">
        {parts.map((p, i) => (
          <li key={p.label} className="flex items-center gap-2 text-body-md">
            <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ background: `rgb(${SERIES_COLORS[i]})` }} aria-hidden />
            <span className="flex-1 text-md-on-surface">{p.label}</span>
            <span className="tabular text-md-on-surface-variant">
              {p.value} · {Math.round((p.value / total) * 100)} %
            </span>
          </li>
        ))}
      </ul>
    </figure>
  )
}
