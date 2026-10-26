import { useState } from 'react'

/** Google profile picture, falling back to the initial on a tonal disc. */
export function Avatar({ name, picture, size = 40 }: { name: string; picture?: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  const initial = (name.trim()[0] ?? '?').toUpperCase()
  if (picture && !failed) {
    return (
      <img
        src={picture}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className="grid place-items-center rounded-full bg-md-tertiary-container text-md-on-tertiary-container shrink-0 text-title-md"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  )
}
