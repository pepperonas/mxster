/**
 * DE / EN: a compact two-option radiogroup. The detected language applies
 * until someone picks one here; the pick is stored per device (setLang).
 * Each option names its language in that language, so it reads right to
 * anyone looking for theirs.
 */
import type { KeyboardEvent } from 'react'
import { LANGS, useLang, useMessages, type Lang } from '@/i18n'
import { shellText } from '@/i18n/messages/shell'

const OPTION: Record<Lang, { short: string; name: string }> = {
  de: { short: 'DE', name: 'Deutsch' },
  en: { short: 'EN', name: 'English' }
}

export function LanguageSwitch({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLang()
  const t = useMessages(shellText)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = LANGS[(LANGS.indexOf(lang) + step + LANGS.length) % LANGS.length]
    setLang(next)
    const group = e.currentTarget
    requestAnimationFrame(() => group.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus())
  }

  return (
    <div
      role="radiogroup"
      aria-label={t.language}
      onKeyDown={onKeyDown}
      className={`inline-flex gap-0.5 p-0.5 rounded-m3-full bg-md-surface-container-high ${className}`}
    >
      {LANGS.map((l) => {
        const selected = l === lang
        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={OPTION[l].name}
            lang={l}
            tabIndex={selected ? 0 : -1}
            onClick={() => setLang(l)}
            className={`min-w-[48px] min-h-[48px] px-3 rounded-m3-full text-label-lg m3-state-layer transition-colors duration-m3-effects ease-m3-effects ${
              selected ? 'bg-md-secondary-container text-md-on-secondary-container' : 'text-md-on-surface-variant'
            }`}
          >
            {OPTION[l].short}
          </button>
        )
      })}
    </div>
  )
}
