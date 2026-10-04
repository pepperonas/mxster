import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { GoogleAuthProvider } from '@/contexts/GoogleAuthContext'
import { GoogleSignIn } from '../GoogleSignIn'
import {
  GIS_SCRIPT_SRC,
  GOOGLE_PROFILE_STORAGE_KEY,
  __resetGoogleIdentityLoader,
  type GoogleCredentialResponse
} from '@/services/googleIdentity'

const CLIENT_ID = 'test-client.apps.googleusercontent.com'

function b64url(obj: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj))
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const credential = `${b64url({ alg: 'RS256' })}.${b64url({
  iss: 'https://accounts.google.com',
  aud: CLIENT_ID,
  exp: Math.floor(Date.now() / 1000) + 3600,
  sub: '42',
  email: 'jana@example.com',
  email_verified: true,
  name: 'Jana Müller',
  given_name: 'Jana'
})}.sig`

function gisScripts() {
  return Array.from(document.querySelectorAll(`script[src="${GIS_SCRIPT_SRC}"]`)) as HTMLScriptElement[]
}

function renderSignIn() {
  return render(
    <GoogleAuthProvider>
      <GoogleSignIn />
    </GoogleAuthProvider>
  )
}

/** Simulate Google's script finishing to load; returns the registered callback. */
function finishLoadingGis() {
  let callback: ((r: GoogleCredentialResponse) => void) | undefined
  const gis = {
    initialize: vi.fn((cfg: { client_id: string; callback: (r: GoogleCredentialResponse) => void }) => {
      expect(cfg.client_id).toBe(CLIENT_ID)
      callback = cfg.callback
    }),
    renderButton: vi.fn((el: HTMLElement) => {
      el.innerHTML = '<div data-testid="official-google-button"></div>'
    }),
    disableAutoSelect: vi.fn()
  }
  window.google = { accounts: { id: gis } }
  act(() => {
    gisScripts()[0].onload?.(new Event('load'))
  })
  return { gis, getCallback: () => callback! }
}

describe('GoogleSignIn', () => {
  beforeEach(() => {
    localStorage.clear()
    delete window.google
    gisScripts().forEach((s) => s.remove())
    __resetGoogleIdentityLoader()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('renders nothing when no client id is configured', () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '')
    const { container } = renderSignIn()
    expect(container).toBeEmptyDOMElement()
  })

  it('contacts Google only after the user asks to sign in', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', CLIENT_ID)
    renderSignIn()
    expect(gisScripts()).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: /mit google anmelden/i }))
    expect(gisScripts()).toHaveLength(1)

    finishLoadingGis()
    expect(await screen.findByTestId('official-google-button')).toBeInTheDocument()
  })

  it('signs in from the credential, stores only the profile, and signs out', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', CLIENT_ID)
    renderSignIn()
    fireEvent.click(screen.getByRole('button', { name: /mit google anmelden/i }))
    const { gis, getCallback } = finishLoadingGis()
    await waitFor(() => expect(gis.renderButton).toHaveBeenCalled())

    act(() => getCallback()({ credential }))
    expect(screen.getByText('Jana Müller')).toBeInTheDocument()
    expect(screen.getByText('jana@example.com')).toBeInTheDocument()
    const stored = localStorage.getItem(GOOGLE_PROFILE_STORAGE_KEY)!
    expect(stored).not.toContain(credential)

    fireEvent.click(screen.getByRole('button', { name: /abmelden/i }))
    expect(localStorage.getItem(GOOGLE_PROFILE_STORAGE_KEY)).toBeNull()
    expect(gis.disableAutoSelect).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /mit google anmelden/i })).toBeInTheDocument()
  })

  it('shows an error and stays signed out for a credential meant for another app', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'other.apps.googleusercontent.com')
    renderSignIn()
    fireEvent.click(screen.getByRole('button', { name: /mit google anmelden/i }))
    let callback: ((r: GoogleCredentialResponse) => void) | undefined
    window.google = {
      accounts: {
        id: {
          initialize: (cfg: { callback: (r: GoogleCredentialResponse) => void }) => {
            callback = cfg.callback
          },
          renderButton: () => {},
          disableAutoSelect: () => {}
        } as never
      }
    }
    act(() => {
      gisScripts()[0].onload?.(new Event('load'))
    })
    await waitFor(() => expect(callback).toBeDefined())
    act(() => callback!({ credential }))
    expect(screen.getByRole('alert')).toHaveTextContent(/fehlgeschlagen/i)
    expect(localStorage.getItem(GOOGLE_PROFILE_STORAGE_KEY)).toBeNull()
  })

  it('restores a stored profile on load', () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', CLIENT_ID)
    localStorage.setItem(
      GOOGLE_PROFILE_STORAGE_KEY,
      JSON.stringify({ sub: '42', email: 'jana@example.com', name: 'Jana Müller', givenName: 'Jana', picture: null })
    )
    renderSignIn()
    expect(screen.getByText('Jana Müller')).toBeInTheDocument()
    expect(gisScripts()).toHaveLength(0)
  })
})
