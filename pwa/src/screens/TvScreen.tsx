/**
 * /tv — the short address a TV opens (typed with its remote): enter the code
 * from "Fernseher verbinden" on the phone, and this device joins that room as
 * a screen. Open to everyone; joining happens on the room's own join page.
 */
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { m } from 'motion/react'
import { Vinyl } from '@/components/ui/Vinyl'
import { Icon } from '@/components/ui/Icon'
import { LanguageSwitch } from '@/components/ui/LanguageSwitch'
import { useMessages } from '@/i18n'
import { roomsText } from '@/i18n/messages/rooms'
import { roomCodeOrNull } from '@/online/roomCode'
import { spring } from '@/motion/springs'

export function TvScreen() {
  const t = useMessages(roomsText)
  const navigate = useNavigate()
  const [raw, setRaw] = useState('')
  const [bad, setBad] = useState(false)

  const go = (e: FormEvent) => {
    e.preventDefault()
    const code = roomCodeOrNull(raw)
    if (!code) return setBad(true)
    navigate(`/r/${code}?screen=1`)
  }

  return (
    <div className="relative min-h-dvh grid place-items-center px-5 py-10">
      <div className="absolute right-3 z-10" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <LanguageSwitch />
      </div>
      <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={spring.spatialDefault} className="w-full max-w-md text-center">
        <div className="mx-auto w-40 h-40">
          <Vinyl size="100%" spinning />
        </div>
        <h1 className="mt-6 text-poster text-md-on-surface" style={{ fontSize: 'clamp(2rem, 7vw, 2.8rem)' }}>
          {t.tvPageTitle}
        </h1>
        <p className="mt-3 text-body-lg text-md-on-surface-variant">{t.tvPageLead}</p>
        <form onSubmit={go} className="mt-8 space-y-4 text-left" data-tv-form>
          <label htmlFor="tv-code" className="block text-label-lg text-md-on-surface-variant">
            {t.tvCodeLabel}
          </label>
          <input
            id="tv-code"
            className="field text-center text-poster tabular uppercase tracking-[0.12em]"
            style={{ fontSize: '2rem' }}
            value={raw}
            maxLength={12}
            autoFocus
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="ABCD-2345"
            aria-invalid={bad}
            aria-describedby={bad ? 'tv-bad' : undefined}
            onChange={(e) => {
              setRaw(e.target.value)
              setBad(false)
            }}
          />
          {bad && (
            <p id="tv-bad" className="text-body-sm text-md-error" role="alert">
              {t.tvBadCode}
            </p>
          )}
          <button type="submit" className="btn btn-lg btn-brand m3-state-layer w-full" disabled={raw.trim().length < 8}>
            <Icon name="tv" />
            {t.tvGo}
          </button>
        </form>
      </m.div>
    </div>
  )
}
