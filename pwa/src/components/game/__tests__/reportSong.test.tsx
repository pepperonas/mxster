import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { UIProvider } from '@/contexts/UIContext'
import { Modal } from '@/components'
import { ReportForm } from '../ReportSong'
import type { Song } from '@/types'

const song = { id: 'song_007', title: 'Wonderwall', artist: 'Oasis', year: 1995 } as Song

afterEach(() => vi.unstubAllGlobals())

describe('report a song', () => {
  it('sends the reason and the note', async () => {
    const calls: Array<{ url: string; body: unknown }> = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url: String(url), body: JSON.parse(String(init?.body ?? 'null')) })
        return new Response('{"ok":true}', { status: 202 })
      })
    )
    render(
      <MotionTestProvider>
        <UIProvider>
          <ReportForm song={song} />
          <Modal />
        </UIProvider>
      </MotionTestProvider>
    )
    expect(screen.getByText(/wonderwall/i)).toBeTruthy()
    fireEvent.click(screen.getByLabelText(/schlechter ton/i))
    fireEvent.change(screen.getByLabelText(/was genau/i), { target: { value: 'rauscht' } })
    fireEvent.click(screen.getByRole('button', { name: /^melden$/i }))
    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0]).toEqual({ url: '/api/songs/song_007/report', body: { reason: 'audio', note: 'rauscht' } })
  })
})
