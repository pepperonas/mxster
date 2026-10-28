/**
 * The vinyl record — mxtape's one signature element.
 *
 * The disc (grooves + label) rotates while `spinning`; the light reflection
 * sits in a second, static layer on top, the way a real record catches the
 * lamp while it turns underneath. It spins up and coasts to a stop
 * (useRecordMotor) and then rests where it is.
 */
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useRecordMotor } from './useRecordMotor'

interface VinylProps {
  size?: number | string
  spinning?: boolean
  /** Text printed on the label (kept short). */
  label?: ReactNode
  /** Overrides the label colour (CSS colour). */
  labelColor?: string
  /** Image printed on the label (album cover after a reveal). */
  labelImage?: string | null
  /** Ring around the label (CSS colour), e.g. the verdict. */
  labelRing?: string
  className?: string
  style?: CSSProperties
}

/**
 * Fine grooves from the lead-in to the run-out, with smooth gaps between
 * tracks (a real record shows them as darker bands). Opacity varies in a fixed
 * pattern so the surface reads as pressed vinyl, not as a target.
 */
const TRACK_GAPS: [number, number][] = [
  [39.6, 40.6],
  [31.4, 32.2],
  [25.2, 25.9]
]
const GROOVES: { r: number; o: number }[] = (() => {
  const out: { r: number; o: number }[] = []
  for (let r = 47.2; r > 20; r -= 0.62) {
    const radius = Math.round(r * 100) / 100
    if (TRACK_GAPS.some(([a, b]) => radius >= a && radius <= b)) continue
    const i = out.length
    out.push({ r: radius, o: 0.05 + ((i * 37) % 11) / 110 })
  }
  return out
})()

export function Vinyl({ size = 240, spinning = false, label, labelColor, labelImage, labelRing, className = '', style }: VinylProps) {
  const uid = useId().replace(/:/g, '')
  const bodyId = `body-${uid}`
  const labelGlossId = `gloss-${uid}`
  const clipId = `label-${uid}`
  const [imageFailed, setImageFailed] = useState(false)
  useEffect(() => setImageFailed(false), [labelImage])
  const showImage = Boolean(labelImage) && !imageFailed
  const disc = useRef<SVGSVGElement>(null)
  const turning = useRecordMotor(disc, spinning)
  return (
    <div
      className={`relative shrink-0 select-none ${className}`}
      style={{ width: size, height: size, ...style }}
      aria-hidden="true"
    >
      <svg ref={disc} viewBox="0 0 100 100" className="vinyl absolute inset-0 w-full h-full" data-spinning={turning}>
        <defs>
          <radialGradient id={bodyId} cx="50%" cy="50%" r="50%">
            <stop offset="36%" stopColor="rgb(var(--mx-vinyl))" />
            <stop offset="92%" stopColor="rgb(var(--mx-groove))" stopOpacity="0.55" />
            <stop offset="100%" stopColor="rgb(var(--mx-vinyl))" />
          </radialGradient>
          <radialGradient id={labelGlossId} cx="38%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.28" />
            <stop offset="55%" stopColor="#fff" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.18" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="49.5" fill="rgb(var(--mx-vinyl))" />
        <circle cx="50" cy="50" r="49.5" fill={`url(#${bodyId})`} />
        {GROOVES.map((g) => (
          <circle key={g.r} cx="50" cy="50" r={g.r} fill="none" stroke="#fff" strokeOpacity={g.o} strokeWidth="0.16" />
        ))}
        {/* Lead-in edge and the smooth run-out area */}
        <circle cx="50" cy="50" r="48.6" fill="none" stroke="#fff" strokeOpacity="0.1" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="19.4" fill="none" stroke="#fff" strokeOpacity="0.07" strokeWidth="0.4" />
        {/* Label with an off-centre mark so the rotation is visible */}
        <circle cx="50" cy="50" r="18" fill={labelColor ?? 'rgb(var(--mx-label))'} />
        <circle cx="50" cy="50" r="16.2" fill="none" stroke="#fff" strokeOpacity="0.16" strokeWidth="0.25" />
        <path d="M50 35.5a14.5 14.5 0 0 1 12.6 7.3" stroke="rgb(var(--mx-label-2))" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        {showImage && (
          <>
            <clipPath id={clipId}>
              <circle cx="50" cy="50" r="18" />
            </clipPath>
            <image
              href={labelImage!}
              x="32"
              y="32"
              width="36"
              height="36"
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#${clipId})`}
              onError={() => setImageFailed(true)}
            />
            {/* Scrim so a year on top stays readable on any cover */}
            <circle cx="50" cy="50" r="18" fill="rgb(0 0 0 / 0.38)" />
          </>
        )}
        <circle cx="50" cy="50" r="18" fill={`url(#${labelGlossId})`} />
        <circle cx="50" cy="50" r="18" fill="none" stroke="rgb(0 0 0 / 0.25)" strokeWidth="0.5" />
        {labelRing && <circle cx="50" cy="50" r="18.6" fill="none" stroke={labelRing} strokeWidth="1.6" />}
        <circle cx="50" cy="50" r="1.9" fill="rgb(0 0 0 / 0.35)" />
        <circle cx="50" cy="50" r="1.5" fill="rgb(var(--md-sys-color-surface))" />
      </svg>

      {/* Static sheen: light from the lamp catches the grooves in two soft,
          opposite arcs (a conic gradient, so there are no hard edges), with a
          faint warm/cool tint like the iridescence on real vinyl. It stays put
          while the disc turns underneath. */}
      <div className="vinyl-sheen" />

      {label && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div
            className="grid place-items-center text-center text-label-md"
            style={{ width: '30%', color: 'rgb(var(--mx-on-brand))' }}
          >
            {label}
          </div>
        </div>
      )}
    </div>
  )
}
