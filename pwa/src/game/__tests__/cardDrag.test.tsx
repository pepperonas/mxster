/**
 * Moving the waiting card again: the drag resolves the gap under the pointer;
 * releasing on its own gap or away from the board changes nothing.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { useCardDrag, fixedShift } from '../useCardDrag'
import { TimelineBoard } from '@/components/game/TimelineBoard'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import type { Song } from '@/types'

const rect = (top: number, height: number, left = 0, width = 300) =>
  ({ top, bottom: top + height, left, right: left + width, height, width, x: left, y: top, toJSON() {} }) as DOMRect

function board(): HTMLOListElement {
  const ol = document.createElement('ol')
  ;[0, 1, 2].forEach((i) => {
    const li = document.createElement('li')
    li.dataset.gapIndex = String(i)
    li.getBoundingClientRect = () => rect(100 + i * 60, 40)
    ol.appendChild(li)
  })
  ol.getBoundingClientRect = () => rect(100, 160)
  return ol
}

const at = (y: number, x = 150) => ({ clientX: x, clientY: y }) as PointerEvent
const info = { velocity: { x: 0, y: 0 } } as never

function setup(home: number | null) {
  const onDrop = vi.fn()
  const onHoverGap = vi.fn()
  const ref = { current: board() }
  const { result } = renderHook(() => useCardDrag({ boardRef: ref, onDrop, onHoverGap, home }))
  const move = (y: number, x?: number, via?: number) => {
    result.current.onDragStart(at(140))
    if (via !== undefined) result.current.onDrag(at(via), info)
    result.current.onDrag(at(y, x), info)
    result.current.onDragEnd()
  }
  return { move, onDrop, onHoverGap }
}

describe('useCardDrag', () => {
  beforeEach(() => window.scrollTo(0, 0))

  it('drops onto another gap', () => {
    const { move, onDrop } = setup(0)
    move(240)
    expect(onDrop).toHaveBeenCalledWith(2)
  })

  it('does nothing when released on its own gap', () => {
    const { move, onDrop, onHoverGap } = setup(1)
    move(180, undefined, 240) // over gap 2, back home, release
    expect(onDrop).not.toHaveBeenCalled()
    // gap 2 lit up on the way; back home nothing is highlighted
    expect(onHoverGap.mock.calls.map(([g]) => g)).toEqual([2, null, null])
  })

  it('does nothing when released away from the board', () => {
    const { move, onDrop } = setup(0)
    move(240, 900)
    expect(onDrop).not.toHaveBeenCalled()
  })
})

describe('waiting card on the board', () => {
  const songs: Song[] = [
    { id: 'a', title: 'Alpha', artist: 'X', year: 1980 },
    { id: 'b', title: 'Beta', artist: 'Y', year: 2000 }
  ] as Song[]
  const pending = { id: 'p', title: 'Pending', artist: 'Z', year: 1990 } as Song

  it('counts as its gap and offers to be moved', () => {
    render(
      <MotionTestProvider>
        <TimelineBoard
          cards={songs.map((song) => ({ song }))}
          interactive
          pendingSong={pending}
          previewGap={1}
          onGapSelect={() => {}}
          onPreviewMove={() => {}}
          label="Board"
        />
      </MotionTestProvider>
    )
    const card = screen.getByLabelText(/Pending — zum Verschieben/)
    expect(card.getAttribute('data-gap-index')).toBe('1')
    expect(card.className).toContain('cursor-grab')
    // the other gaps stay tappable
    expect(document.querySelectorAll('button[data-gap-index]').length).toBe(2)
  })

  it('stays put without a move handler', () => {
    render(
      <MotionTestProvider>
        <TimelineBoard cards={songs.map((song) => ({ song }))} interactive pendingSong={pending} previewGap={1} label="Board" />
      </MotionTestProvider>
    )
    const card = document.querySelector('[data-preview-card]')!
    expect(card.className).not.toContain('cursor-grab')
    expect(card.getAttribute('aria-label')).toBeNull()
  })
})

describe('a card in the fixed dock stays under the pointer while the page scrolls', () => {
  it('fixedShift: the counter-offset is the pointer travel minus Motion offset', () => {
    expect(fixedShift(-150, -150)).toBe(0)
    // Motion added 368 px of page scroll the pointer never travelled
    expect(fixedShift(37, 405)).toBe(-368)
  })

  it('shift follows Motion offset so card = pointer travel, and returns home on release', async () => {
    const ref = { current: board() }
    const { result } = renderHook(() => useCardDrag({ boardRef: ref, onDrop: vi.fn(), onHoverGap: vi.fn(), fixed: true }))
    const { y, shift } = result.current
    result.current.onDragStart(at(500))
    // Motion sets its offset first, then calls onDrag
    y.set(-50)
    result.current.onDrag(at(450), info)
    expect(y.get() + shift.get()).toBe(-50)
    // the page scrolls 300 px: Motion pushes its offset on, the pointer stays still
    y.set(250)
    expect(y.get() + shift.get()).toBe(-50)
    y.set(200)
    result.current.onDrag(at(400), info)
    expect(y.get() + shift.get()).toBe(-100)
    result.current.onDragEnd()
    // no longer following once released (shift springs home on its own)
    const after = shift.get()
    y.set(999)
    expect(shift.get()).toBe(after)
  })

  it('an in-flow card (the waiting card on the board) is left to Motion', () => {
    const ref = { current: board() }
    const { result } = renderHook(() => useCardDrag({ boardRef: ref, onDrop: vi.fn(), onHoverGap: vi.fn() }))
    result.current.onDragStart(at(500))
    result.current.y.set(300)
    expect(result.current.shift.get()).toBe(0)
    result.current.onDragEnd()
  })

  it('the dock card takes y as its style inside a wrapper carrying shift', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/game/PlacementDock.tsx'), 'utf8')
    expect(src).toContain('useCardDrag({ boardRef, onHoverGap, onDrop, fixed: true })')
    expect(src).toContain('<m.div style={{ y: shift }}>')
    expect(src).toContain('style={{ x, y, rotate: tilt }}')
  })
})
