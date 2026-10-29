/**
 * House rule: custom controls only. Every menu is the app's Dropdown, every
 * dialog goes through the UI context's modal, every visible checkbox is the
 * app's Checkbox — never the browser's <select>, confirm(), alert(), prompt()
 * or native box, which look different on every platform.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { Dropdown } from '../Dropdown'
import { Checkbox } from '../Checkbox'

const SRC = join(__dirname, '../../..')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return name === '__tests__' || name === 'test' ? [] : sourceFiles(p)
    return /\.(tsx?|jsx?)$/.test(name) ? [p] : []
  })
}
/** Code without comments, so prose about the rule does not trip it. */
const code = (p: string) =>
  readFileSync(p, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')

describe('custom controls only', () => {
  const files = sourceFiles(SRC).map((p) => ({ p: p.slice(SRC.length + 1), c: code(p) }))

  it('no native select, datalist or dialog element', () => {
    for (const f of files) expect(f.c, f.p).not.toMatch(/<(select|option|datalist|dialog)\b/)
  })

  it('no browser dialogs: confirm, alert, prompt', () => {
    // window.x(…) anywhere, or a bare alert/prompt/confirm called with text (a local confirm() helper is fine)
    const browserDialog = /window\.(confirm|alert|prompt)\s*\(|(?<![\w.])(alert|prompt)\s*\(|(?<![\w.])confirm\s*\(\s*['"`]/
    for (const f of files) expect(f.c, f.p).not.toMatch(browserDialog)
  })

  it('a checkbox input is either the Checkbox component, the Switch, or visually hidden', () => {
    for (const f of files) {
      for (const m of f.c.matchAll(/<input[^>]*type="checkbox"[^>]*>/g)) {
        const ok = /sr-only/.test(m[0]) || f.p.endsWith('components/ui/Checkbox.tsx') || f.p.endsWith('components/ui/Switch.tsx')
        expect(ok, `${f.p}: ${m[0]}`).toBe(true)
      }
    }
  })
})

function Harness({ onChange = () => {} }: { onChange?: (v: string) => void }) {
  const [v, setV] = useState('b')
  return (
    <MotionTestProvider>
      <button type="button">outside</button>
      <Dropdown
        label="Sortieren"
        value={v}
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
          { value: 'c', label: 'Gamma' }
        ]}
        onChange={(x) => {
          setV(x)
          onChange(x)
        }}
      />
    </MotionTestProvider>
  )
}

const trigger = () => screen.getByRole('button', { name: /Sortieren/ })

describe('Dropdown', () => {
  it('opens a listbox on the current option; a click chooses and closes', async () => {
    const changed = vi.fn()
    render(<Harness onChange={changed} />)
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(trigger())
    const list = screen.getByRole('listbox', { name: 'Sortieren' })
    expect(screen.getByRole('option', { name: 'Beta' }).getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(list)
    fireEvent.click(screen.getByRole('option', { name: 'Gamma' }))
    expect(changed).toHaveBeenCalledWith('c')
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
    expect(trigger().textContent).toContain('Gamma')
    expect(document.activeElement).toBe(trigger())
  })

  it('keyboard: arrow down opens, arrows and a letter move, Enter chooses, Escape closes without change', async () => {
    const changed = vi.fn()
    render(<Harness onChange={changed} />)
    fireEvent.keyDown(trigger(), { key: 'ArrowDown' })
    const list = screen.getByRole('listbox')
    fireEvent.keyDown(list, { key: 'ArrowDown' })
    expect(list.getAttribute('aria-activedescendant')).toMatch(/-2$/)
    fireEvent.keyDown(list, { key: 'Home' })
    expect(list.getAttribute('aria-activedescendant')).toMatch(/-0$/)
    fireEvent.keyDown(list, { key: 'g' })
    expect(list.getAttribute('aria-activedescendant')).toMatch(/-2$/)
    fireEvent.keyDown(list, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
    expect(changed).not.toHaveBeenCalled()
    fireEvent.keyDown(trigger(), { key: 'ArrowDown' })
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'ArrowUp' })
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Enter' })
    expect(changed).toHaveBeenCalledWith('a')
  })

  it('a press outside closes it', async () => {
    render(<Harness />)
    fireEvent.click(trigger())
    fireEvent.pointerDown(screen.getByRole('button', { name: 'outside' }))
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  })
})

describe('Checkbox', () => {
  it('is a real checkbox for keyboard and screen readers', () => {
    const onChange = vi.fn()
    render(
      <label>
        <Checkbox checked={false} onChange={onChange} /> Kim
      </label>
    )
    const box = screen.getByRole('checkbox', { name: /Kim/ })
    fireEvent.click(box)
    expect(onChange).toHaveBeenCalledWith(true)
    expect(box.className).toContain('sr-only')
  })
})
