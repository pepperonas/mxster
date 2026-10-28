/**
 * After an online round as a guest: invite to an account of one's own.
 * Google goes straight to Google; e-mail opens the sign-up form with the
 * guest's name filled in. Either way the account waits for approval.
 */
import { m } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { LOGIN_URL } from '@/api/client'
import { GoogleMark, Icon } from '@/components/ui/Icon'
import { spring } from '@/motion/springs'
import { useMessages } from '@/i18n'
import { authText } from '@/i18n/messages/auth'

export function signUpPath(name: string): string {
  const q = new URLSearchParams({ register: '1' })
  if (name.trim()) q.set('name', name.trim().slice(0, 20))
  return `/?${q.toString()}`
}

export function SignUpOffer({ name }: { name: string }) {
  const t = useMessages(authText)
  const navigate = useNavigate()
  return (
    <m.section
      aria-labelledby="signup-offer-title"
      className="mt-8 rounded-m3-xl bg-md-secondary-container text-md-on-secondary-container p-5 space-y-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring.spatialDefault, delay: 0.9 }}
    >
      <div className="space-y-1.5">
        <h2 id="signup-offer-title" className="text-title-lg">
          {t.offerTitle}
        </h2>
        <p className="text-body-md opacity-90">{t.offerBody}</p>
      </div>
      <div className="grid gap-2">
        <a href={LOGIN_URL} className="btn btn-brand m3-state-layer w-full">
          <span className="grid place-items-center w-7 h-7 rounded-full bg-white">
            <GoogleMark size={18} />
          </span>
          {t.offerGoogle}
        </a>
        <button type="button" className="btn btn-outline m3-state-layer w-full" onClick={() => navigate(signUpPath(name))}>
          <Icon name="mail" />
          {t.offerEmail}
        </button>
      </div>
    </m.section>
  )
}
