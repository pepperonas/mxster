import { describe, it, expect } from 'vitest'
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react'
import { UIProvider, useUI } from '@/contexts/UIContext'
import { Toast } from '../Toast'
import { MotionTestProvider } from '@/test/MotionTestProvider'

let ui: ReturnType<typeof useUI>
function Grab() {
  ui = useUI()
  return null
}

const setup = () =>
  render(
    <MotionTestProvider>
      <UIProvider>
        <Grab />
        <Toast />
      </UIProvider>
    </MotionTestProvider>
  )

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe('Toast', () => {
  it('announces success politely and errors assertively', async () => {
    setup()
    act(() => ui.addToast('Gespeichert', 'success'))
    act(() => ui.addToast('Kaputt', 'error'))
    expect((await screen.findByText('Gespeichert')).closest('li')).toHaveAttribute('role', 'status')
    expect(screen.getByText('Kaputt').closest('li')).toHaveAttribute('role', 'alert')
  })

  it('a new toast does not restart the timer of an existing one', async () => {
    setup()
    act(() => ui.addToast('erster', 'info', 400))
    await screen.findByText('erster')
    await sleep(250)
    act(() => ui.addToast('zweiter', 'info', 5000))
    const t0 = performance.now()
    await waitFor(() => expect(screen.queryByText('erster')).toBeNull(), { timeout: 1000 })
    // ~150 ms left of the original 400 — a restarted timer would need 400 more
    expect(performance.now() - t0).toBeLessThan(380)
    expect(screen.getByText('zweiter')).toBeInTheDocument()
  })

  it('can be dismissed with the close button', async () => {
    setup()
    act(() => ui.addToast('weg damit', 'warning', 0))
    fireEvent.click(await screen.findByRole('button', { name: 'Hinweis schließen' }))
    await waitFor(() => expect(screen.queryByText('weg damit')).toBeNull())
  })
})
