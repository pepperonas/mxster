import { describe, it, expect, afterEach } from 'vitest'
import { browserLang, detectLang, LANG_STORAGE_KEY } from '../lang'
import { defineMessages } from '../define'

describe('browserLang', () => {
  it('takes the first German or English preference', () => {
    expect(browserLang(['de-AT', 'en'])).toBe('de')
    expect(browserLang(['fr-FR', 'en-US', 'de'])).toBe('en')
    expect(browserLang(['en-GB'])).toBe('en')
  })

  it('falls back to English for other languages', () => {
    expect(browserLang(['fr-FR', 'es'])).toBe('en')
    expect(browserLang([])).toBe('en')
  })
})

describe('detectLang', () => {
  afterEach(() => localStorage.removeItem(LANG_STORAGE_KEY))

  it('prefers the stored choice over the browser', () => {
    localStorage.setItem(LANG_STORAGE_KEY, 'en')
    expect(detectLang()).toBe('en')
  })

  it('ignores a broken stored value', () => {
    localStorage.setItem(LANG_STORAGE_KEY, 'xx')
    expect(detectLang()).toBe('de') // test setup: browser says de-DE
  })
})

describe('defineMessages', () => {
  it('keeps both languages', () => {
    const m = defineMessages({ de: { hi: (n: string) => `Hallo ${n}` }, en: { hi: (n: string) => `Hi ${n}` } })
    expect(m.de.hi('Anna')).toBe('Hallo Anna')
    expect(m.en.hi('Anna')).toBe('Hi Anna')
  })
})
