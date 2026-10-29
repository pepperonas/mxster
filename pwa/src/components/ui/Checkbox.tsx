/**
 * The app's own checkbox: a real (visually hidden) input for keyboard, forms
 * and screen readers, drawn as an M3 box with a check that pops in. Never the
 * browser's native box, which looks different on every platform.
 */
import { Icon } from './Icon'

export function Checkbox({ checked, onChange, className = '' }: { checked: boolean; onChange: (checked: boolean) => void; className?: string }) {
  return (
    <span className={`mx-checkbox relative inline-grid place-items-center w-5 h-5 shrink-0 ${className}`}>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-[4px] border-2 border-md-on-surface-variant transition-colors duration-150 peer-checked:border-md-primary peer-checked:bg-md-primary peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-md-primary"
      />
      <span aria-hidden="true" className={`mx-checkbox-mark relative text-md-on-primary ${checked ? 'is-on' : ''}`}>
        <Icon name="check" size={16} />
      </span>
    </span>
  )
}
