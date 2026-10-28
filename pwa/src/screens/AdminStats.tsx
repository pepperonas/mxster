/**
 * Admin statistics: how the app is used (server totals, GET /api/admin/stats)
 * and what is in the catalogue (counted here from the song list). Totals only,
 * no person is named.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '@/api/client'
import { allSongs, songById } from '@/data/catalogue'
import { Columns, type Column } from '@/components/charts/Columns'
import { BarList, ShareBar, StatTile } from '@/components/charts/Bars'
import { MODE_COPY } from '@/game/modeCopy'
import { ACHIEVEMENT_DEFINITIONS, achievementName, type AchievementId } from '@/types/achievements'
import { localeOf, useLang, useMessages } from '@/i18n'
import { adminStatsText } from '@/i18n/messages/adminStats'
import type { GameMode } from '@/types'
import { byRate, decadeTicks, mostPlayed, peak, songPlays, songsPerDecade, songsPerYear, type ServerStats } from './adminStatsModel'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4" aria-label={title}>
      <h2 className="text-title-lg">{title}</h2>
      {children}
    </section>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="surface p-4 sm:p-5">
      <h3 className="text-title-sm text-md-on-surface-variant mb-3">{title}</h3>
      {children}
    </div>
  )
}

export function AdminStats() {
  const t = useMessages(adminStatsText)
  const { lang } = useLang()
  const [stats, setStats] = useState<ServerStats | null>(null)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    setFailed(false)
    try {
      setStats(await api<ServerStats>('/api/admin/stats'))
    } catch {
      setFailed(true)
    }
  }, [])
  useEffect(() => void load(), [load])

  const dayFmt = useMemo(() => new Intl.DateTimeFormat(localeOf(lang), { day: 'numeric', month: 'numeric' }), [lang])
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(localeOf(lang), { day: 'numeric', month: 'long', year: 'numeric' }), [lang])
  const asDate = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const short = (iso: string) => dayFmt.format(asDate(iso))
  const long = (iso: string) => dateFmt.format(asDate(iso))

  const songs = allSongs()
  const years = songsPerYear(songs)

  if (failed)
    return (
      <div className="surface p-6 text-center">
        <p className="text-body-lg">{t.loadFailed}</p>
        <button type="button" className="btn btn-tonal m3-state-layer mt-4" onClick={() => void load()}>
          {t.reload}
        </button>
      </div>
    )
  if (!stats) return <div className="m3-loading mx-auto mt-10" role="status"><span className="m3-loading-arc" /></div>

  const days = (rows: { day: string; count: number }[]): Column[] => rows.map((r) => ({ key: r.day, label: short(r.day), value: r.count }))
  const sum = (rows: { count: number }[]) => rows.reduce((n, r) => n + r.count, 0)
  const lastDay = (rows: { day: string; count: number }[]) => rows[rows.length - 1]?.count ?? 0
  const dayTicks = (rows: { day: string }[]) => [rows[0]?.day, rows[Math.floor(rows.length / 2)]?.day, rows[rows.length - 1]?.day].filter(Boolean) as string[]

  const weekdayNames = t.weekdayNames.split(',')
  const weekdayShort = t.weekdayShort.split(',')
  const hourPeak = peak(stats.rounds.hours)
  const weekdayPeak = peak(stats.rounds.weekdays)

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
    <div className="space-y-10 pb-4">
      <p className="meta">{t.privacy}</p>

      <Section title={t.usage}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile label={t.approved} value={stats.accounts.approved} note={stats.accounts.pending > 0 ? t.waiting(stats.accounts.pending) : undefined} />
          <StatTile label={t.active7} value={stats.accounts.active7} />
          <StatTile label={t.active30} value={stats.accounts.active30} />
          <StatTile label={t.rounds} value={stats.rounds.total} note={stats.rounds.first ? t.roundsSince(long(stats.rounds.first)) : undefined} />
        </div>
        <Card title={t.activeChart}>
          <Columns
            columns={days(stats.activity.perDay)}
            label={t.activeChart}
            idle={t.activeIdle(lastDay(stats.activity.perDay))}
            describe={(c) => t.activeDay(long(c.key), c.value)}
            ticks={dayTicks(stats.activity.perDay)}
            valueHeading={t.value}
            tableToggle={t.table}
          />
          <p className="meta mt-1">{stats.activity.since && stats.activity.since < stats.today ? t.activeSince(long(stats.activity.since)) : t.activeNew}</p>
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
        <Card title={t.signupsChart}>
          <Columns
            columns={stats.accounts.signupsPerWeek.map((w) => ({ key: w.week, label: short(w.week), value: w.count }))}
            label={t.signupsChart}
            idle={t.signupsIdle(sum(stats.accounts.signupsPerWeek))}
            describe={(c) => t.signupsWeek(long(c.key), c.value)}
            height={88}
            valueHeading={t.value}
            tableToggle={t.table}
          />
        </Card>
      </Section>

      <Section title={t.when}>
        <Card title={t.hoursChart}>
          <Columns
            columns={stats.rounds.hours.map((n, h) => ({ key: String(h), label: t.hourShort(h), value: n }))}
            label={t.hoursChart}
            idle={hourPeak >= 0 ? t.hoursIdle(hourPeak) : '–'}
            describe={(c) => t.hour(Number(c.key), c.value)}
            ticks={['0', '6', '12', '18', '23']}
            height={96}
            valueHeading={t.value}
            tableToggle={t.table}
          />
        </Card>
        <Card title={t.weekdaysChart}>
          <Columns
            columns={stats.rounds.weekdays.map((n, d) => ({ key: String(d), label: weekdayShort[d], value: n }))}
            label={t.weekdaysChart}
            idle={weekdayPeak >= 0 ? t.weekdaysIdle(weekdayNames[weekdayPeak]) : '–'}
            describe={(c) => t.weekday(weekdayNames[Number(c.key)], c.value)}
            ticks={['0', '1', '2', '3', '4', '5', '6']}
            height={96}
            valueHeading={t.value}
            tableToggle={t.table}
          />
        </Card>
      </Section>

      <Section title={t.how}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile label={t.avgPeople} value={stats.rounds.avgPeople.toLocaleString(localeOf(lang))} />
          <StatTile label={t.avgMinutes} value={stats.rounds.avgMinutes.toLocaleString(localeOf(lang))} />
          <StatTile label={t.withBots} value={t.percent(pct(stats.rounds.withBots, stats.rounds.total))} note={String(stats.rounds.withBots)} />
          <StatTile label={t.dailyRounds} value={stats.rounds.daily} note={stats.rounds.teams > 0 ? `${t.teams}: ${stats.rounds.teams}` : undefined} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Card title={t.modes}>
            <ShareBar
              label={t.modes}
              parts={Object.entries(stats.rounds.modes).map(([mode, n]) => ({ label: MODE_COPY[mode as GameMode]?.name ?? mode, value: n }))}
            />
          </Card>
          <Card title={t.signIn}>
            <ShareBar label={t.signIn} parts={[{ label: t.google, value: stats.accounts.google }, { label: t.email, value: stats.accounts.email }]} />
          </Card>
        </div>
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

      <Section title={t.community}>
        <div className="grid grid-cols-3 gap-3">
          <StatTile label={t.friendships} value={stats.social.friendships} />
          <StatTile label={t.openRooms} value={stats.social.openRooms} />
          <StatTile label={t.openReports} value={stats.social.openReports} />
        </div>
      </Section>
    </div>
  )
}
