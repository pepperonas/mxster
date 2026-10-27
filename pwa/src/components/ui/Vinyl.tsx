/**
 * The vinyl record — mxster's one signature element.
 *
 * The disc (grooves + label) rotates while `spinning`; the light reflection
 * sits in a second, static layer on top, the way a real record catches the
 * lamp while it turns underneath. Pausing freezes the rotation where it is.
 */
import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react'

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

const GROOVES = [46, 43.5, 41, 38.5, 36, 33.5, 31, 28.5, 26, 23.5]

export function Vinyl({ size = 240, spinning = false, label, labelColor, labelImage, labelRing, className = '', style }: VinylProps) {
  const uid = useId().replace(/:/g, '')
  const sheenId = `sheen-${uid}`
  const clipId = `label-${uid}`
  const [imageFailed, setImageFailed] = useState(false)
  useEffect(() => setImageFailed(false), [labelImage])
  const showImage = Boolean(labelImage) && !imageFailed
  return (
    <div
      className={`relative shrink-0 select-none ${className}`}
      style={{ width: size, height: size, ...style }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" className="vinyl absolute inset-0 w-full h-full" data-spinning={spinning}>
        <circle cx="50" cy="50" r="49.5" fill="rgb(var(--mx-vinyl))" />
        {GROOVES.map((r, i) => (
          <circle
            key={r}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="rgb(var(--mx-groove))"
            strokeWidth={i % 3 === 0 ? 0.55 : 0.3}
          />
        ))}
        {/* Label with an off-centre mark so the rotation is visible */}
        <circle cx="50" cy="50" r="18" fill={labelColor ?? 'rgb(var(--mx-label))'} />
        <circle cx="50" cy="50" r="18" fill="none" stroke="rgb(0 0 0 / 0.18)" strokeWidth="0.6" />
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
        {labelRing && <circle cx="50" cy="50" r="18.6" fill="none" stroke={labelRing} strokeWidth="1.6" />}
        <circle cx="50" cy="50" r="1.6" fill="rgb(var(--md-sys-color-surface))" />
      </svg>

      {/* Static sheen: two soft wedges of reflected light */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <radialGradient id={sheenId} cx="50%" cy="50%" r="50%">
            <stop offset="38%" stopColor="#fff" stopOpacity="0" />
            <stop offset="70%" stopColor="#fff" stopOpacity="0.13" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d="M50 50 L22 6 A49 49 0 0 1 44 1.4 Z" fill={`url(#${sheenId})`} />
        <path d="M50 50 L78 94 A49 49 0 0 1 56 98.6 Z" fill={`url(#${sheenId})`} />
      </svg>

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
