/**
 * Sign-in. The record rolls in and starts turning; the wordmark settles from
 * light and wide into its poster weight. One orchestrated moment, then calm.
 */
import { useMemo, useState } from 'react'
import { m } from 'motion/react'
import { Vinyl } from '@/components/ui/Vinyl'
import { GoogleMark } from '@/components/ui/Icon'
import { LOGIN_URL } from '@/api/client'
import { useMessages } from '@/i18n'
import { authText } from '@/i18n/messages/auth'
import { loginErrorText } from '@/i18n/messages/errors'
import { LanguageSwitch } from '@/components/ui/LanguageSwitch'
import { spring } from '@/motion/springs'
import { LegalLinks } from '@/legal/LegalScreen'

export function LoginScreen() {
  const [leaving, setLeaving] = useState(false)
  const t = useMessages(authText)
  const code = useMemo(() => new URLSearchParams(window.location.search).get('login_error'), [])
  // Recomputed per render so a language switch translates the message too
  const error = code ? loginErrorText(code) : null

  return (
    <main className="relative min-h-dvh overflow-hidden flex flex-col">
      <div className="absolute right-3 z-10" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <LanguageSwitch />
      </div>
      <div className="flex-1 flex flex-col justify-center px-6 pt-10 pb-6 mx-auto w-full max-w-md">
        <m.div
          className="relative self-end -mr-[38%] sm:-mr-[30%] mb-[-26%]"
          initial={{ x: 160, rotate: -40, opacity: 0 }}
          animate={{ x: 0, rotate: 0, opacity: 1 }}
          transition={{ ...spring.spatialSlow, delay: 0.05 }}
        >
          <Vinyl size="min(78vw, 360px)" spinning />
        </m.div>

        <h1 className="hero-wordmark text-poster text-md-on-surface relative" style={{ fontSize: 'clamp(4rem, 22vw, 6.5rem)' }}>
          mxtape
        </h1>

        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.spatialDefault, delay: 0.35 }}
          className="mt-6 space-y-8"
        >
          <p className="text-body-lg text-md-on-surface-variant max-w-[34ch]">
            {t.pitch}
          </p>

          {error && (
            <p role="alert" className="rounded-m3-lg bg-md-error-container text-md-on-error-container px-4 py-3 text-body-md">
              {error}
            </p>
          )}

          <div className="space-y-3">
            <a
              href={LOGIN_URL}
              onClick={() => setLeaving(true)}
              className="btn btn-lg btn-brand m3-state-layer w-full"
              aria-busy={leaving}
            >
              <span className="grid place-items-center w-8 h-8 rounded-full bg-white">
                <GoogleMark size={20} />
              </span>
              {leaving ? t.leaving : t.signIn}
            </a>
            <p className="text-body-sm text-md-on-surface-variant">
              {t.privacyNote}
            </p>
          </div>
        </m.div>
      </div>
      <LegalLinks className="pb-6" />
    </main>
  )
}
