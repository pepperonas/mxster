/**
 * The privacy policy makes promises about cookies, lifetimes and deletion.
 * These tests tie each promise to the code that keeps it, so changing the
 * code without the text (or the other way round) fails here.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { LEGAL } from '../content'
import { GAME_CONFIG } from '@/utils/constants'

const ROOT = join(__dirname, '../../../..')
const server = (file: string) => readFileSync(join(ROOT, 'server/app', file), 'utf8')
const text = (lang: 'de' | 'en') =>
  JSON.stringify(LEGAL.privacy[lang].sections)

const num = (src: string, re: RegExp) => {
  const m = re.exec(src)
  if (!m) throw new Error(`not found: ${re}`)
  return m[1]
}

describe('privacy policy matches the code', () => {
  it('names exactly the cookies the server sets', () => {
    const names = [
      num(server('security.py'), /SESSION_COOKIE = "([^"]+)"/),
      num(server('security.py'), /STATE_COOKIE = "([^"]+)"/),
      num(server('api/rooms.py'), /GUEST_COOKIE = "([^"]+)"/)
    ]
    for (const lang of ['de', 'en'] as const) for (const n of names) expect(text(lang)).toContain(n)
  })

  it('states the session lifetime', () => {
    const days = Number(num(server('config.py'), /session_ttl_hours: int = (\d+)/)) / 24
    expect(text('de')).toContain(`(${days} Tage`)
    expect(text('en')).toContain(`(${days} days`)
  })

  it('states the guest cookie lifetime', () => {
    const hours = Number(num(server('api/rooms.py'), /GUEST_COOKIE_MAX_AGE = (\d+) \* 3600/))
    expect(text('de')).toContain(`(${hours} Stunden`)
    expect(text('en')).toContain(`(valid for ${hours} hours`)
  })

  it('states when rooms are deleted, and the server really deletes them', () => {
    const hours = Number(num(server('api/rooms.py'), /ROOM_TTL = timedelta\(hours=(\d+)\)/))
    expect(text('de')).toContain(`${hours} Stunden nach der letzten Aktivität`)
    expect(text('en')).toContain(`${hours} hours after the last activity`)
    expect(server('api/rooms.py')).toMatch(/delete\(Room\)\.where\(Room\.expires_at < utcnow\(\)\)/)
  })

  it('promises account deletion, and the API offers it', () => {
    expect(server('api/auth.py')).toMatch(/@router\.delete\("\/me"/)
    expect(text('de')).toContain('ganze Konto löschen')
    expect(text('en')).toContain('the whole account')
  })

  it('states how many rounds the history keeps', () => {
    expect(text('de')).toContain(`bis zu ${GAME_CONFIG.MAX_HISTORY_GAMES} Runden`)
    expect(text('en')).toContain(`up to ${GAME_CONFIG.MAX_HISTORY_GAMES} rounds`)
  })
})

describe('legal texts', () => {
  it('have the same structure in both languages', () => {
    for (const kind of ['imprint', 'privacy', 'terms'] as const) {
      expect(LEGAL[kind].en.sections.length).toBe(LEGAL[kind].de.sections.length)
    }
  })
})
