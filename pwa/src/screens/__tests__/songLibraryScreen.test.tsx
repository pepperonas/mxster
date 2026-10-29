import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { AppProviders } from '@/contexts/AppProviders'
import { allSongs } from '@/data/catalogue'
import type { Song } from '@/types'

const player = { setConfig: vi.fn(), play: vi.fn(() => Promise.resolve()), stop: vi.fn(), pause: vi.fn() }
vi.mock('@/services/PreviewPlayerService', () => ({ getPreviewPlayer: () => player }))
const { SongLibraryScreen } = await import('../SongLibraryScreen')
const { SongDetail, LISTEN_S } = await import('@/components/library/SongDetail')

let search = ''
function Where() {
  search = useLocation().search
  return null
}
const page = (entry = '/stats/songs') =>
  render(
    <MotionTestProvider>
      <MemoryRouter initialEntries={[entry]}>
        <AppProviders>
          <Routes>
            <Route path="/stats/songs" element={<><SongLibraryScreen /><Where /></>} />
          </Routes>
        </AppProviders>
      </MemoryRouter>
    </MotionTestProvider>
  )

const count = () => document.querySelector('[data-count]')!.textContent

describe('song library page', () => {
  it('shows every song, sorted by year with a head per decade', () => {
    page()
    const total = allSongs().length
    expect(count()).toBe(`${total} Songs`)
    expect(document.querySelectorAll('[data-song-tile]').length).toBe(total)
    const heads = [...document.querySelectorAll('[data-decade-head]')].map((h) => h.textContent)
    expect(heads[0]).toMatch(/^1950er/)
  })

  it('typing searches after a short pause and the address keeps it (reload, way back)', { timeout: 15000 }, async () => {
    page()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '1984' } })
    await waitFor(() => expect(search).toContain('q=1984'), { timeout: 5000 })
    const n = allSongs().filter((s) => s.year === 1984).length
    expect(count()).toBe(`${n} von ${allSongs().length}`)
  })

  it('opens with the state from the address: query, sort, direction, filters', () => {
    page('/stats/songs?sort=title&dir=desc&dec=1980&exotics=0')
    expect((document.querySelector('[data-sort]') as HTMLSelectElement).value).toBe('title')
    expect(document.querySelector('[data-sort-dir]')!.getAttribute('data-sort-dir')).toBe('desc')
    const shown = [...document.querySelectorAll('[data-song-tile]')].length
    expect(shown).toBe(allSongs().filter((s) => s.year >= 1980 && s.year < 1990 && !s.exotic).length)
    expect(document.querySelector('[data-filters]')).not.toBeNull() // filters open when some are on
  })

  it('nothing found: offers the closest name', { timeout: 15000 }, async () => {
    page()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Qeeenxx' } })
    await waitFor(() => expect(screen.getByText(/Nichts gefunden/)).toBeInTheDocument(), { timeout: 5000 })
    fireEvent.click(screen.getByRole('button', { name: /Meintest du/ }))
    await waitFor(() => expect(Number(count()!.split(' ')[0])).toBeGreaterThan(0), { timeout: 5000 })
  })

  it('the list view is remembered on this device', () => {
    page()
    fireEvent.click(screen.getByRole('button', { name: 'Als Liste' }))
    expect(document.querySelectorAll('[data-song-row]').length).toBe(allSongs().length)
    expect(localStorage.getItem('mxtape_library_view')).toBe('list')
    localStorage.removeItem('mxtape_library_view')
  })
})

describe('a song in the dialog', () => {
  const song = allSongs().find((s) => s.fact && s.album) as Song

  it('shows year, title, artist, album, fact and the group rate', () => {
    render(
      <MotionTestProvider>
        <AppProviders>
          <SongDetail song={song} rate={{ tries: 4, right: 3 }} />
        </AppProviders>
      </MotionTestProvider>
    )
    const box = document.querySelector('[data-song-detail]')!
    for (const text of [String(song.year), song.title, song.artist, song.album!, song.fact!]) expect(box.textContent).toContain(text)
    expect(box.textContent).toContain('75 % · 3 von 4')
  })

  it('listens from where the song starts, stops after the preview and when the dialog closes', () => {
    vi.useFakeTimers()
    player.play.mockClear()
    player.stop.mockClear()
    const late = allSongs().find((s) => (s.startMs ?? 0) > 1000)!
    const { unmount } = render(
      <MotionTestProvider>
        <AppProviders>
          <SongDetail song={late} />
        </AppProviders>
      </MotionTestProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: /Anhören/ }))
    expect(player.play).toHaveBeenCalledWith(late, late.startMs! / 1000)
    act(() => vi.advanceTimersByTime(LISTEN_S * 1000))
    expect(player.stop).toHaveBeenCalledTimes(1)
    unmount()
    expect(player.stop).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })
})
