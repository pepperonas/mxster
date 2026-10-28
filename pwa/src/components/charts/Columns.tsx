/**
 * Columns along an axis (years, days, hours): one series, one hue, thin bars
 * with a rounded top and a square baseline, a hairline top value, values in
 * text colour. Pointer or keyboard on a column shows it in the readout above;
 * without one the readout shows `idle` (a total, "today" …). A table with
 * every value sits underneath for screen readers and anyone who wants numbers.
 */
import { useState } from 'react'
import { m } from 'motion/react'
import { spring } from '@/motion/springs'
import { prefersReducedMotion } from '@/motion/policy'
import { SERIES_COLORS } from './RadarChart'

export interface Column {
  key: string
  /** Axis label of this column (short: "1985", "Mo", "21 Uhr"). */
  label: string
  value: number
}

interface ColumnsProps {
  columns: Column[]
  /** Accessible name and table caption. */
  label: string
  /** Readout of one column ("1985: 12 Songs"). */
  describe: (c: Column) => string
  /** Readout with no column picked. */
  idle: string
  /** Axis labels shown under the chart (keys); default first and last. */
  ticks?: string[]
  height?: number
  /** Heading of the table's value column. */
  valueHeading: string
  tableToggle: string
}

export function Columns({ columns, label, describe, idle, ticks, height = 120, valueHeading, tableToggle }: ColumnsProps) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...columns.map((c) => c.value))
  const top = max <= 4 ? max : Math.ceil(max / 2) * 2
  const still = prefersReducedMotion()
  const shownTicks = new Set(ticks ?? [columns[0]?.key, columns[columns.length - 1]?.key])
  const dense = columns.length > 40

  return (
    <figure aria-label={label}>
      <p className="mb-3 min-h-[1.5rem] text-title-sm text-md-on-surface num-poster" aria-live="polite">
        {hover === null ? idle : describe(columns[hover])}
      </p>
      <div className="relative" style={{ height }}>
        <div className="absolute inset-x-0 top-0 border-t border-md-outline-variant/60" aria-hidden />
        <span
          className="absolute -top-2.5 right-0 bg-md-surface-container-low pl-1 text-label-sm text-md-on-surface-variant tabular"
          aria-hidden
        >
          {top}
        </span>
        <div className="absolute inset-x-0 bottom-0 border-t border-md-outline-variant" aria-hidden />
        <ul className={`absolute inset-0 flex items-end pr-6 ${dense ? 'gap-px' : 'gap-[2px]'}`}>
          {columns.map((c, i) => {
            const h = c.value > 0 ? Math.max(3, (c.value / top) * height) : 0
            return (
              <li
                key={c.key}
                className="relative flex-1 h-full flex items-end justify-center"
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover((cur) => (cur === i ? null : cur))}
                tabIndex={0}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                aria-label={describe(c)}
              >
                <m.span
                  className={`block w-full max-w-[24px] ${dense ? 'rounded-t-[2px]' : 'rounded-t-[4px]'}`}
                  style={{
                    height: h,
                    background: `rgb(${SERIES_COLORS[0]})`,
                    opacity: hover === null || hover === i ? 1 : 0.4,
                    transformOrigin: 'bottom'
                  }}
                  initial={still ? false : { scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ ...spring.spatialDefault, delay: still ? 0 : Math.min(i, 40) * 0.012 }}
                />
              </li>
            )
          })}
        </ul>
      </div>
      <div className="relative h-5 mt-1.5 mr-6 text-label-sm text-md-on-surface-variant tabular" aria-hidden>
        {columns.map((c, i) =>
          shownTicks.has(c.key) ? (
            <span
              key={c.key}
              className="absolute -translate-x-1/2 whitespace-nowrap first:translate-x-0 last:-translate-x-full"
              style={{ left: `${((i + 0.5) / columns.length) * 100}%` }}
            >
              {c.label}
            </span>
          ) : null
        )}
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer text-label-lg text-md-primary min-h-[48px] inline-flex items-center">{tableToggle}</summary>
        <table className="mt-2 w-full text-body-sm tabular">
          <caption className="sr-only">{label}</caption>
          <tbody>
            {columns.map((c) => (
              <tr key={c.key} className="border-t border-md-outline-variant/50">
                <th scope="row" className="py-1 pr-3 text-left font-normal text-md-on-surface-variant">
                  {c.label}
                </th>
                <td className="py-1 text-right text-md-on-surface" aria-label={valueHeading}>
                  {c.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
