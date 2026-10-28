/**
 * Spider web (radar) chart: one closed shape per series over shared axes,
 * values 0–1. Up to three series, coloured in fixed order (--mx-chart-1…3).
 *
 * - Rings at 25/50/75/100 %, hairline spokes, axis labels outside.
 * - An axis without data for a series (null) is drawn at the centre and gets
 *   no dot, the tooltip says "keine Daten" — a hole is not the same as 0 %.
 * - Every axis is a focusable hit wedge: hover, tap or keyboard fills the readout
 *   under the web with all series at that axis (under, so it never hides the web). The legend names the series (≥ 2), so identity
 *   never relies on colour alone.
 * - The shapes grow out of the centre once on mount (spatial spring), static
 *   under reduced motion.
 */
import { useId, useState } from 'react'
import { m } from 'motion/react'
import { spring } from '@/motion/springs'
import { prefersReducedMotion } from '@/motion/policy'
import { msg, useMessages } from '@/i18n'
import { statsText } from '@/i18n/messages/stats'

export interface RadarSeries {
  name: string
  /** 0–1 per axis, null = no data. */
  values: Array<number | null>
  /** Optional text per axis for the tooltip, e.g. "7 von 9". */
  detail?: string[]
}

interface RadarChartProps {
  axes: string[]
  series: RadarSeries[]
  /** Accessible summary of what is plotted. */
  label: string
  format?: (v: number) => string
  /** Value of the outer ring (default 1 = 100 %). */
  max?: number
}

const SIZE = 320
const C = SIZE / 2
const R = 124
const RINGS = [0.25, 0.5, 0.75, 1]
export const SERIES_COLORS = ['var(--mx-chart-1)', 'var(--mx-chart-2)', 'var(--mx-chart-3)']

const pct = (v: number) => msg(statsText).percent(Math.round(v * 100))

function point(i: number, n: number, v: number): [number, number] {
  const a = -Math.PI / 2 + (i / n) * Math.PI * 2
  return [C + Math.cos(a) * R * v, C + Math.sin(a) * R * v]
}

const poly = (pts: Array<[number, number]>) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

export function RadarChart({ axes, series, label, format = pct, max = 1 }: RadarChartProps) {
  const [active, setActive] = useState<number | null>(null)
  const t = useMessages(statsText)
  const id = useId()
  const n = axes.length
  const still = prefersReducedMotion()

  return (
    <figure className="relative" aria-labelledby={`${id}-cap`}>
      <figcaption id={`${id}-cap`} className="sr-only">
        {label}
      </figcaption>
      {series.length > 1 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 mb-2" aria-label={t.legend}>
          {series.map((s, i) => (
            <li key={s.name} className="flex items-center gap-2 text-label-lg text-md-on-surface">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: `rgb(${SERIES_COLORS[i]})` }} aria-hidden />
              {s.name}
            </li>
          ))}
        </ul>
      )}

      <svg
        viewBox={`-24 -16 ${SIZE + 48} ${SIZE + 32}`}
        className="w-full max-w-[420px] mx-auto block overflow-visible"
        role="img"
        aria-label={label}
      >
        {/* Grid */}
        <g fill="none" stroke="rgb(var(--md-sys-color-outline-variant))" strokeWidth={1} vectorEffect="non-scaling-stroke">
          {RINGS.map((r) => (
            <polygon key={r} points={poly(axes.map((_, i) => point(i, n, r)))} opacity={r === 1 ? 1 : 0.7} />
          ))}
          {axes.map((_, i) => {
            const [x, y] = point(i, n, 1)
            return (
              <line
                key={i}
                x1={C}
                y1={C}
                x2={x}
                y2={y}
                strokeWidth={active === i ? 2 : 1}
                stroke={active === i ? 'rgb(var(--md-sys-color-outline))' : undefined}
              />
            )
          })}
        </g>
        {/* Ring values along the top spoke */}
        {[0.5, 1].map((r) => {
          const [x, y] = point(0, n, r)
          return (
            <text key={r} x={x + 6} y={y + 4} className="fill-md-on-surface-variant" style={{ fontSize: 10 }}>
              {pct(r * max)}
            </text>
          )
        })}

        {/* Series */}
        <m.g
          style={{ transformOrigin: `${C}px ${C}px` }}
          initial={still ? false : { scale: 0.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={spring.spatialDefault}
        >
          {series.map((s, si) => {
            const color = `rgb(${SERIES_COLORS[si]})`
            const pts = s.values.map((v, i) => point(i, n, Math.min(1, (v ?? 0) / max)))
            return (
              <g key={s.name}>
                {/* A new metric or person morphs the web: same number of corners, so the points interpolate */}
                <m.polygon
                  initial={false}
                  animate={{ points: poly(pts) }}
                  transition={still ? { duration: 0 } : spring.spatialDefault}
                  fill={color}
                  fillOpacity={0.12}
                  stroke={color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
                {s.values.map((v, i) =>
                  v === null ? null : (
                    <m.circle
                      key={i}
                      initial={false}
                      animate={{ cx: pts[i][0], cy: pts[i][1] }}
                      transition={still ? { duration: 0 } : spring.spatialDefault}
                      r={active === i ? 5.5 : 4}
                      fill={color}
                      stroke="rgb(var(--md-sys-color-surface-container-low))"
                      strokeWidth={2}
                    />
                  )
                )}
              </g>
            )
          })}
        </m.g>

        {/* Axis labels + hit wedges */}
        {axes.map((a, i) => {
          const [lx, ly] = point(i, n, 1.14)
          const prev = point(i - 0.5, n, 1.3)
          const next = point(i + 0.5, n, 1.3)
          const summary = series.map((s) => `${s.name}: ${s.values[i] === null ? t.noData : format(s.values[i] as number)}`).join(', ')
          return (
            <g
              key={a}
              tabIndex={0}
              role="button"
              aria-label={`${a}: ${summary}`}
              onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(i)}
              onPointerLeave={(e) => e.pointerType === 'mouse' && setActive((cur) => (cur === i ? null : cur))}
              // Touch: a tap picks the decade and it stays until the next tap
              onClick={() => setActive(i)}
              onFocus={() => setActive(i)}
              className="outline-none cursor-default"
            >
              <polygon points={poly([[C, C], prev, next])} fill="transparent" />
              <text
                x={lx}
                y={ly + 4}
                textAnchor={Math.abs(lx - C) < 8 ? 'middle' : lx > C ? 'start' : 'end'}
                className={active === i ? 'fill-md-on-surface' : 'fill-md-on-surface-variant'}
                style={{ fontSize: 13, fontWeight: active === i ? 700 : 500 }}
              >
                {a}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Readout under the web (never over it): the picked decade, or how to pick one */}
      <div
        role="status"
        className="mt-2 rounded-m3-lg bg-md-surface-container px-4 py-3"
        style={{ minHeight: `${2.75 + series.length * 1.5}rem` }}
      >
        {active === null ? (
          <p className="text-body-sm text-md-on-surface-variant">{t.pickDecade}</p>
        ) : (
          <>
            <p className="text-label-lg text-md-on-surface">{axes[active]}</p>
            <ul className="mt-1 space-y-0.5">
              {series.map((s, si) => (
                <li key={s.name} className="flex items-center gap-2 text-body-sm text-md-on-surface">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: `rgb(${SERIES_COLORS[si]})` }}
                    aria-hidden
                  />
                  <span className="flex-1 truncate">{s.name}</span>
                  <span className="tabular text-md-on-surface-variant">
                    {s.values[active] === null ? t.noData : format(s.values[active] as number)}
                    {s.detail?.[active] ? ` · ${s.detail[active]}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </figure>
  )
}
