/**
 * Google Identity Services (GIS) — client-side sign-in.
 *
 * mxster has no backend, so sign-in runs entirely in the browser: Google's
 * button returns a signed ID token (JWT), we read the profile claims from it
 * and keep only the profile. The token itself is never stored.
 *
 * Only the OAuth *Client ID* is needed (public by design — it ships in the
 * bundle). There is no client secret in this flow.
 *
 * Note: without a server the signature cannot be verified, so the profile is
 * display-only (name/avatar/default player name). Anything security-relevant
 * would need server-side verification of the credential.
 */

export const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
export const GOOGLE_PROFILE_STORAGE_KEY = 'mxster_google_profile'

const VALID_ISSUERS = ['accounts.google.com', 'https://accounts.google.com']

export interface GoogleProfile {
  sub: string
  email: string
  name: string
  givenName: string
  picture: string | null
}

interface IdTokenClaims {
  iss?: string
  aud?: string
  exp?: number
  sub?: string
  email?: string
  email_verified?: boolean
  name?: string
  given_name?: string
  picture?: string
}

// Minimal typing of the parts of `window.google.accounts.id` we use
export interface GoogleCredentialResponse {
  credential: string
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
    ux_mode?: 'popup' | 'redirect'
  }): void
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void
  disableAutoSelect(): void
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } }
  }
}

export function getGoogleClientId(): string {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim()
}

/** Decode the payload of a JWT (base64url, UTF-8). Returns null on malformed input. */
export function decodeJwtPayload(jwt: string): IdTokenClaims | null {
  const parts = jwt.split('.')
  if (parts.length !== 3 || !parts[1]) return null
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const json = new TextDecoder().decode(bytes)
    const claims = JSON.parse(json)
    return claims && typeof claims === 'object' ? (claims as IdTokenClaims) : null
  } catch {
    return null
  }
}

/**
 * Turn a GIS credential into a profile — or null if it is not for this app,
 * not from Google, expired, or lacks the fields we need.
 */
export function profileFromCredential(
  credential: string,
  clientId: string,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): GoogleProfile | null {
  const claims = decodeJwtPayload(credential)
  if (!claims || !clientId) return null
  if (claims.aud !== clientId) return null
  if (!claims.iss || !VALID_ISSUERS.includes(claims.iss)) return null
  if (typeof claims.exp !== 'number' || claims.exp <= nowSeconds) return null
  if (!claims.sub || !claims.email || claims.email_verified === false) return null

  const name = (claims.name || claims.email).trim()
  return {
    sub: claims.sub,
    email: claims.email,
    name,
    givenName: (claims.given_name || name.split(' ')[0] || name).trim(),
    picture: claims.picture?.startsWith('https://') ? claims.picture : null
  }
}

export function loadStoredProfile(): GoogleProfile | null {
  try {
    const raw = localStorage.getItem(GOOGLE_PROFILE_STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    if (p && typeof p.sub === 'string' && typeof p.email === 'string' && typeof p.name === 'string') {
      return {
        sub: p.sub,
        email: p.email,
        name: p.name,
        givenName: typeof p.givenName === 'string' ? p.givenName : p.name,
        picture: typeof p.picture === 'string' ? p.picture : null
      }
    }
  } catch {
    // corrupt entry — treat as signed out
  }
  return null
}

export function storeProfile(profile: GoogleProfile | null): void {
  try {
    if (profile) localStorage.setItem(GOOGLE_PROFILE_STORAGE_KEY, JSON.stringify(profile))
    else localStorage.removeItem(GOOGLE_PROFILE_STORAGE_KEY)
  } catch {
    // storage unavailable (private mode) — session-only sign-in
  }
}

let scriptPromise: Promise<GoogleAccountsId> | null = null

/** Load the GIS script once. Called only after the user asked to sign in. */
export function loadGoogleIdentity(): Promise<GoogleAccountsId> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id)
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<GoogleAccountsId>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GIS_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => {
      const id = window.google?.accounts?.id
      if (id) resolve(id)
      else reject(new Error('Google Identity Services nicht verfügbar'))
    }
    script.onerror = () => reject(new Error('Google-Anmeldung konnte nicht geladen werden'))
    document.head.appendChild(script)
  }).catch((err) => {
    scriptPromise = null // allow a retry
    throw err
  })
  return scriptPromise
}

/** Test hook: forget the cached loader. */
export function __resetGoogleIdentityLoader(): void {
  scriptPromise = null
}
