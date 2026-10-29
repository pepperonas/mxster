import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { TimelineBoard } from '../TimelineBoard'
import { isDoubleTap, DOUBLE_TAP_MS, DOUBLE_TAP_PX } from '@/hooks/useDoubleTap'
import { songLine } from '@/utils/copySong'
import type { Song } from '@/types'

const song = (year: number, title: string, artist = 'Artist'): Song => ({ id: `id-${year}`, title, artist, year })
const cards = [song(1970, 'Paranoid', 'Black Sabbath'), song(1985, 'Take On Me', 'a-ha')].map((s) => ({ song: s }))

let writeText: ReturnType<typeof vi.fn>
beforeEach(() => {
  writeText = vi.fn(() => Promise.resolve())
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
})

const tap = (el: Element, x = 10, y = 10, t = 0) => {
  fireEvent.pointerDown(el, { clientX: x, clientY: y, pointerType: 'touch', timeStamp: t })
  fireEvent.pointerUp(el, { clientX: x, clientY: y, pointerType: 'touch', timeStamp: t + 40 })
}
const board = (props: Partial<React.ComponentProps<typeof TimelineBoard>> = {}) =>
  render(
    <MotionTestProvider>
      <TimelineBoard label="Zeitleiste" cards={cards} {...props} />
    </MotionTestProvider>
  )
const card = (text: string) => screen.getAllByRole('listitem').find((li) => li.textContent?.includes(text))!

describe('double tap', () => {
  it('two quick taps close together count; slow, far or mixed ones do not', () => {
    const a = { t: 0, x: 10, y: 10, type: 'touch' }
    expect(isDoubleTap(a, { ...a, t: 200 })).toBe(true)
    expect(isDoubleTap(a, { ...a, t: DOUBLE_TAP_MS + 1 })).toBe(false)
    expect(isDoubleTap(a, { ...a, t: 200, x: 10 + DOUBLE_TAP_PX + 1 })).toBe(false)
    expect(isDoubleTap(a, { ...a, t: 200, type: 'mouse' })).toBe(false)
    expect(isDoubleTap(null, a)).toBe(false)
  })

  it('copies "Artist – Title" of a face-up card', async () => {
    board()
    const el = card('Take On Me')
    await act(async () => {
      tap(el, 10, 10, 0)
      tap(el, 12, 11, 150)
    })
    expect(songLine({ artist: 'a-ha', title: 'Take On Me' })).toBe('a-ha – Take On Me')
    expect(writeText).toHaveBeenCalledWith('a-ha – Take On Me')
  })

  it('one tap, or a tap that was really a drag/scroll, copies nothing', async () => {
    board()
    const el = card('Paranoid')
    await act(async () => tap(el))
    expect(writeText).not.toHaveBeenCalled()
    // a scroll that ends right where the next tap lands is still not a tap
    await act(async () => {
      fireEvent.pointerDown(el, { clientX: 10, clientY: 60, pointerType: 'touch', timeStamp: 100 })
      fireEvent.pointerUp(el, { clientX: 10, clientY: 11, pointerType: 'touch', timeStamp: 140 })
      tap(el, 10, 10, 200)
    })
    expect(writeText).not.toHaveBeenCalled()
  })

  it('never on the waiting card: its title may be hidden (bonus round)', async () => {
    board({ interactive: true, pendingSong: song(1990, 'Geheim'), previewGap: 1 })
    const waiting = card('Geheim')
    expect(waiting.hasAttribute('data-copyable')).toBe(false)
    await act(async () => {
      tap(waiting, 10, 10, 0)
      tap(waiting, 10, 10, 150)
    })
    expect(writeText).not.toHaveBeenCalled()
    expect(card('Paranoid').hasAttribute('data-copyable')).toBe(true)
  })
})
