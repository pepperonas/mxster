/**
 * M3 Switch — 52×32 track, thumb grows 16→24px when checked,
 * spring thumb-bounce on change. Keeps native checkbox semantics.
 */

import { useRef } from 'react'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  ariaLabel?: string
  disabled?: boolean
}

export function Switch({ checked, onChange, ariaLabel, disabled }: SwitchProps) {
  const thumbRef = useRef<HTMLSpanElement>(null)

  const handleChange = (next: boolean) => {
    onChange(next)
    const thumb = thumbRef.current
    if (thumb) {
      thumb.style.animation = 'none'
      // restart the bounce keyframe on every toggle
      void thumb.offsetWidth
      thumb.style.animation = `m3-thumb-bounce var(--m3-dur-spatial-fast) var(--m3-ease-spatial-fast)`
    }
  }

  return (
    <label
      className={`relative inline-flex items-center flex-shrink-0 ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => handleChange(e.target.checked)}
        aria-label={ariaLabel}
        className="sr-only peer"
      />
      <span
        className={`
          w-[52px] h-8 rounded-m3-full flex items-center px-1
          border-2 transition-colors duration-m3-effects ease-m3-effects
          peer-focus-visible:ring-2 peer-focus-visible:ring-md-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background
          ${checked
            ? 'bg-md-primary border-md-primary justify-end'
            : 'bg-md-surface-container-highest border-md-outline justify-start'}
        `}
      >
        <span
          ref={thumbRef}
          className={`
            rounded-m3-full transition-all duration-m3-spatial-fast ease-m3-spatial-fast
            ${checked ? 'w-6 h-6 bg-md-on-primary' : 'w-4 h-4 bg-md-outline'}
          `}
        />
      </span>
    </label>
  )
}

export default Switch
