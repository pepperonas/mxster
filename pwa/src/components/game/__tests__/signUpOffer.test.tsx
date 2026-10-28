import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { GameOver } from '../GameOver'
import { GameMode, type Player } from "@/types"

vi.mock('@/motion/celebrate', () => ({ celebrate: () => () => {} }))

const p = (name: string, cards: number): Player => ({ id: name, name, cards, score: 0, timeline: [] }) as unknown as Player

function Where() {
  const loc = useLocation()
  return <p data-testid="where">{loc.pathname + loc.search}</p>
}

const renderOver = (signUpName?: string) =>
  render(
    <MemoryRouter initialEntries={['/room/ABCD1234']}>
      <MotionTestProvider>
        <Routes>
          <Route
            path="/room/:code"
            element={<GameOver winner={p('Anna', 5)} players={[p('Anna', 5), p('Lisa', 3)]} mode={GameMode.HARDCORE} onHome={() => {}} signUpName={signUpName} />}
          />
          <Route path="/" element={<Where />} />
        </Routes>
      </MotionTestProvider>
    </MemoryRouter>
  )

describe('sign-up offer after an online round', () => {
  it('guests see it, with Google and e-mail', () => {
    renderOver('Lisa')
    expect(screen.getByRole('heading', { name: /selbst eine runde starten/i })).toBeTruthy()
    expect(screen.getByRole('link', { name: /mit google registrieren/i }).getAttribute('href')).toBe('/api/auth/login')
    fireEvent.click(screen.getByRole('button', { name: /mit e-mail registrieren/i }))
    expect(screen.getByTestId('where').textContent).toBe('/?register=1&name=Lisa')
  })

  it('account holders do not', () => {
    renderOver(undefined)
    expect(screen.queryByRole('heading', { name: /selbst eine runde starten/i })).toBeNull()
  })
})
