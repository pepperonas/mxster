/**
 * The app's own dropdown — never a native <select> (the house rule: custom
 * controls only, so menus look and move like the rest of the app on every
 * platform). A button opens a listbox below it.
 *
 * Keyboard: Enter, Space, ↓ or ↑ opens; ↑/↓ move, Home/End jump, Enter/Space
 * choose, Esc or Tab closes; a letter jumps to the next option starting with it.
 * Focus returns to the button after choosing or closing.
 */
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { Icon } from './Icon'
import { spring } from '@/motion/springs'

export interface DropdownOption<T extends string> {
  value: T
  label: string
}

interface DropdownProps<T extends string> {
  /** Accessible name of the control (also shown to screen readers on the button). */
  label: string
  value: T
  options: DropdownOption<T>[]
  onChange: (value: T) => void
  /** Shown before the current label inside the button, e.g. an icon. */
  leading?: ReactNode
  /** Which edge the menu lines up with. */
  align?: 'start' | 'end'
  className?: string
  buttonClassName?: string
}

export function Dropdown<T extends string>({ label, value, options, onChange, leading, align = 'start', className = '', buttonClassName = '' }: DropdownProps<T>) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const id = useId()
  const selected = Math.max(0, options.findIndex((o) => o.value === value))
  const current = options[selected]

  const openAt = (index: number) => {
    setActive(index)
    setOpen(true)
  }
  const close = (refocus = true) => {
    setOpen(false)
    if (refocus) button.current?.focus()
  }
  const choose = (index: number) => {
    const o = options[index]
    if (o && o.value !== value) onChange(o.value)
    close()
  }

  // A click or tap anywhere else closes the menu (without stealing focus back)
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) close(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  // The open list takes focus so the keys below reach it
  useEffect(() => {
    if (open) list.current?.focus()
  }, [open])

  useEffect(() => {
    if (open) list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView?.({ block: 'nearest' })
  }, [open, active])

  const onButtonKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      openAt(selected)
    }
  }

  const onListKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const last = options.length - 1
    if (e.key === 'ArrowDown') setActive((a) => Math.min(last, a + 1))
    else if (e.key === 'ArrowUp') setActive((a) => Math.max(0, a - 1))
    else if (e.key === 'Home') setActive(0)
    else if (e.key === 'End') setActive(last)
    else if (e.key === 'Enter' || e.key === ' ') choose(active)
    else if (e.key === 'Escape') close()
    else if (e.key === 'Tab') {
      setOpen(false)
      return
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      const k = e.key.toLowerCase()
      const order = options.map((_, i) => (active + 1 + i) % options.length)
      const hit = order.find((i) => options[i].label.toLowerCase().startsWith(k))
      if (hit !== undefined) setActive(hit)
    } else return
    e.preventDefault()
  }

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        ref={button}
        type="button"
        className={`chip m3-state-layer ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        onClick={() => (open ? close() : openAt(selected))}
        onKeyDown={onButtonKey}
        data-dropdown
      >
        {leading}
        <span className="sr-only">{label}: </span>
        <span className="truncate" data-dropdown-value={current?.value}>
          {current?.label}
        </span>
        <Icon name="chevron" size={18} className={`shrink-0 transition-transform duration-200 ${open ? '-rotate-90' : 'rotate-90'}`} />
      </button>
      <AnimatePresence>
        {open && (
          <m.ul
            ref={list}
            id={`${id}-list`}
            role="listbox"
            tabIndex={-1}
            aria-label={label}
            aria-activedescendant={`${id}-${active}`}
            onKeyDown={onListKey}
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4, transition: spring.effectsFast }}
            transition={spring.spatialFast}
            style={{ transformOrigin: align === 'end' ? 'top right' : 'top left' }}
            className={`absolute z-40 top-[calc(100%+6px)] ${align === 'end' ? 'right-0' : 'left-0'} min-w-full w-max max-w-[min(18rem,calc(100vw-2rem))] max-h-[min(22rem,60vh)] overflow-y-auto py-2 rounded-m3-lg bg-md-surface-container-high shadow-lg outline-none`}
            data-dropdown-list
          >
            {options.map((o, i) => (
              <li
                key={o.value}
                id={`${id}-${i}`}
                role="option"
                aria-selected={i === selected}
                data-index={i}
                data-active={i === active}
                onPointerMove={() => setActive(i)}
                onClick={() => choose(i)}
                className={`flex items-center gap-3 min-h-[48px] px-4 cursor-pointer text-body-lg ${i === active ? 'bg-md-on-surface/10' : ''} ${i === selected ? 'text-md-primary' : 'text-md-on-surface'}`}
              >
                <span className="w-5 shrink-0" aria-hidden="true">
                  {i === selected && <Icon name="check" size={20} />}
                </span>
                <span className="truncate">{o.label}</span>
              </li>
            ))}
          </m.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
