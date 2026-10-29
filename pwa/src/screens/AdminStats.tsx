/**
 * Admin statistics: how the app is used (server totals, GET /api/admin/stats).
 * The game's own numbers (rounds, catalogue, songs in play, achievements) are
 * the shared GroupStats every player sees too; this page adds the accounts,
 * the activity, the times of day and the community. Totals only, no person.
 */
import { useCallback, useEffect, useState } from 'react'
import { api } from '@/api/client'
import { Columns } from '@/components/charts/Columns'
import { ShareBar, StatTile } from '@/components/charts/Bars'
import { Card, GroupStats, Section, useDayFormat } from '@/components/stats/GroupStats'
import { useMessages } from '@/i18n'
import { adminStatsText } from '@/i18n/messages/adminStats'
import { peak, type ServerStats } from './adminStatsModel'

export function AdminStats() {
  const t = useMessages(adminStatsText)
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
  const { short, long, days, dayTicks } = useDayFormat()

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

  const sum = (rows: { count: number }[]) => rows.reduce((n, r) => n + r.count, 0)
  const lastDay = (rows: { day: string; count: number }[]) => rows[rows.length - 1]?.count ?? 0

  const weekdayNames = t.weekdayNames.split(',')
  const weekdayShort = t.weekdayShort.split(',')
  const hourPeak = peak(stats.rounds.hours)
  const weekdayPeak = peak(stats.rounds.weekdays)

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
        <Card title={t.signIn}>
          <ShareBar label={t.signIn} parts={[{ label: t.google, value: stats.accounts.google }, { label: t.email, value: stats.accounts.email }]} />
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

      <GroupStats stats={stats} />

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
