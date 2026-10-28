import { describe, it, expect, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { COLOR_SCHEMES, COLOR_SCHEME_IDS, DEFAULT_COLOR_SCHEME } from '../colorSchemes'
import { applyAppearance, COLOR_STORAGE_KEY, normalizeSettings, themeColor } from '@/contexts/SettingsContext'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { LanguageProvider, setCurrentLang } from '@/i18n'
import { profileText } from '@/i18n/messages/profile'

// Tests run from pwa/
const css = readFileSync(join(process.cwd(), 'src/styles/design-tokens.css'), 'utf8')
const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8')

afterEach(() => {
  delete document.documentElement.dataset.color
  document.documentElement.dataset.theme = 'dark'
  localStorage.clear()
  setCurrentLang('de')
})

describe('colour schemes', () => {
  it('vinyl stays the default and every other scheme has its own palette block', () => {
    expect(DEFAULT_COLOR_SCHEME).toBe('vinyl')
    expect(COLOR_SCHEME_IDS.length).toBeGreaterThanOrEqual(5)
    for (const id of COLOR_SCHEME_IDS) {
      if (id === DEFAULT_COLOR_SCHEME) continue
      const block = css.split(`[data-color='${id}'] {`)[1]?.split('}')[0] ?? ''
      // accents, the second accent, tinted surfaces and the third chart hue — not the meaning colours
      for (const name of ['primary', 'secondary', 'tertiary', 'neutral', 'neutral-variant', 'data']) expect(block, `${id} ${name}`).toContain(`--md-ref-${name}-40:`)
      for (const name of ['error', 'success', 'warning']) expect(block, `${id} ${name}`).not.toContain(`--md-ref-${name}-`)
    }
  })

  it('the pre-paint in index.html knows every scheme and paints the loader from it', () => {
    const map = JSON.parse(/var MX_SCHEMES = (\{.*?\});/.exec(html)![1]) as Record<string, { d: string[]; l: string[] }>
    expect(Object.keys(map)).toEqual(COLOR_SCHEME_IDS)
    for (const id of COLOR_SCHEME_IDS) {
      expect(map[id].d[0]).toBe(COLOR_SCHEMES[id].dark.surface)
      expect(map[id].l[0]).toBe(COLOR_SCHEMES[id].light.surface)
    }
    // no fixed page background left in index.html: it would beat the app's CSS forever
    expect(html).not.toMatch(/html\s*\{[^}]*background/)
    expect(html).not.toMatch(/html\[data-theme="light"\]\s*\{\s*background/)
  })

  it('names every scheme in both languages', () => {
    for (const lang of ['de', 'en'] as const) {
      setCurrentLang(lang)
      const t = profileText[lang] as unknown as Record<string, string>
      for (const id of COLOR_SCHEME_IDS) expect(t[`color_${id}`], `${lang} ${id}`).toBeTruthy()
    }
  })
})

describe('the colour setting', () => {
  it('survives only as a known scheme', () => {
    expect(normalizeSettings({ color: 'ocean' }).color).toBe('ocean')
    expect(normalizeSettings({ color: 'neon' }).color).toBe('vinyl')
    expect(normalizeSettings({}).color).toBe('vinyl')
  })

  it('takes the device copy when the account has none yet', () => {
    localStorage.setItem(COLOR_STORAGE_KEY, 'moss')
    expect(normalizeSettings({}).color).toBe('moss')
  })

  it('applies theme and colour together: attribute, storage for the pre-paint, browser bar', () => {
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
    applyAppearance('light', 'lagoon')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(document.documentElement.dataset.color).toBe('lagoon')
    expect(localStorage.getItem(COLOR_STORAGE_KEY)).toBe('lagoon')
    expect(meta.content).toBe(themeColor('lagoon', 'light'))
    applyAppearance('dark', 'vinyl')
    expect(document.documentElement.dataset.color).toBeUndefined()
    expect(meta.content).toBe('#191113')
    meta.remove()
  })
})

describe('ColorPicker', () => {
  const renderPicker = (value = 'vinyl' as const, onChange = vi.fn()) => {
    render(
      <LanguageProvider initial="de">
        <ColorPicker value={value} onChange={onChange} />
      </LanguageProvider>
    )
    return onChange
  }

  it('offers every scheme as a named radio, the current one checked', () => {
    renderPicker()
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(COLOR_SCHEME_IDS.length)
    expect(screen.getByRole('radio', { name: 'Vinyl (Magenta)' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('radiogroup', { name: 'Farbe' })).toBeTruthy()
  })

  it('picks by tap and by arrow keys, and ignores a tap on the current one', () => {
    const onChange = renderPicker()
    fireEvent.click(screen.getByRole('radio', { name: 'Ozean' }))
    expect(onChange).toHaveBeenLastCalledWith('ocean', expect.any(HTMLElement))
    fireEvent.click(screen.getByRole('radio', { name: 'Vinyl (Magenta)' }))
    expect(onChange).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenLastCalledWith(COLOR_SCHEME_IDS[COLOR_SCHEME_IDS.length - 1], expect.any(HTMLElement))
  })
})

describe('the generator', () => {
  it('is up to date and every scheme passes its contrast and distance checks', async () => {
    const { execFileSync } = await import('node:child_process')
    // exits non-zero (and throws here) on a failing scheme or a stale generated file
    expect(() => execFileSync('node', ['scripts/gen-tokens.mjs', '--check'], { cwd: process.cwd(), stdio: 'pipe' })).not.toThrow()
  })
})
