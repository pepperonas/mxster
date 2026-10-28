/**
 * Set a new password from the link in the reset mail (/reset-password?token=…).
 * Readable without a session; afterwards the visitor is signed in and the
 * gate decides what comes next.
 */
import { useId, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { PasswordInput } from '@/auth/EmailAuth'
import { Vinyl } from '@/components/ui/Vinyl'
import { Icon } from '@/components/ui/Icon'
import { LanguageSwitch } from '@/components/ui/LanguageSwitch'
import { LegalLinks } from '@/legal/LegalScreen'
import { useMessages } from '@/i18n'
import { authText } from '@/i18n/messages/auth'
import { apiErrorText, errorsText } from '@/i18n/messages/errors'

export function ResetPasswordScreen() {
  const t = useMessages(authText)
  const te = useMessages(errorsText)
  const { refresh } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expired, setExpired] = useState(!token)
  const id = useId()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await api('/api/auth/reset', { method: 'POST', json: { token, password } })
      navigate('/', { replace: true })
      await refresh()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'reset_expired') setExpired(true)
      else setError(err instanceof ApiError ? apiErrorText(err, te.tryAgain) : te.noConnection)
      setBusy(false)
    }
  }

  return (
    <main className="min-h-dvh flex flex-col">
      <div className="absolute right-3 z-10" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <LanguageSwitch />
      </div>
      <div className="flex-1 flex flex-col justify-center px-6 py-10 mx-auto w-full max-w-md">
        <div className="mb-8">
          <Vinyl size={128} label={<Icon name="lock" size={20} />} />
        </div>
        <h1 className="text-headline-lg text-md-on-surface">{t.resetTitle}</h1>
        {expired ? (
          <div className="mt-6 space-y-6">
            <p role="alert" className="rounded-m3-lg bg-md-error-container text-md-on-error-container px-4 py-3 text-body-md">
              {t.resetExpired}
            </p>
            <button type="button" className="btn btn-lg btn-tonal m3-state-layer w-full" onClick={() => navigate('/', { replace: true })}>
              {t.resetToLogin}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <p className="text-body-md text-md-on-surface-variant">{t.resetBody}</p>
            <div className="space-y-1.5">
              <label htmlFor={id} className="block text-label-lg text-md-on-surface-variant">
                {t.newPasswordLabel}
              </label>
              <PasswordInput id={id} value={password} onChange={setPassword} autoComplete="new-password" describedBy={`${id}-hint`} />
              <p id={`${id}-hint`} className="text-body-sm text-md-on-surface-variant">
                {t.passwordHint}
              </p>
            </div>
            {error && (
              <p role="alert" className="rounded-m3-lg bg-md-error-container text-md-on-error-container px-4 py-3 text-body-md">
                {error}
              </p>
            )}
            <button type="submit" className="btn btn-lg btn-brand m3-state-layer w-full" disabled={busy || password.length < 8} aria-busy={busy}>
              {busy ? t.sending : t.resetSubmit}
            </button>
          </form>
        )}
      </div>
      <LegalLinks className="pb-6" />
    </main>
  )
}
