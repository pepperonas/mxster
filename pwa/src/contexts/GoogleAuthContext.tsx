import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react'
import {
  getGoogleClientId,
  loadGoogleIdentity,
  loadStoredProfile,
  profileFromCredential,
  storeProfile,
  type GoogleProfile
} from '@/services/googleIdentity'

/**
 * Google sign-in state. Independent of the Spotify AuthContext: Spotify is a
 * playback entitlement, Google is the player's identity.
 */
interface GoogleAuthContextValue {
  /** false when no VITE_GOOGLE_CLIENT_ID was set at build time — hide all UI */
  isConfigured: boolean
  user: GoogleProfile | null
  error: string | null
  /** Load Google's script and render its official button into `el`. */
  renderButton: (el: HTMLElement) => Promise<void>
  signOut: () => void
}

const GoogleAuthContext = createContext<GoogleAuthContextValue | undefined>(undefined)

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const clientId = getGoogleClientId()
  const isConfigured = clientId.length > 0
  const [user, setUser] = useState<GoogleProfile | null>(() => (isConfigured ? loadStoredProfile() : null))
  const [error, setError] = useState<string | null>(null)

  const renderButton = useCallback(
    async (el: HTMLElement) => {
      if (!isConfigured) return
      setError(null)
      try {
        const gis = await loadGoogleIdentity()
        gis.initialize({
          client_id: clientId,
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: ({ credential }) => {
            const profile = profileFromCredential(credential, clientId)
            if (!profile) {
              setError('Anmeldung fehlgeschlagen. Bitte erneut versuchen.')
              return
            }
            storeProfile(profile)
            setUser(profile)
          }
        })
        el.replaceChildren()
        gis.renderButton(el, {
          type: 'standard',
          theme: document.documentElement.dataset.theme === 'light' ? 'outline' : 'filled_black',
          size: 'large',
          shape: 'pill',
          text: 'signin_with',
          logo_alignment: 'left',
          locale: 'de',
          width: Math.max(200, Math.min(320, Math.floor(el.clientWidth || 260)))
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Google-Anmeldung nicht verfügbar')
        throw err
      }
    },
    [clientId, isConfigured]
  )

  const signOut = useCallback(() => {
    storeProfile(null)
    setUser(null)
    // Stop One Tap from silently re-selecting the account
    window.google?.accounts?.id?.disableAutoSelect()
  }, [])

  const value = useMemo(
    () => ({ isConfigured, user, error, renderButton, signOut }),
    [isConfigured, user, error, renderButton, signOut]
  )

  return <GoogleAuthContext.Provider value={value}>{children}</GoogleAuthContext.Provider>
}

export function useGoogleAuth(): GoogleAuthContextValue {
  const ctx = useContext(GoogleAuthContext)
  if (!ctx) throw new Error('useGoogleAuth must be used within GoogleAuthProvider')
  return ctx
}
