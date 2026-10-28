import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRef, type ReactNode } from 'react'
import { AppProviders, useGame } from '@/contexts'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { useTurnFlow } from '@/game/useTurnFlow'
import { intentHandler } from '../useHostBridge'
import { GameMode, type Player, type Song } from '@/types'
import type { Intent } from '../protocol'

const song = (year: number): Song => ({ id: `s${year}`, title: `Song ${year}`, artist: 'A', year })
const wrapper = ({ children }: { children: ReactNode }) => (
  <MotionTestProvider>
    <AppProviders>{children}</AppProviders>
  </MotionTestProvider>
)

function setup(mode: GameMode, players: Array<Partial<Player> & { name: string }>) {
  const hook = renderHook(
    () => {
      const game = useGame()
      const flow = useTurnFlow({ onGameOver: vi.fn(), onSkipNotice: (_n, a) => a() })
      const latest = useRef({ flow, game })
      latest.current = { flow, game }
      const handle = useRef(intentHandler(() => latest.current))
      return { game, flow, handle: handle.current }
    },
    { wrapper }
  )
  act(() => {
    hook.result.current.game.setGameMode(mode)
    players.forEach(({ name, ...d }) => hook.result.current.game.addPlayer(name, d as never))
  })
  players.forEach(({ name: _n, ...d }, i) => act(() => hook.result.current.game.updatePlayer(i, d)))
  return () => hook.result.current
}

// Two intents in one go, no render in between on the caller's side
const both = (get: ReturnType<typeof setup>, a: [number, Intent], b: [number, Intent]) =>
  act(() => {
    const { handle } = get()
    handle(...a)
    handle(...b)
  })

beforeEach(() => localStorage.clear())

describe('the host handles intents one after the other', () => {
  it('an objection and a pass from the same player: only the first counts', () => {
    const get = setup(GameMode.TIMELINE_GLOBAL, [{ name: 'A', seat: 0, challenges: 3 }, { name: 'B', seat: 1, challenges: 3 }])
    act(() => get().game.addToGlobalTimeline(song(1970), 0))
    act(() => get().game.setCurrentSong(song(1980)))
    act(() => get().flow.placeCard(1))
    both(get, [1, { action: 'pass' } as Intent], [1, { action: 'challenge' } as Intent])
    expect(get().game.pending?.passed).toEqual([1])
    expect(get().game.pending?.choosing).toBeNull()
  })

  it('a reveal intent is never carried out (the window turns the card over)', () => {
    const get = setup(GameMode.TIMELINE_GLOBAL, [{ name: 'A', seat: 0, challenges: 3 }, { name: 'B', seat: 1, challenges: 3 }])
    act(() => get().game.addToGlobalTimeline(song(1970), 0))
    act(() => get().game.setCurrentSong(song(1980)))
    act(() => get().flow.placeCard(1))
    both(get, [0, { action: 'reveal' } as Intent], [1, { action: 'reveal' } as Intent])
    expect(get().game.reveal).toBeNull()
    expect(get().flow.phase).toBe('challenge')
  })

  it('continue twice does not skip a player', () => {
    const get = setup(GameMode.TIMELINE_PERSONAL, [{ name: 'A', seat: 0 }, { name: 'B', seat: 1 }, { name: 'C', seat: 2 }])
    act(() => get().game.setCurrentSong(song(1985)))
    act(() => get().flow.placeCard(0))
    both(get, [0, { action: 'continue' } as Intent], [0, { action: 'continue' } as Intent])
    expect(get().game.currentPlayer).toBe(1)
  })

})

describe('turn change', () => {
  it('never carries an objection into the next turn', () => {
    const get = setup(GameMode.TIMELINE_GLOBAL, [{ name: 'A', seat: 0, challenges: 3 }, { name: 'B', seat: 1, challenges: 3 }])
    act(() => get().game.setPending({ playerIndex: 0, gap: 0, choosing: null } as never))
    act(() => get().game.nextTurn())
    expect(get().game.pending).toBeNull()
  })
})
