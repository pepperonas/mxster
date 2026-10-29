import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { HomeFooter, DONATE_URL, REPO_URL, REVIEW_URL } from '../HomeFooter'
import { VERSION } from '@/screens/ProfileScreen'

const css = readFileSync(join(process.cwd(), 'src/styles/motion.css'), 'utf8')
const footerCss = css.slice(css.indexOf('HOME FOOTER'))

describe('home footer', () => {
  const view = () =>
    render(
      <MotionTestProvider>
        <MemoryRouter>
          <HomeFooter />
        </MemoryRouter>
      </MotionTestProvider>
    )

  it('three ways to say thanks, each opening outside the app safely', () => {
    view()
    const links = [
      ['Code ansehen', REPO_URL],
      ['Spendieren', DONATE_URL],
      ['Bewerten', REVIEW_URL]
    ] as const
    for (const [name, href] of links) {
      const a = screen.getByRole('link', { name: new RegExp(name) })
      expect(a.getAttribute('href')).toBe(href)
      expect(a.getAttribute('target')).toBe('_blank')
      expect(a.getAttribute('rel')).toBe('noopener noreferrer')
    }
    expect(REPO_URL).toBe('https://github.com/pepperonas/mxtape')
    expect(DONATE_URL).toContain('paypal.com/donate/?business=martin.pfeffer@celox.io')
    expect(REVIEW_URL).toBe('https://g.page/r/CXgdRV3QysvxEBM/review')
  })

  it('then the legal pages, the version and who made it', () => {
    view()
    for (const name of ['Impressum', 'Datenschutz', 'Nutzungsbedingungen']) expect(screen.getByRole('link', { name })).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`mxtape ${VERSION.replace(/\./g, '\\.')}`))).toBeInTheDocument()
  })

  it('the meta line is compact: one line from tablet width, mouse-sized links, touch keeps 48 px', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/HomeFooter.tsx'), 'utf8')
    expect(src).toContain('<LegalLinks compact />')
    expect(src).toMatch(/data-footer-meta[\s\S]{0,10}|md:flex-row/)
    expect(src).toContain('md:flex-row')
    const legal = readFileSync(join(process.cwd(), 'src/legal/LegalScreen.tsx'), 'utf8')
    expect(legal).toContain("compact ? 'min-h-[48px] [@media(pointer:fine)]:min-h-0 [@media(pointer:fine)]:py-1' : 'min-h-[48px]'")
  })

  it('the art is decoration only', () => {
    const { container } = view()
    for (const art of container.querySelectorAll('.mx-thanks-art')) expect(art.getAttribute('aria-hidden')).toBe('true')
  })

  it('sits at the end of the home page', () => {
    const home = readFileSync(join(process.cwd(), 'src/screens/HomeScreen.tsx'), 'utf8')
    expect(home).toContain('<HomeFooter />')
  })
})

describe('footer motion', () => {
  it('hover runs only where pointers hover; focus and press run it too', () => {
    const hoverBlock = /@media \(hover: hover\) \{([\s\S]*?)\n\}/.exec(footerCss)![1]
    expect(hoverBlock).toContain('.mx-thanks:hover .mx-code-line')
    expect(hoverBlock).toContain('.mx-thanks:hover .mx-give-heart')
    expect(hoverBlock).toContain('.mx-thanks:hover .mx-rate-star')
    for (const part of ['mx-code-line', 'mx-give-liquid', 'mx-rate-star']) expect(footerCss).toContain(`.mx-thanks:is(:focus-visible, :active) .${part}`)
  })

  it('reduced motion: no movement, the same end state', () => {
    const reduced = /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/.exec(footerCss)![1]
    expect(reduced).toMatch(/animation: none/)
    expect(reduced).toMatch(/transition: none/)
    expect(reduced).toMatch(/\.mx-rate-star \{ fill-opacity: 1; color: rgb\(var\(--mx-star\)\); \}/)
  })

  it('only transform, opacity and colour move (no layout)', () => {
    // keyframe blocks, one-line or not: count braces from each "@keyframes mx-…"
    const frames = [...footerCss.matchAll(/@keyframes mx-[a-z-]+ \{/g)].map((m) => {
      let depth = 1
      let i = m.index! + m[0].length
      const start = i
      while (depth > 0) depth += footerCss[i] === '{' ? 1 : footerCss[i] === '}' ? -1 : 0, i++
      return footerCss.slice(start, i - 1)
    })
    expect(frames.length).toBe(5)
    for (const f of frames) for (const [, prop] of f.matchAll(/([a-z-]+):/g)) expect(['transform', 'opacity', 'stroke-dashoffset', 'fill-opacity', 'color']).toContain(prop)
  })

  it('the drawing motions use the calm curve (the decelerate one read as a jump)', () => {
    expect(footerCss).toMatch(/--mx-draw: cubic-bezier\(0\.45, 0, 0\.25, 1\)/)
    expect(footerCss).toMatch(/\.mx-give-liquid \{ transform: translateY\(34px\); transition: transform 1100ms var\(--mx-draw\); \}/)
  })
})
