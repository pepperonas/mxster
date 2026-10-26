/**
 * Everything between "signed in" and "allowed in": the waiting room for
 * pending accounts, the closed door for rejected/blocked ones, and the
 * offline notice.
 */
import { useState } from 'react'
import { m } from 'motion/react'
import { useAuth } from '@/auth/AuthContext'
import { Vinyl } from '@/components/ui/Vinyl'
import { Icon } from '@/components/ui/Icon'
import { spring } from '@/motion/springs'
import { LegalLinks } from './LegalLinks'

type Variant = 'pending' | 'rejected' | 'blocked' | 'offline'

const COPY: Record<Variant, { title: (name: string) => string; body: string }> = {
  pending: {
    title: (name) => (name ? `Fast geschafft, ${name}.` : 'Fast geschafft.'),
    body: 'Dein Konto wartet auf Freischaltung. Sobald es freigegeben ist, geht es hier von selbst weiter — du musst nichts neu laden.'
  },
  rejected: {
    title: () => 'Kein Zugang.',
    body: 'Dieses Konto wurde nicht freigeschaltet. Wenn du glaubst, dass das ein Versehen ist, sprich Martin direkt an.'
  },
  blocked: {
    title: () => 'Zugang gesperrt.',
    body: 'Dieses Konto ist gesperrt. Wenn du glaubst, dass das ein Versehen ist, sprich Martin direkt an.'
  },
  offline: {
    title: () => 'Keine Verbindung.',
    body: 'Der Server antwortet gerade nicht. Prüf deine Internetverbindung und versuch es noch einmal.'
  }
}

export function WaitingScreen({ variant }: { variant: Variant }) {
  const { state, refresh, logout } = useAuth()
  const [checking, setChecking] = useState(false)
  const me = state.kind === 'signed-in' ? state.me : null
  const firstName = me?.name.split(' ')[0] ?? ''
  const copy = COPY[variant]

  const check = async () => {
    setChecking(true)
    await refresh()
    setChecking(false)
  }

  return (
    <main className="min-h-dvh flex flex-col">
      <div className="flex-1 flex flex-col justify-center items-start px-6 py-10 mx-auto w-full max-w-md">
        <m.div
          className="mb-10"
          animate={variant === 'pending' ? { scale: [1, 1.03, 1] } : { scale: 1 }}
          transition={variant === 'pending' ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : spring.spatialDefault}
        >
          <Vinyl
            size={168}
            labelColor={variant === 'pending' || variant === 'offline' ? undefined : 'rgb(var(--md-sys-color-outline))'}
            label={<Icon name={variant === 'pending' ? 'hourglass' : variant === 'offline' ? 'replay' : 'lock'} size={22} />}
          />
        </m.div>

        <h1 className="text-headline-lg text-md-on-surface">{copy.title(firstName)}</h1>
        <p className="mt-3 text-body-lg text-md-on-surface-variant max-w-[38ch]">{copy.body}</p>

        {me && (
          <div className="mt-8 flex items-center gap-3 rounded-m3-full bg-md-surface-container-high pl-1.5 pr-4 py-1.5">
            {me.picture ? (
              <img src={me.picture} alt="" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full" />
            ) : (
              <span className="grid place-items-center w-9 h-9 rounded-full bg-md-primary-container text-md-on-primary-container">
                <Icon name="person" size={20} />
              </span>
            )}
            <span className="text-body-md text-md-on-surface-variant">{me.email}</span>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {(variant === 'pending' || variant === 'offline') && (
            <button type="button" className="btn btn-tonal m3-state-layer" onClick={() => void check()} disabled={checking}>
              <Icon name="replay" size={20} />
              {checking ? 'Prüfe …' : 'Jetzt prüfen'}
            </button>
          )}
          {me && (
            <button type="button" className="btn btn-text m3-state-layer" onClick={() => void logout()}>
              <Icon name="logout" size={20} />
              Abmelden
            </button>
          )}
        </div>
      </div>
      <LegalLinks className="pb-6" />
    </main>
  )
}
