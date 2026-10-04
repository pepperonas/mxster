import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { UIProvider, useUI } from '@/contexts/UIContext'
import { InteractionProvider } from '@/contexts/InteractionContext'
import { Modal } from '../Modal'
import { MotionTestProvider } from '@/test/MotionTestProvider'

let ui: ReturnType<typeof useUI>
function Grab() {
  ui = useUI()
  return null
}

function renderModal() {
  const app = document.createElement('div')
  app.id = 'app'
  document.body.appendChild(app)
  const opener = document.createElement('button')
  opener.textContent = 'opener'
  app.appendChild(opener)
  opener.focus()
  const utils = render(
    <MotionTestProvider>
      <UIProvider>
        <InteractionProvider>
          <Grab />
          <Modal />
        </InteractionProvider>
      </UIProvider>
    </MotionTestProvider>
  )
  return { ...utils, app, opener }
}

describe('Modal lifecycle', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('closeModal() resolves only after the dialog has left the DOM', async () => {
    renderModal()
    act(() => ui.showModal('Titel', <p>Inhalt</p>))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    let resolved = false
    let promise!: Promise<void>
    act(() => {
      promise = ui.closeModal().then(() => {
        resolved = true
      })
    })
    expect(resolved).toBe(false)
    const t0 = performance.now()
    await act(() => promise)
    expect(resolved).toBe(true)
    // resolved by the exit animation, not by the 700 ms safety net
    expect(performance.now() - t0).toBeLessThan(500)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closeModal() on a closed dialog resolves immediately', async () => {
    renderModal()
    await expect(ui.closeModal()).resolves.toBeUndefined()
  })

  it('replaces one dialog with the next (old leaves first)', async () => {
    renderModal()
    act(() => ui.showModal('Erster', <p>eins</p>))
    await screen.findByText('eins')
    act(() => ui.showModal('Zweiter', <p>zwei</p>))
    // The leaving dialog keeps its own content (no flash of the next one)
    const leaving = screen.queryAllByRole('dialog')
    expect(leaving.every((d) => !d.textContent?.includes('zwei'))).toBe(true)
    expect(await screen.findByText('zwei')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('eins')).toBeNull())
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
  })

  it('runs a button, closes, and returns focus to the opener', async () => {
    const { opener } = renderModal()
    let clicked = 0
    act(() => ui.showModal('Frage', <p>?</p>, [{ text: 'OK', variant: 'primary', onClick: () => clicked++ }]))
    const ok = await screen.findByRole('button', { name: 'OK' })
    await waitFor(() => expect(document.activeElement).toBe(ok))
    fireEvent.click(ok)
    expect(clicked).toBe(1)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(document.activeElement).toBe(opener))
  })

  it('makes the app inert while open', async () => {
    const { app } = renderModal()
    act(() => ui.showModal('Titel', <p>x</p>))
    await screen.findByRole('dialog')
    expect(app.hasAttribute('inert')).toBe(true)
    // close synchronously, wait outside act (an async act would hold back the
    // presence update the promise is waiting for)
    act(() => void ui.closeModal())
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(app.hasAttribute('inert')).toBe(false)
  })

  it('closes on Escape unless required', async () => {
    renderModal()
    act(() => ui.showModal('Pflicht', <p>x</p>, [], { required: true }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Schließen' })).toBeNull()

    act(() => ui.showModal('Info', <p>y</p>))
    const info = await screen.findByText('y')
    fireEvent.keyDown(info, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('Enter on non-control content triggers the primary action once', async () => {
    renderModal()
    let clicked = 0
    act(() =>
      ui.showModal('Frage', <p>Text</p>, [
        { text: 'Nein' },
        { text: 'Ja', variant: 'primary', onClick: () => clicked++ }
      ])
    )
    const text = await screen.findByText('Text')
    fireEvent.keyDown(text, { key: 'Enter' })
    expect(clicked).toBe(1)
  })

  it('splits a leading emoji out of the title', async () => {
    renderModal()
    act(() => ui.showModal('🏆 Gewonnen', <p>x</p>))
    const title = await screen.findByRole('heading', { name: /Gewonnen/ })
    expect(title.querySelector('[aria-hidden="true"]')?.textContent).toBe('🏆')
  })
})
