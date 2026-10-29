/**
 * The game in numbers, for everyone of the group: how rounds are played, the
 * catalogue, the songs in play and the achievements. Totals only, no person,
 * no times of day (GET /api/stats/all). The admin page shows the same
 * sections next to its account figures (AdminStats).
 */
import { useMemo, type ReactNode } from 'react'
import { allSongs, songById } from '@/data/catalogue'
import { Columns, type Column } from '@/components/charts/Columns'
import { BarList, ShareBar, StatTile } from '@/components/charts/Bars'
import { MODE_COPY } from '@/game/modeCopy'
import { ACHIEVEMENT_DEFINITIONS, achievementName, type AchievementId } from '@/types/achievements'
import { localeOf, useLang, useMessages } from '@/i18n'
import { adminStatsText } from '@/i18n/messages/adminStats'
import type { GameMode } from '@/types'
import { byRate, decadeTicks, mostPlayed, songPlays, songsPerDecade, songsPerYear, type GroupStatsData } from '@/screens/adminStatsModel'

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4" aria-label={title}>
      <h2 className="text-title-lg">{title}</h2>
      {children}
    </section>
  )
}

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="surface p-4 sm:p-5">
      <h3 className="text-title-sm text-md-on-surface-variant mb-3">{title}</h3>
      {children}
    </div>
  )
}

/** Dates for chart labels and readouts, in the app language. */
export function useDayFormat() {
  const { lang } = useLang()
  return useMemo(() => {
    const dayFmt = new Intl.DateTimeFormat(localeOf(lang), { day: 'numeric', month: 'numeric' })
    const dateFmt = new Intl.DateTimeFormat(localeOf(lang), { day: 'numeric', month: 'long', year: 'numeric' })
    const asDate = (iso: string) => {
      const [y, m, d] = iso.split('-').map(Number)
      return new Date(y, m - 1, d)
    }
    const short = (iso: string) => dayFmt.format(asDate(iso))
    const long = (iso: string) => dateFmt.format(asDate(iso))
    const days = (rows: { day: string; count: number }[]): Column[] => rows.map((r) => ({ key: r.day, label: short(r.day), value: r.count }))
    const dayTicks = (rows: { day: string }[]) => [rows[0]?.day, rows[Math.floor(rows.length / 2)]?.day, rows[rows.length - 1]?.day].filter(Boolean) as string[]
    return { short, long, days, dayTicks }
  }, [lang])
}

export function GroupStats({ stats }: { stats: GroupStatsData }) {
  const t = useMessages(adminStatsText)
  const { lang } = useLang()
  const { long, days, dayTicks } = useDayFormat()
  const sum = (rows: { count: number }[]) => rows.reduce((n, r) => n + r.count, 0)

  const songs = allSongs()
  const years = songsPerYear(songs)
  const plays = songPlays(stats.rounds.songs)
  const titleOf = (id: string) => {
    const s = songById(id)
    return s ? { label: s.title, sub: `${s.artist} · ${s.year}` } : { label: id, sub: '' }
  }
  const played = plays.length
  const top = mostPlayed(plays, 8)
  const hardest = byRate(plays, 6, true)
  const easiest = byRate(plays, 6, false)

  const achievementRows = (Object.keys(ACHIEVEMENT_DEFINITIONS) as AchievementId[]).map((id) => ({ id, n: stats.achievements[id] ?? 0 }))
  const reached = achievementRows.filter((a) => a.n > 0).sort((a, b) => b.n - a.n || a.id.localeCompare(b.id))
  const rarest = [...reached].reverse().slice(0, 6)
  const maxPeople = reached[0]?.n ?? 0

  const pct = (part: number, of: number) => (of > 0 ? Math.round((part / of) * 100) : 0)

  return (
    <>
      <Section title={t.how}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile label={t.avgPeople} value={stats.rounds.avgPeople.toLocaleString(localeOf(lang))} />
          <StatTile label={t.avgMinutes} value={stats.rounds.avgMinutes.toLocaleString(localeOf(lang))} />
          <StatTile label={t.withBots} value={t.percent(pct(stats.rounds.withBots, stats.rounds.total))} note={String(stats.rounds.withBots)} />
          <StatTile label={t.dailyRounds} value={stats.rounds.daily} note={stats.rounds.teams > 0 ? `${t.teams}: ${stats.rounds.teams}` : undefined} />
        </div>
        <Card title={t.modes}>
          <ShareBar
            label={t.modes}
            parts={Object.entries(stats.rounds.modes).map(([mode, n]) => ({ label: MODE_COPY[mode as GameMode]?.name ?? mode, value: n }))}
          />
        </Card>
        <Card title={t.roundsChart}>
          <Columns
            columns={days(stats.rounds.perDay)}
            label={t.roundsChart}
            idle={t.roundsIdle(sum(stats.rounds.perDay))}
            describe={(c) => t.roundsDay(long(c.key), c.value)}
            ticks={dayTicks(stats.rounds.perDay)}
            valueHeading={t.value}
            tableToggle={t.table}
          />
          <p className="meta mt-1">{t.historyNote}</p>
        </Card>
        <Card title={t.dailyChart}>
          <Columns
            columns={days(stats.dailyPerDay)}
            label={t.dailyChart}
            idle={t.dailyIdle(sum(stats.dailyPerDay))}
            describe={(c) => t.dailyDay(long(c.key), c.value)}
            ticks={dayTicks(stats.dailyPerDay)}
            height={72}
            valueHeading={t.value}
            tableToggle={t.table}
          />
        </Card>
      </Section>

      <Section title={t.catalogue}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile label={t.songsTotal} value={songs.length} />
          <StatTile label={t.exotic} value={songs.filter((s) => s.exotic).length} />
          <StatTile label={t.party} value={songs.filter((s) => s.party).length} />
          <StatTile label={t.german} value={songs.filter((s) => s.german).length} />
        </div>
        <Card title={t.yearsChart}>
          <Columns
            columns={years.map((y) => ({ key: String(y.year), label: String(y.year), value: y.count }))}
            label={t.yearsChart}
            idle={years.length ? t.yearsIdle(songs.length, years[0].year, years[years.length - 1].year) : '–'}
            describe={(c) => t.year(c.key, c.value)}
            ticks={decadeTicks(years.map((y) => y.year))}
            height={140}
            valueHeading={t.value}
            tableToggle={t.table}
          />
        </Card>
        <Card title={t.decades}>
          <BarList
            label={t.decades}
            max={Math.max(...songsPerDecade(songs).map((d) => d.count))}
            rows={songsPerDecade(songs).map((d) => ({ key: String(d.decade), label: lang === 'de' ? `${d.decade}er` : `${d.decade}s`, value: d.count, text: String(d.count) }))}
          />
        </Card>
      </Section>

      <Section title={t.inPlay}>
        <div className="grid grid-cols-2 gap-3">
          <StatTile label={t.played} value={t.playedOf(played, songs.length)} />
          <StatTile label={t.neverPlayed} value={Math.max(0, songs.length - played)} />
        </div>
        {top.length > 0 && (
          <Card title={t.mostPlayed}>
            <BarList label={t.mostPlayed} max={top[0].tries} rows={top.map((p) => ({ key: p.id, ...titleOf(p.id), value: p.tries, text: t.times(p.tries) }))} />
          </Card>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          <Card title={t.hardest}>
            {hardest.length ? (
              <BarList label={t.hardest} max={1} rows={hardest.map((p) => ({ key: p.id, ...titleOf(p.id), value: 1 - p.rate, text: t.percent(Math.round(p.rate * 100)) }))} />
            ) : (
              <p className="meta">{t.fewTries}</p>
            )}
          </Card>
          <Card title={t.easiest}>
            {easiest.length ? (
              <BarList label={t.easiest} max={1} rows={easiest.map((p) => ({ key: p.id, ...titleOf(p.id), value: p.rate, text: t.percent(Math.round(p.rate * 100)) }))} />
            ) : (
              <p className="meta">{t.fewTries}</p>
            )}
          </Card>
        </div>
      </Section>

      <Section title={t.achievements}>
        <div className="grid gap-3 md:grid-cols-2">
          <Card title={t.mostCommon}>
            <BarList label={t.mostCommon} max={maxPeople} rows={reached.slice(0, 6).map((a) => ({ key: a.id, label: achievementName(a.id), value: a.n, text: t.people(a.n) }))} />
          </Card>
          <Card title={t.rarest}>
            <BarList label={t.rarest} max={maxPeople} rows={rarest.map((a) => ({ key: a.id, label: achievementName(a.id), value: a.n, text: t.people(a.n) }))} />
          </Card>
        </div>
        <p className="meta">{t.neverReached(achievementRows.length - reached.length, achievementRows.length)}</p>
      </Section>

    </>
  )
}
