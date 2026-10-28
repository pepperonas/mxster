import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { AppProviders } from '@/contexts'
import { musicSeat } from '../musicSeat'
import type { Player, Song } from '@/types'

const fake = vi.hoisted(() => ({
  calls: [] as Array<[string, ...unknown[]]>,
  state: 'idle'
}))

vi.mock('@/services/PreviewPlayerService', () => {
  const player = {
    setConfig: () => {},
    play: (song: { id: string }, at: number) => {
      fake.calls.push(['play', song.id, at])
      fake.state = 'playing'
      return Promise.resolve()
    },
    stop: () => {
      fake.calls.push(['stop'])
      fake.state = 'idle'
    },
    pause: () => fake.calls.push(['pause']),
    resume: () => fake.calls.push(['resume']),
    seek: () => {},
    getState: () => fake.state,
    getCurrentTime: () => 0,
    getDuration: () => 200,
    getSongId: () => null
  }
  return { getPreviewPlayer: () => player }
})

// Imported after the mock
const { Turntable } = await import('@/components/game/Turntable')

const p = (name: string, seat: number, extra: Partial<Player> = {}) => ({ id: name, name, seat, cards: 0, score: 0, timeline: [], ...extra }) as unknown as Player
const players = [p('Host', 0), p('Lisa', 1), p('Tom', 2)]
const members = [
  { seat: 0, online: true, host: true },
  { seat: 1, online: true },
  { seat: 2, online: false }
]

describe('musicSeat — "together in the room"', () => {
  it('is the device of whoever is on turn', () => {
    expect(musicSeat(players, 1, [], members, 0)).toBe(1)
    expect(musicSeat(players, 0, [], members, 0)).toBe(0)
  })

  it('falls back to the host when that device cannot play', () => {
    expect(musicSeat(players, 2, [], members, 0)).toBe(0) // not connected
    expect(musicSeat(players, 1, [1], members, 0)).toBe(0) // skipped as absent
    expect(musicSeat([p('Host', 0), p('Lisa', 1, { left: true })], 1, [], members, 0)).toBe(0) // left
    expect(musicSeat(players, 5, [], members, 0)).toBe(0) // no such player
  })
})

describe('Turntable hands the music over', () => {
  const song = { id: 'song_001', title: 'T', artist: 'A', year: 1990, previewUrl: '/audio/song_001.m4a' } as unknown as Song
  beforeEach(() => {
    fake.calls.length = 0
    fake.state = 'idle'
  })

  const view = (role: 'host' | 'silent', cue: { songId: string; playing: boolean; positionMs: number; at: number } | null) => (
    <MotionTestProvider>
      <AppProviders>
        <Turntable song={song} audioRole={role} cue={cue} clockOffset={() => 0} musicAt="Lisa" />
      </AppProviders>
    </MotionTestProvider>
  )

  it('a silent device never plays, and names whose device has the music', () => {
    const { container } = render(view('silent', null))
    expect(fake.calls.filter((c) => c[0] === 'play')).toEqual([])
    expect(container.textContent).toContain('Lisa')
  })

  it('taking over continues from the last cue; handing over stops', () => {
    const now = Date.now()
    const cue = { songId: 'song_001', playing: true, positionMs: 30_000, at: now }
    const r = render(view('silent', cue))
    act(() => r.rerender(view('host', cue)))
    const play = fake.calls.find((c) => c[0] === 'play')!
    expect(play[1]).toBe('song_001')
    expect(play[2] as number).toBeGreaterThanOrEqual(30)
    expect(play[2] as number).toBeLessThan(32)
    act(() => r.rerender(view('silent', cue)))
    expect(fake.calls[fake.calls.length - 1]).toEqual(['stop'])
  })

  it('a paused song stays paused when it moves', () => {
    const cue = { songId: 'song_001', playing: false, positionMs: 30_000, at: Date.now() }
    const r = render(view('silent', cue))
    act(() => r.rerender(view('host', cue)))
    expect(fake.calls.filter((c) => c[0] === 'play')).toEqual([])
  })
})
