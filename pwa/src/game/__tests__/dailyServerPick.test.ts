import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import { DAILY_TOTAL, dailySongs } from '../daily'
import { songs } from '@/data/songs'

const script = join(process.cwd(), '../server/app/daily_pick.py')
const serverPick = (day: string) => JSON.parse(execFileSync('python3', [script, day, String(DAILY_TOTAL)], { encoding: 'utf8' })) as string[]

describe('the server picks the daily round exactly like the app', () => {
  it.each(['2026-10-28', '2026-10-29', '2026-12-31', '2027-02-28', '2030-07-04'])('%s: same songs, same order', (day) => {
    expect(serverPick(day)).toEqual(dailySongs(day, songs).map((s) => s.id))
  })

  it('from the same pool: the well-known songs of the bundled catalogue', () => {
    const pool = JSON.parse(readFileSync(join(process.cwd(), '../server/app/daily_pool.json'), 'utf8')) as Array<{ id: string; year: number }>
    expect(pool).toEqual(songs.filter((s) => !s.exotic).map((s) => ({ id: s.id, year: s.year })))
  })
})
