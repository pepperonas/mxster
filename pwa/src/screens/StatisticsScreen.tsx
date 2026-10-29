/**
 * Statistik — what the stored rounds say: headline numbers, the decade profile
 * (spider web, up to three people side by side), wins, activity per week, the
 * modes you play and the songs that trip everyone up.
 */
import { useGameHistory } from '@/contexts/GameHistoryContext'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonBlock, SkeletonGroup } from '@/components/ui/Skeleton'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '@/api/client'
import { GroupStats } from '@/components/stats/GroupStats'
import type { GroupStatsData } from './adminStatsModel'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { StatTile, BarList, WeekColumns, ShareBar } from '@/components/charts/Bars'
import { DecadeProfile } from '@/components/charts/DecadeProfile'
import { SERIES_COLORS } from '@/components/charts/RadarChart'
import { usePlayers } from '@/game/usePlayers'
import { groupStats, weeklyRounds } from '@/game/stats'
import { MODE_COPY } from '@/game/modeCopy'
import { songs } from '@/data/songs'
import { GAME_CONFIG } from '@/utils/constants'
import type { GameMode } from '@/types'
import { localeOf, msg, useMessages } from '@/i18n'
import { statsText } from '@/i18n/messages/stats'
import { libraryText } from '@/i18n/messages/library'
import { allSongs } from '@/data/catalogue'
import { SongCover } from '@/components/game/SongInfo'
import { Icon } from '@/components/ui/Icon'

const MAX_COMPARED = 3
const SONG_BY_ID = new Map(songs.map((s) => [s.id, s]))
const pct = (v: number | null) => (v === null ? '–' : msg(statsText).percent(Math.round(v * 100)))

function formatPlayTime(ms: number): string {
  const t = msg(statsText)
  const min = Math.round(ms / 60000)
  if (min < 60) return t.minutes(min)
  const h = Math.floor(min / 60)
  return t.hours(`${h}:${String(min % 60).padStart(2, '0')}`)
}

/** Five covers for the entry card, the same all day, another set tomorrow. */
function coversOfTheDay(n = 5): string[] {
  const list = allSongs()
  const day = Math.floor(Date.now() / 86_400_000)
  const step = Math.max(1, Math.floor(list.length / n))
  return Array.from({ length: Math.min(n, list.length) }, (_, i) => list[(day * 7 + i * step) % list.length].id)
}

/** The way into the song library: a fan of covers, the count, one tap. */
function LibraryEntry() {
  const t = useMessages(libraryText)
  const navigate = useAppNavigate()
  const covers = useMemo(() => coversOfTheDay(), [])
  return (
    <button
      type="button"
      onClick={() => navigate('/stats/songs')}
      className="row w-full !bg-md-surface-container m3-state-layer !py-4"
      data-library-entry
    >
      <span className="relative shrink-0 h-14" style={{ width: 56 + (covers.length - 1) * 14 }} aria-hidden="true">
        {covers.map((id, i) => (
          <span
            key={id}
            className="absolute top-0 rounded-m3-md shadow-m3-1 ring-2 ring-md-surface-container"
            style={{ left: i * 14, zIndex: covers.length - i, transform: `rotate(${(i - 2) * 3}deg)` }}
          >
            <SongCover song={{ id }} size={56} />
          </span>
        ))}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-title-md">{t.entryTitle(allSongs().length)}</span>
        <span className="block text-body-md text-md-on-surface-variant">{t.entryText}</span>
      </span>
      <Icon name="chevron" className="text-md-on-surface-variant" />
    </button>
  )
}

/**
 * „Alle zusammen“: the group's totals from every account (GET /api/stats/all) —
 * how rounds are played, the catalogue, the songs in play, the achievements.
 * No names, no times of day; the admin page adds those parts.
 */
function Everyone() {
  const t = useMessages(statsText)
  const [data, setData] = useState<GroupStatsData | null>(null)
  const [failed, setFailed] = useState(false)
  const load = useCallback(async () => {
    setFailed(false)
    try {
      setData(await api<GroupStatsData>('/api/stats/all'))
    } catch {
      setFailed(true)
    }
  }, [])
  useEffect(() => void load(), [load])
  return (
    <section className="space-y-8 pt-4 border-t border-md-outline-variant/60" aria-labelledby="everyone-h" data-everyone>
      <header>
        <h2 id="everyone-h" className="text-headline-sm">
          {t.groupTitle}
        </h2>
        <p className="meta mt-1">{t.groupText}</p>
      </header>
      {failed ? (
        <div className="surface p-6 text-center">
          <p className="text-body-lg">{t.groupFailed}</p>
          <button type="button" className="btn btn-tonal m3-state-layer mt-4" onClick={() => void load()}>
            {t.groupReload}
          </button>
        </div>
      ) : data ? (
        <div className="space-y-10">
          <GroupStats stats={data} />
        </div>
      ) : (
        <SkeletonGroup className="space-y-4">
          <SkeletonBlock className="h-40 rounded-m3-xl" />
          <SkeletonBlock className="h-56 rounded-m3-xl" />
        </SkeletonGroup>
      )}
    </section>
  )
}

export function StatisticsScreen() {
  const navigate = useAppNavigate()
  const t = useMessages(statsText)
  const { history, summaries, myName } = usePlayers()
  const { ready } = useGameHistory()
  const group = useMemo(() => groupStats(history), [history])
  const weeks = useMemo(() => weeklyRounds(history), [history])

  // Compared in the spider web: you first, then whoever played most
  const defaults = useMemo(() => {
    const byGames = [...summaries].sort((a, b) => b.games - a.games).map((s) => s.name)
    const ordered = byGames.includes(myName) ? [myName, ...byGames.filter((n) => n !== myName)] : byGames
    return ordered.slice(0, Math.min(2, MAX_COMPARED))
  }, [summaries, myName])
  const [chosen, setChosen] = useState<string[] | null>(null)
  const compared = (chosen ?? defaults).filter((n) => summaries.some((s) => s.name === n))

  const toggle = (name: string) =>
    setChosen((prev) => {
      const cur = (prev ?? defaults).filter((n) => summaries.some((s) => s.name === n))
      if (cur.includes(name)) return cur.length > 1 ? cur.filter((n) => n !== name) : cur
      return cur.length >= MAX_COMPARED ? [...cur.slice(1), name] : [...cur, name]
    })

  // Still loading from the account: no "nothing here yet" in the meantime
  if (history.length === 0 && !ready)
    return (
      <div className="pt-4 md:pt-10">
        <h1 className="text-headline-md mb-6">{t.title}</h1>
        <SkeletonGroup className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonBlock key={i} className="h-[104px] rounded-m3-lg" />
            ))}
          </div>
          <SkeletonBlock className="h-80 rounded-m3-xl" />
        </SkeletonGroup>
      </div>
    )
  if (history.length === 0) {
    return (
      <div className="pt-4 md:pt-10">
        <h1 className="text-headline-md mb-6">{t.title}</h1>
        <EmptyState
          icon="insights"
          title={t.emptyTitle}
          text={t.emptyText}
          action={<button type="button" className="btn btn-brand m3-state-layer" onClick={() => navigate('/new')}>{t.firstRound}</button>}
        />
        <div className="mt-6">
          <LibraryEntry />
        </div>
        <div className="mt-10">
          <Everyone />
        </div>
      </div>
    )
  }

  const people = summaries.filter((s) => s.games > 0)
  const ranked = people.slice(0, 8)
  const hardcore = people.filter((s) => s.guesses > 0)

  return (
    <div className="pt-4 md:pt-10 space-y-6 stagger-children">
      <header>
        <h1 className="text-headline-md">{t.title}</h1>
        <p className="meta mt-1">
          {history.length >= GAME_CONFIG.MAX_HISTORY_GAMES
            ? t.fromLast(history.length)
            : t.fromRounds(history.length)}
        </p>
      </header>

      <LibraryEntry />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label={t.roundsLabel} value={history.length} note={t.playersNote(people.length)} />
        <StatTile label={t.songsPlayed} value={group.songs} />
        <StatTile
          label={t.hitRate}
          value={pct(group.accuracy)}
          note={group.accuracy === null ? t.fromNextRound : t.tries(group.tries)}
        />
        {group.timedRounds > 0 ? (
          <StatTile
            label={t.playTime}
            value={formatPlayTime(group.playMs)}
            note={t.perRound(formatPlayTime(group.playMs / group.timedRounds))}
          />
        ) : (
          <StatTile label={t.playTime} value="–" note={t.fromNextRound} />
        )}
      </div>

      <section className="surface p-5 space-y-4" aria-labelledby="profile-h">
        <div>
          <h2 id="profile-h" className="text-title-lg">
            {t.profile}
          </h2>
          <p className="meta">{t.profileHint}</p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t.compared}>
          {people.map((p) => {
            const at = compared.indexOf(p.name)
            return (
              <button key={p.name} type="button" className="chip m3-state-layer" aria-pressed={at >= 0} onClick={() => toggle(p.name)}>
                {at >= 0 && (
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: `rgb(${SERIES_COLORS[at]})` }} aria-hidden />
                )}
                {p.name}
              </button>
            )
          })}
        </div>
        <DecadeProfile people={compared.map((n) => people.find((p) => p.name === n)!).filter(Boolean)} />
      </section>

      <section className="surface p-5" aria-labelledby="wins-h">
        <h2 id="wins-h" className="text-title-lg mb-4">
          {t.wins}
        </h2>
        <BarList
          label={t.winsPerPerson}
          max={Math.max(1, ...ranked.map((s) => s.wins))}
          rows={ranked.map((s) => ({
            key: s.name,
            label: s.name,
            value: s.wins,
            text: `${s.wins}`,
            sub: t.winsSub(s.games, Math.round((s.wins / Math.max(1, s.games)) * 100)),
            strong: s.name === myName
          }))}
        />
      </section>

      <section className="surface p-5" aria-labelledby="week-h">
        <h2 id="week-h" className="text-title-lg mb-3">
          {t.perWeek}
        </h2>
        <WeekColumns weeks={weeks} label={t.perWeekLabel} />
      </section>

      <section className="surface p-5" aria-labelledby="modes-h">
        <h2 id="modes-h" className="text-title-lg mb-4">
          {t.modes}
        </h2>
        <ShareBar
          label={t.perMode}
          parts={(['timeline_personal', 'timeline_global', 'hardcore'] as GameMode[]).map((m) => ({
            label: MODE_COPY[m].name,
            value: group.modes[m]
          }))}
        />
      </section>

      {hardcore.length > 0 && (
        <section className="surface p-5" aria-labelledby="hc-h">
          <h2 id="hc-h" className="text-title-lg">
            {t.years}
          </h2>
          <p className="meta mb-4">{t.yearsHint}</p>
          <BarList
            label={t.yearsOff}
            max={Math.max(1, ...hardcore.map((s) => s.yearOff ?? 0))}
            rows={[...hardcore]
              .sort((a, b) => (a.yearOff ?? 99) - (b.yearOff ?? 99))
              .map((s) => ({
                key: s.name,
                label: s.name,
                value: s.yearOff ?? 0,
                text: `± ${(s.yearOff ?? 0).toLocaleString(localeOf(), { maximumFractionDigits: 1 })}`,
                sub: t.exactYears(s.exactYears),
                strong: s.name === myName
              }))}
          />
        </section>
      )}

      {(group.hardest.length > 0 || group.safest.length > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          <SongList title={t.hardest} items={group.hardest} text={(s) => t.wrongOf(s.wrong, s.tries)} />
          <SongList title={t.safest} items={group.safest} text={(s) => t.timesRight(s.tries)} />
        </div>
      )}

      <Everyone />
    </div>
  )
}

function SongList({
  title,
  items,
  text
}: {
  title: string
  items: Array<{ id: string; tries: number; wrong: number }>
  text: (s: { tries: number; wrong: number }) => string
}) {
  if (items.length === 0) return null
  return (
    <section className="surface p-5" aria-label={title}>
      <h2 className="text-title-lg mb-3">{title}</h2>
      <ol className="space-y-2">
        {items.map((s) => {
          const song = SONG_BY_ID.get(s.id)
          return (
            <li key={s.id} className="flex items-baseline gap-3">
              <span className="w-12 shrink-0 text-title-sm tabular text-md-primary">{song?.year ?? '–'}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body-md">{song?.title ?? s.id}</span>
                <span className="block truncate text-body-sm text-md-on-surface-variant">{song?.artist}</span>
              </span>
              <span className="shrink-0 text-body-sm tabular text-md-on-surface-variant">{text(s)}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
