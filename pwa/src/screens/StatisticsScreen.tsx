/**
 * Statistik — what the stored rounds say: headline numbers, the decade profile
 * (spider web, up to three people side by side), wins, activity per week, the
 * modes you play and the songs that trip everyone up.
 */
import { useMemo, useState } from 'react'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { Icon } from '@/components/ui/Icon'
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

export function StatisticsScreen() {
  const navigate = useAppNavigate()
  const t = useMessages(statsText)
  const { history, summaries, myName } = usePlayers()
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

  if (history.length === 0) {
    return (
      <div className="pt-4 md:pt-10">
        <h1 className="text-headline-md mb-6">{t.title}</h1>
        <div className="surface p-8 text-center">
          <Icon name="insights" size={40} className="mx-auto text-md-on-surface-variant" />
          <p className="mt-4 text-title-md">{t.emptyTitle}</p>
          <p className="mt-1 meta">{t.emptyText}</p>
          <button type="button" className="btn btn-brand m3-state-layer mt-6" onClick={() => navigate('/new')}>
            {t.firstRound}
          </button>
        </div>
      </div>
    )
  }

  const people = summaries.filter((s) => s.games > 0)
  const ranked = people.slice(0, 8)
  const hardcore = people.filter((s) => s.guesses > 0)

  return (
    <div className="pt-4 md:pt-10 space-y-6">
      <header>
        <h1 className="text-headline-md">{t.title}</h1>
        <p className="meta mt-1">
          {history.length >= GAME_CONFIG.MAX_HISTORY_GAMES
            ? t.fromLast(history.length)
            : t.fromRounds(history.length)}
        </p>
      </header>

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
