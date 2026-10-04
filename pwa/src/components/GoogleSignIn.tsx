import { useEffect, useRef, useState } from 'react'
import { useGoogleAuth } from '@/contexts'

/**
 * Sidebar account card.
 *
 * Two-step on purpose: nothing is loaded from Google until the user presses
 * our own button. Only then the GIS script loads and Google's official button
 * appears in its place (one extra tap, but no third-party request beforehand).
 */
export function GoogleSignIn() {
  const { isConfigured, user, error, renderButton, signOut } = useGoogleAuth()
  const [wantsSignIn, setWantsSignIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const slotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!wantsSignIn || user || !slotRef.current) return
    setLoading(true)
    renderButton(slotRef.current)
      .catch(() => setWantsSignIn(false))
      .finally(() => setLoading(false))
  }, [wantsSignIn, user, renderButton])

  // Reset the two-step flow after signing out
  useEffect(() => {
    if (user) setWantsSignIn(false)
  }, [user])

  if (!isConfigured) return null

  if (user) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-m3-lg bg-md-surface-container-high">
        {user.picture ? (
          <img
            src={user.picture}
            alt=""
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-m3-full flex-shrink-0"
          />
        ) : (
          <div
            aria-hidden="true"
            className="w-10 h-10 rounded-m3-full flex-shrink-0 grid place-items-center bg-md-primary-container text-md-on-primary-container text-title-md"
          >
            {user.givenName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-label-lg text-text-primary truncate">{user.name}</p>
          <p className="text-body-sm text-text-secondary truncate">{user.email}</p>
        </div>
        <button
          onClick={signOut}
          className="px-3 min-h-[48px] rounded-m3-full m3-state-layer text-label-lg text-text-secondary hover:text-danger transition-colors flex-shrink-0"
        >
          Abmelden
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {!wantsSignIn ? (
        <button
          onClick={() => setWantsSignIn(true)}
          className="w-full flex items-center justify-center gap-2 px-4 min-h-[48px] rounded-m3-full border border-md-outline-variant m3-state-layer text-label-lg text-text-primary"
        >
          <GoogleGlyph />
          Mit Google anmelden
        </button>
      ) : (
        <>
          {/* Google owns this node's children — React must never render into it */}
          <div ref={slotRef} className="flex justify-center min-h-[44px]" aria-busy={loading} />
          {loading && <p className="text-body-sm text-text-secondary text-center">Lädt…</p>}
        </>
      )}
      <p className="text-body-sm text-text-secondary text-center">
        {wantsSignIn
          ? 'Der Anmeldeknopf wird von Google bereitgestellt.'
          : 'Lädt erst beim Antippen einen Dienst von Google.'}
      </p>
      {error && (
        <p role="alert" className="text-body-sm text-danger text-center">
          {error}
        </p>
      )}
    </div>
  )
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}
