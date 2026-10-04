import { describe, it, expect, beforeEach } from 'vitest'
import {
  decodeJwtPayload,
  profileFromCredential,
  loadStoredProfile,
  storeProfile,
  GOOGLE_PROFILE_STORAGE_KEY
} from '../googleIdentity'

const CLIENT_ID = 'test-client.apps.googleusercontent.com'
const NOW = 1_800_000_000

function b64url(obj: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj))
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function jwt(claims: Record<string, unknown>): string {
  return `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url(claims)}.signature`
}

const valid = {
  iss: 'https://accounts.google.com',
  aud: CLIENT_ID,
  exp: NOW + 3600,
  sub: '1234567890',
  email: 'jana@example.com',
  email_verified: true,
  name: 'Jana Müller',
  given_name: 'Jana',
  picture: 'https://lh3.googleusercontent.com/a/abc'
}

describe('decodeJwtPayload', () => {
  it('decodes base64url payloads including UTF-8', () => {
    expect(decodeJwtPayload(jwt(valid))?.name).toBe('Jana Müller')
  })

  it('returns null for malformed tokens', () => {
    expect(decodeJwtPayload('nope')).toBeNull()
    expect(decodeJwtPayload('a.!!!.c')).toBeNull()
    expect(decodeJwtPayload('a..c')).toBeNull()
  })
})

describe('profileFromCredential', () => {
  it('maps a valid credential to a profile', () => {
    expect(profileFromCredential(jwt(valid), CLIENT_ID, NOW)).toEqual({
      sub: '1234567890',
      email: 'jana@example.com',
      name: 'Jana Müller',
      givenName: 'Jana',
      picture: 'https://lh3.googleusercontent.com/a/abc'
    })
  })

  it('accepts the issuer without scheme', () => {
    expect(profileFromCredential(jwt({ ...valid, iss: 'accounts.google.com' }), CLIENT_ID, NOW)).not.toBeNull()
  })

  it.each([
    ['foreign audience', { aud: 'other.apps.googleusercontent.com' }],
    ['foreign issuer', { iss: 'https://evil.example' }],
    ['expired', { exp: NOW }],
    ['missing exp', { exp: undefined }],
    ['unverified email', { email_verified: false }],
    ['missing sub', { sub: undefined }],
    ['missing email', { email: undefined }]
  ])('rejects %s', (_label, patch) => {
    expect(profileFromCredential(jwt({ ...valid, ...patch }), CLIENT_ID, NOW)).toBeNull()
  })

  it('rejects everything when no client id is configured', () => {
    expect(profileFromCredential(jwt({ ...valid, aud: '' }), '', NOW)).toBeNull()
  })

  it('falls back to the email when there is no name, and drops non-https pictures', () => {
    const p = profileFromCredential(
      jwt({ ...valid, name: undefined, given_name: undefined, picture: 'http://x/y.png' }),
      CLIENT_ID,
      NOW
    )
    expect(p?.name).toBe('jana@example.com')
    expect(p?.givenName).toBe('jana@example.com')
    expect(p?.picture).toBeNull()
  })
})

describe('profile storage', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips a profile and never stores the credential', () => {
    const profile = profileFromCredential(jwt(valid), CLIENT_ID, NOW)!
    storeProfile(profile)
    const raw = localStorage.getItem(GOOGLE_PROFILE_STORAGE_KEY)!
    expect(raw).not.toContain('signature')
    expect(Object.keys(JSON.parse(raw)).sort()).toEqual(['email', 'givenName', 'name', 'picture', 'sub'])
    expect(loadStoredProfile()).toEqual(profile)
  })

  it('clears on sign-out and ignores corrupt entries', () => {
    storeProfile(null)
    expect(loadStoredProfile()).toBeNull()
    localStorage.setItem(GOOGLE_PROFILE_STORAGE_KEY, '{oops')
    expect(loadStoredProfile()).toBeNull()
    localStorage.setItem(GOOGLE_PROFILE_STORAGE_KEY, JSON.stringify({ sub: 1 }))
    expect(loadStoredProfile()).toBeNull()
  })
})
