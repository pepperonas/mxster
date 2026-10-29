/**
 * The "Wusstest du?" fact after the reveal is its own card: kicker, the fact in
 * body size, a bulb that lights up once (CSS, still under reduced motion).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { AppProviders } from '@/contexts'
import { SongInfo } from '../SongInfo'
import type { Song } from '@/types'

const song: Song = { id: 's1', title: 'Song', artist: 'A', year: 1991, fact: 'Der Fakt.' }
const wrap = (ui: React.ReactNode) =>
  render(
    <MotionTestProvider>
      <AppProviders>{ui}</AppProviders>
    </MotionTestProvider>
  )

describe('fact card', () => {
  it('the fact sits in its own card with a kicker, in body size', () => {
    wrap(<SongInfo song={song} head="none" />)
    const card = document.querySelector('[data-fact]') as HTMLElement
    expect(card).not.toBeNull()
    expect(screen.getByText('Wusstest du?').className).toContain('text-label-md')
    expect(screen.getByText('Der Fakt.').className).toContain('text-body-md')
    expect(card.className).toContain('rounded-m3-lg')
  })

  it('no fact, no card', () => {
    wrap(<SongInfo song={{ ...song, fact: undefined }} head="none" />)
    expect(document.querySelector('[data-fact]')).toBeNull()
  })

  it('the bulb lights up once, and not at all under reduced motion', () => {
    const css = readFileSync(join(process.cwd(), 'src/styles/motion.css'), 'utf8')
    const block = css.slice(css.indexOf('.mx-fact-bulb::after'))
    expect(block).toMatch(/animation: mx-fact-glow \d+ms [^;]*both;/)
    expect(block).not.toMatch(/mx-fact-glow[^;]*infinite/)
    expect(block).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*\.mx-fact-bulb::after \{ animation: none; \}/)
  })

  it('the library uses the same card', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/library/SongDetail.tsx'), 'utf8')
    expect(src).toContain('<FactCard fact={fact} label={t.didYouKnow} />')
  })
})
