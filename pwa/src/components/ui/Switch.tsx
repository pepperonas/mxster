/**
 * M3 Switch — 52×32 track. The thumb travels on the spatial-fast spring (it
 * used to teleport between justify-start/-end while only its size animated),
 * grows 16 → 24 px when on and to 28 px while pressed, like M3 specifies.
 * Keeps native checkbox semantics.
 */
import { m } from 'motion/react'
import { spring } from '@/motion/springs'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  ariaLabel?: string
  disabled?: boolean
}

const TRAVEL = 20 // 52 track − 2·2 border − 2·4 padding − 24 thumb box

export function Switch({ checked, onChange, ariaLabel, disabled }: SwitchProps) {
  return (
    <label
      className={`relative inline-flex items-center flex-shrink-0 ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={ariaLabel}
        className="sr-only peer"
      />
      <m.span
        whileTap={disabled ? undefined : 'pressed'}
        className={`w-[52px] h-8 rounded-m3-full flex items-center px-1 border-2 transition-colors duration-m3-effects ease-m3-effects peer-focus-visible:ring-2 peer-focus-visible:ring-md-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-md-surface ${
          checked ? 'bg-md-primary border-md-primary' : 'bg-md-surface-container-highest border-md-outline'
        }`}
      >
        <m.span
          className={`block w-6 h-6 rounded-m3-full transition-colors duration-m3-effects ease-m3-effects ${
            checked ? 'bg-md-on-primary' : 'bg-md-outline'
          }`}
          initial={false}
          animate={{ x: checked ? TRAVEL : 0, scale: checked ? 1 : 16 / 24 }}
          variants={{ pressed: { scale: 28 / 24 } }}
          transition={spring.spatialFast}
        />
      </m.span>
    </label>
  )
}

export default Switch
