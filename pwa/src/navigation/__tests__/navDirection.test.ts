import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { navKind, TOP_LEVEL_PATHS } from '../navDirection'
import { DESTINATIONS } from '@/shell/AppShell'
import { sharedElement, vtName } from '@/motion/vtName'

const css = readFileSync(join(process.cwd(), 'src/styles/motion.css'), 'utf8')
const pure = css.replace(/\/\*[\s\S]*?\*\//g, '')

describe('navKind', () => {
  it('fades through between destinations of the navigation bar (and the profile)', () => {
    expect(navKind('/', '/history')).toBe('tab')
    expect(navKind('/stats', '/players')).toBe('tab')
    expect(navKind('/achievements', '/profile')).toBe('tab')
    expect(navKind('/players', '/')).toBe('tab')
  })

  it('goes forward into a page below and back out of it', () => {
    expect(navKind('/history', '/history/abc')).toBe('forward')
    expect(navKind('/history/abc', '/history')).toBe('back')
    expect(navKind('/players', '/players/Lisa%20M')).toBe('forward')
    expect(navKind('/', '/new')).toBe('forward')
    expect(navKind('/new', '/')).toBe('back')
    expect(navKind('/profile', '/admin')).toBe('forward')
    expect(navKind('/admin', '/profile')).toBe('back')
  })

  it('a page below one destination reached from another still goes forward, and returns back', () => {
    expect(navKind('/players/Lisa', '/achievements')).toBe('back')
    expect(navKind('/history/a', '/history/b')).toBe('forward')
  })

  it('rises into full-screen pages and sinks out of them', () => {
    expect(navKind('/new', '/game')).toBe('up')
    expect(navKind('/game', '/')).toBe('down')
    expect(navKind('/', '/room/ABCD1234')).toBe('up')
    expect(navKind('/room/ABCD1234', '/game')).toBe('tab')
    expect(navKind('/profile', '/imprint')).toBe('up')
    expect(navKind('/imprint', '/privacy')).toBe('tab')
    expect(navKind('/privacy', '/profile')).toBe('down')
  })

  it('ignores a trailing slash and an unchanged path', () => {
    expect(navKind('/history/', '/history')).toBe('none')
    expect(navKind('/history', '/history')).toBe('none')
  })

  it('knows exactly the shell’s destinations as top level', () => {
    expect([...TOP_LEVEL_PATHS].sort()).toEqual([...DESTINATIONS.map((d) => d.to), '/profile'].sort())
  })
})

describe('wiring', () => {
  it('the router root sets the direction on every page change', () => {
    const app = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
    const root = app.slice(app.indexOf('function Root()'))
    expect(root.slice(0, root.indexOf('return'))).toContain('useNavDirection()')
  })
})

describe('vtName', () => {
  it('turns any name into a CSS identifier, the same one every time', () => {
    for (const key of ['Martin', 'Lisa Müller', 'Zoë 😀', '', 'a b/c"d']) {
      const name = vtName('player', key)
      expect(name).toMatch(/^player-[0-9a-z]+$/)
      expect(vtName('player', key)).toBe(name)
    }
    expect(vtName('player', 'Lisa')).not.toBe(vtName('player', 'Lise'))
  })

  it('marks shared elements with the class the CSS times', () => {
    expect(sharedElement('x')).toEqual({ viewTransitionName: 'x', viewTransitionClass: 'shared' })
    expect(pure).toMatch(/::view-transition-group\(\*\.shared\)\s*\{[^}]*--m3-dur-spatial-default/)
  })
})

describe('route transition styles', () => {
  const rule = (kind: string, side: 'old' | 'new') => {
    const re = new RegExp(`html\\[data-nav='${kind}'\\]::view-transition-${side}\\(root\\),\\s*html\\[data-nav='${kind}'\\]::view-transition-${side}\\(\\*\\):only-child \\{([^}]*)\\}`)
    return re.exec(pure)?.[1] ?? ''
  }

  it('every kind has an outgoing and an incoming rule that also covers one-sided elements', () => {
    for (const kind of ['tab', 'forward', 'back', 'up', 'down']) {
      expect(rule(kind, 'old'), `${kind} old`).toContain('mx-vt-fade-out')
      expect(rule(kind, 'new'), `${kind} new`).toContain('mx-vt-fade-in')
    }
  })

  it('forward and back mirror each other on the X axis; tab has no direction', () => {
    expect(rule('forward', 'new')).toContain('mx-vt-from-right')
    expect(rule('forward', 'old')).toContain('mx-vt-to-left')
    expect(rule('back', 'new')).toContain('mx-vt-from-left')
    expect(rule('back', 'old')).toContain('mx-vt-to-right')
    expect(rule('tab', 'new')).not.toMatch(/from-(left|right)/)
    expect(rule('up', 'new')).toContain('mx-vt-rise')
  })

  it('stays above the theme reveal, which must win by coming later', () => {
    expect(pure.indexOf("html[data-nav='tab']")).toBeLessThan(pure.indexOf('html[data-theme-transition] ::view-transition-old(root)'))
  })

  it('never moves fixed chrome with the page', () => {
    for (const name of ['nav-bar', 'nav-rail', 'top-bar'])
      for (const side of ['old', 'new'])
        expect(pure).toContain(`html[data-nav]::view-transition-${side}(${name}):only-child`)
  })

  it('reduced motion leaves only a cross-fade', () => {
    const reduced = pure.slice(pure.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reduced).toMatch(/html\[data-nav\]::view-transition-new\(root\),\s*html\[data-nav\]::view-transition-new\(\*\):only-child \{\s*animation: mx-vt-fade-in 120ms ease both !important;/)
  })
})
