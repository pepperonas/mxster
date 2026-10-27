/**
 * The README's big numbers are typed in. This keeps them true: a badge that
 * says 450 tests while there are 500 is worse than no badge.
 * `node scripts/readme-badges.mjs` recounts and rewrites them.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
// @ts-expect-error plain ESM helper shared with the badge script
import { ROOT, READMES, appVersion, codeLines, songCount, thousands, writtenTests } from '../../../scripts/readme-stats.mjs'

const readmes = (READMES as string[]).map((name) => ({ name, text: readFileSync(join(ROOT, name), 'utf8') }))

function badge(text: string, label: string): string {
  const m = new RegExp(`img\\.shields\\.io/badge/${label}-([^-?)]+)`).exec(text)
  if (!m) throw new Error(`no '${label}' badge`)
  return m[1]
}

const toNumber = (k: string) => Math.round(parseFloat(k) * 1000)

describe('README badges', () => {
  it.each(readmes)('$name shows the app version', ({ text }) => {
    expect(badge(text, 'version')).toBe(appVersion())
  })

  it.each(readmes)('$name shows the song count', ({ text }) => {
    expect(badge(text, 'songs')).toBe(String(songCount()))
  })

  it.each(readmes)('$name does not claim fewer tests than are written', ({ text }) => {
    // The runners report a few more than are written (each / parametrize), never fewer
    const shown = Number(badge(text, 'tests'))
    const written = writtenTests()
    expect(shown).toBeGreaterThanOrEqual(written)
    expect(shown).toBeLessThan(written * 1.15)
  })

  it.each(readmes)('$name shows lines of code within 5 %', ({ text }) => {
    const { code, tests } = codeLines()
    expect(Math.abs(toNumber(badge(text, 'lines%20of%20code')) - code) / code).toBeLessThan(0.05)
    expect(Math.abs(toNumber(badge(text, 'test%20code')) - tests) / tests).toBeLessThan(0.05)
  })

  it('formats thousands with one decimal', () => {
    expect(thousands(17345)).toBe('17.3k')
  })
})
