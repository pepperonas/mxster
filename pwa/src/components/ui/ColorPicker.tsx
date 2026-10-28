/**
 * The colour scheme: one swatch per scheme (its accent and its warm second
 * colour, as the app will use them), a radiogroup with arrow keys like the
 * language switch. The change runs through the same circular reveal as the
 * theme switch, from the swatch that was tapped.
 */
import type { KeyboardEvent } from 'react'
import { COLOR_SCHEMES, COLOR_SCHEME_IDS, type ColorScheme } from '@/styles/colorSchemes'
import { useMessages } from '@/i18n'
import { profileText } from '@/i18n/messages/profile'
import { Icon } from './Icon'

export function ColorPicker({ value, onChange }: { value: ColorScheme; onChange: (next: ColorScheme, origin: HTMLElement) => void }) {
  const t = useMessages(profileText)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = COLOR_SCHEME_IDS[(COLOR_SCHEME_IDS.indexOf(value) + step + COLOR_SCHEME_IDS.length) % COLOR_SCHEME_IDS.length]
    const target = e.currentTarget.querySelector<HTMLButtonElement>(`[data-scheme="${next}"]`)
    if (!target) return
    onChange(next, target)
    target.focus()
  }

  return (
    <div role="radiogroup" aria-label={t.color} onKeyDown={onKeyDown} className="flex flex-wrap gap-1 sm:gap-2">
      {COLOR_SCHEME_IDS.map((id) => {
        const selected = id === value
        const { primary, tertiary } = COLOR_SCHEMES[id].swatch
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t[`color_${id}`]}
            title={t[`color_${id}`]}
            data-scheme={id}
            tabIndex={selected ? 0 : -1}
            onClick={(e) => !selected && onChange(id, e.currentTarget)}
            className="grid place-items-center w-12 h-12 rounded-full m3-state-layer"
          >
            <span
              className={`grid place-items-center w-9 h-9 rounded-full transition-[box-shadow,transform] duration-m3-effects ease-m3-effects ${
                selected ? 'scale-100 shadow-[0_0_0_2px_rgb(var(--md-sys-color-surface)),0_0_0_4px_rgb(var(--md-sys-color-on-surface))]' : 'scale-90'
              }`}
              style={{ background: `linear-gradient(135deg, ${primary} 0 55%, ${tertiary} 55% 100%)` }}
            >
              {selected && (
                <span className="grid place-items-center w-5 h-5 rounded-full bg-md-surface text-md-on-surface">
                  <Icon name="check" size={14} />
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
