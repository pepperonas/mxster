/**
 * Song reports (admin): what players found wrong after a reveal, grouped by
 * song, most reported first. A year fix or taking a song out applies to every
 * round at once (server-side override, see data/catalogue.ts).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { api } from '@/api/client'
import { useUI } from '@/contexts'
import { songs as bundled } from '@/data/songs'
import { setSongOverrides, type SongOverride } from '@/data/catalogue'
import { SongCover } from '@/components/game/SongInfo'
import { Icon } from '@/components/ui/Icon'
import { spring } from '@/motion/springs'
import { useMessages } from '@/i18n'
import { adminText } from '@/i18n/messages/admin'
import { gameText } from '@/i18n/messages/game'
import { apiErrorText } from '@/i18n/messages/errors'
import { audioSrc } from '@/services/PreviewPlayerService'
import type { Song } from '@/types'

export interface SongReportGroup {
  songId: string
  count: number
  reasons: Record<string, number>
  notes: { by: string; reason: string; text: string }[]
  latest: string | null
}

const BY_ID = new Map(bundled.map((s) => [s.id, s]))

export function useReportCount(): number {
  const [n, setN] = useState(0)
  useEffect(() => {
    api<{ reports: SongReportGroup[] }>('/api/admin/reports')
      .then((r) => setN(r.reports.length))
      .catch(() => setN(0))
  }, [])
  return n
}

export function AdminReports({ onCount }: { onCount?: (n: number) => void }) {
  const t = useMessages(adminText)
  const g = useMessages(gameText)
  const { addToast } = useUI()
  const [reports, setReports] = useState<SongReportGroup[] | null>(null)
  const [overrides, setOverrides] = useState<Record<string, SongOverride>>({})
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api<{ reports: SongReportGroup[]; overrides: Record<string, SongOverride> }>('/api/admin/reports')
      setReports(res.reports)
      setOverrides(res.overrides)
      onCount?.(res.reports.length)
      setError(false)
    } catch {
      setError(true)
    }
  }, [onCount])

  useEffect(() => {
    void load()
  }, [load])

  const saveOverride = useCallback(
    async (song: Song, next: SongOverride, toast: string) => {
      try {
        const res = await api<{ overrides: Record<string, SongOverride> }>(`/api/admin/songs/${song.id}`, {
          method: 'PUT',
          json: { year: next.year ?? null, blocked: Boolean(next.blocked) }
        })
        setOverrides(res.overrides)
        setSongOverrides(res.overrides) // this device plays with it at once
        addToast(toast, 'success')
      } catch (e) {
        addToast(apiErrorText(e), 'error')
      }
    },
    [addToast]
  )

  const resolve = useCallback(
    async (group: SongReportGroup, title: string) => {
      try {
        await api(`/api/admin/reports/${group.songId}/resolve`, { method: 'POST' })
        setReports((list) => {
          const next = list?.filter((r) => r.songId !== group.songId) ?? null
          onCount?.(next?.length ?? 0)
          return next
        })
        addToast(t.resolved(title), 'success')
      } catch (e) {
        addToast(apiErrorText(e), 'error')
      }
    },
    [addToast, onCount, t]
  )

  if (error) {
    return (
      <div className="surface p-6 text-center">
        <p className="text-body-lg">{t.loadFailed}</p>
        <button type="button" className="btn btn-tonal m3-state-layer mt-4" onClick={() => void load()}>
          {t.reload}
        </button>
      </div>
    )
  }
  if (!reports) return <div className="m3-loading mx-auto mt-10" aria-label={t.loading}><span className="m3-loading-arc" /></div>

  const corrected = Object.keys(overrides).filter((id) => !reports.some((r) => r.songId === id))

  return (
    <div className="space-y-6">
      {reports.length === 0 ? (
        <div className="py-12 text-center">
          <Icon name="check" size={40} className="mx-auto text-md-on-surface-variant" />
          <p className="mt-4 text-title-md">{t.reportsEmptyTitle}</p>
          <p className="mt-1 meta max-w-[32ch] mx-auto">{t.reportsEmptyText}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false} mode="popLayout">
            {reports.map((group) => {
              const song = BY_ID.get(group.songId)
              return (
                <m.li
                  key={group.songId}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 60, scale: 0.96, transition: spring.effectsDefault }}
                  transition={spring.spatialDefault}
                  className="surface p-4"
                >
                  <SongCard song={song} songId={group.songId} override={overrides[group.songId]} onSave={saveOverride}>
                    <p className="text-label-lg">
                      {t.reportsCount(group.count)}
                      <span className="ml-2 text-label-md text-md-on-surface-variant">
                        {Object.entries(group.reasons)
                          .map(([r, n]) => `${g[`reason_${r}` as 'reason_year'] ?? r}${n > 1 ? ` ×${n}` : ''}`)
                          .join(', ')}
                      </span>
                    </p>
                    {group.notes.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {group.notes.map((n, i) => (
                          <li key={i} className="text-body-sm">
                            <span className="text-md-on-surface-variant">{n.by}: </span>„{n.text}“
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-3 flex justify-end">
                      <button type="button" className="btn btn-tonal m3-state-layer" onClick={() => void resolve(group, song?.title ?? group.songId)}>
                        <Icon name="check" size={20} />
                        {t.resolve}
                      </button>
                    </div>
                  </SongCard>
                </m.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}

      {corrected.length > 0 && (
        <section>
          <h2 className="text-title-md">{t.corrections}</h2>
          <p className="meta mt-1">{t.correctionsHint}</p>
          <ul className="mt-3 space-y-3">
            {corrected.map((id) => (
              <li key={id} className="surface p-4">
                <SongCard song={BY_ID.get(id)} songId={id} override={overrides[id]} onSave={saveOverride} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function SongCard({
  song,
  songId,
  override,
  onSave,
  children
}: {
  song: Song | undefined
  songId: string
  override: SongOverride | undefined
  onSave: (song: Song, next: SongOverride, toast: string) => Promise<void>
  children?: React.ReactNode
}) {
  const t = useMessages(adminText)
  const [year, setYear] = useState(String(override?.year ?? song?.year ?? ''))
  const [playing, setPlaying] = useState(false)
  const audio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => () => audio.current?.pause(), [])

  if (!song) return <p className="text-title-sm">{t.unknownSong(songId)}</p>

  const blocked = Boolean(override?.blocked)
  const shownYear = override?.year ?? song.year
  const parsed = Number(year)
  const yearValid = Number.isInteger(parsed) && parsed >= 1900 && parsed <= 2100

  function toggleListen() {
    if (playing) {
      audio.current?.pause()
      setPlaying(false)
      return
    }
    if (!song?.previewUrl) return
    audio.current ??= new Audio(audioSrc(song.previewUrl))
    audio.current.onended = () => setPlaying(false)
    void audio.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <SongCover song={song} size={56} />
        <div className="min-w-0 flex-1">
          <p className="text-title-sm truncate">{song.title}</p>
          <p className="text-body-sm text-md-on-surface-variant truncate">
            {song.artist} · <span className="tabular">{shownYear}</span>
          </p>
          {override?.year && <p className="text-label-md text-md-primary">{t.correctedNote(song.year, override.year)}</p>}
          {blocked && <p className="text-label-md text-md-error">{t.blockedNote}</p>}
        </div>
        <button type="button" className="icon-btn m3-state-layer" aria-label={playing ? t.stop : t.listen} onClick={toggleListen}>
          <Icon name={playing ? 'pause' : 'play'} size={24} />
        </button>
      </div>

      {children && <div className="mt-3">{children}</div>}

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="block text-label-md text-md-on-surface-variant">{t.yearLabel}</span>
          <input
            className="field mt-1 w-28 tabular"
            inputMode="numeric"
            value={year}
            onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
        </label>
        <button
          type="button"
          className="btn btn-outline m3-state-layer"
          disabled={!yearValid || parsed === shownYear}
          onClick={() => {
            const next = parsed === song.year ? undefined : parsed
            void onSave(song, { year: next, blocked }, next ? t.yearSaved(song.title, parsed) : t.yearReset(song.title))
          }}
        >
          {t.saveYear}
        </button>
        {override?.year && (
          <button
            type="button"
            className="btn btn-text m3-state-layer"
            onClick={() => {
              setYear(String(song.year))
              void onSave(song, { blocked }, t.yearReset(song.title))
            }}
          >
            {t.resetYear}
          </button>
        )}
        <button
          type="button"
          className={`btn btn-text m3-state-layer ${blocked ? '' : 'text-md-error'}`}
          onClick={() =>
            void onSave(song, { year: override?.year, blocked: !blocked }, blocked ? t.songUnblocked(song.title) : t.songBlocked(song.title))
          }
        >
          <Icon name={blocked ? 'check' : 'block'} size={20} />
          {blocked ? t.unblockSong : t.blockSong}
        </button>
      </div>
    </div>
  )
}
