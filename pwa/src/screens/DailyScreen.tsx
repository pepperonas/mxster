/**
 * Tagesrunde: the same songs for everyone today, until the first card lands
 * wrong; the streak counts and the friends' board ranks it. The run lives on
 * the server (api/daily.py): starting asks it first, so a paused run is
 * continued — on any device — and a finished one can never be started again.
 * A run in this tab's game state (a reload) simply goes on.
 */
import { useCallback, useEffect, useState } from 'react'
import { m } from 'motion/react'
import { api, ApiError } from '@/api/client'
import { useMe } from '@/auth/AuthContext'
import { useGame, useUI } from '@/contexts'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { SubPageHeader } from '@/shell/AppShell'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { DAILY_MAX, dailySongs, localDay, resumedTimeline } from '@/game/daily'
import { songs as bundledSongs } from '@/data/songs'
import { songById } from '@/data/catalogue'
import { songKey } from '@/game/songPool'
import { ownPlayerName } from '@/game/owner'
import { spring } from '@/motion/springs'
import { getLang, localeOf, msg, useMessages } from '@/i18n'
import { dailyText } from '@/i18n/messages/daily'
import { GameMode, type Song } from '@/types'

export type DailyState = 'none' | 'running' | 'finished'

export interface DailyRow {
  id: number
  name: string
  picture: string
  score: number
  total: number
  turns: number
  state: DailyState
  me: boolean
}

export interface DailyBoard {
  day: string
  max: number
  state: DailyState
  mine: DailyRow | null
  board: DailyRow[]
  running: DailyRow[]
}

/** A row's result: the streak — or, for a day from before (10 songs), "7 von 10". */
export function resultLabel(r: Pick<DailyRow, 'score' | 'total'>): string {
  const t = msg(dailyText)
  return r.total === 10 ? t.resultOld(r.score, r.total) : t.streak(r.score)
}

export function useDailyBoard(day = localDay()) {
  const [board, setBoard] = useState<DailyBoard | null>(null)
  const [error, setError] = useState(false)
  const load = useCallback(async () => {
    try {
      setBoard(await api<DailyBoard>(`/api/daily/${day}`))
      setError(false)
    } catch {
      setError(true)
    }
  }, [day])
  useEffect(() => {
    void load()
  }, [load])
  return { board, error, load }
}

/** The day's songs as the server fixed them (unknown ids skipped), else this device's own. */
export function daySongsFrom(ids: string[] | null | undefined, own: Song[]): Song[] {
  if (!ids || ids.length === 0) return own
  const list = ids.map((id) => songById(id)).filter((s): s is Song => Boolean(s))
  return list.length >= 2 ? list : own
}

function yesterdayOf(day: string): string {
  const d = new Date(`${day}T12:00:00`)
  d.setDate(d.getDate() - 1)
  return localDay(d)
}

export function DailyScreen() {
  const t = useMessages(dailyText)
  const me = useMe()
  const game = useGame()
  const { addToast } = useUI()
  const navigate = useAppNavigate()
  const day = localDay()
  const { board, error, load } = useDailyBoard(day)
  const { board: yesterday } = useDailyBoard(yesterdayOf(day))
  const [starting, setStarting] = useState(false)
  // This tab already plays today's run (a reload, or back from the game): just go on
  const liveHere = game.isGameStarted && !game.finished && game.daily === day

  async function start() {
    if (liveHere) {
      navigate('/game')
      return
    }
    setStarting(true)
    // From the bundled list, so an admin correction during the day does not
    // give later players other songs; the years still come corrected (songById).
    // The server keeps the first list of the day and hands it to everyone after —
    // a device with an older or newer catalogue still plays the same songs.
    const offered = dailySongs(day, bundledSongs)
    let turns = 0
    let songs = offered
    try {
      const r = await api<{ turns: number; songs: string[] | null }>(`/api/daily/${day}/start`, {
        method: 'POST',
        json: { songs: offered.map((s) => s.id) }
      })
      turns = r.turns
      songs = daySongsFrom(r.songs, offered)
    } catch (e) {
      setStarting(false)
      addToast(e instanceof ApiError && e.code === 'already_played' ? t.alreadyPlayed : t.loadFailed, 'warning')
      void load()
      return
    }
    game.resetGame()
    game.setGameMode(GameMode.TIMELINE_PERSONAL)
    game.setOptions({
      goal: 99,
      decades: [],
      challengesEnabled: false,
      exotics: false,
      genres: [],
      collection: 'all',
      songIds: songs.map((s) => s.id),
      bonus: false,
      daily: day
    })
    game.setPlayers([{ name: ownPlayerName(me.name), timeline: [], cards: 0, score: 0 }])
    game.startGame()
    // A paused run: the songs booked so far lie on the timeline, the next one follows
    const placed = resumedTimeline(songs, turns)
    if (placed.length > 0) {
      game.setPlayers([{ name: ownPlayerName(me.name), timeline: placed, cards: placed.length, score: 0 }])
      for (const s of songs.slice(0, placed.length)) game.addToPlayedSongs(songKey(s))
    }
    navigate('/game', { replace: true })
  }

  const mine = board?.mine
  const running = board?.state === 'running' || liveHere
  const finished = board?.state === 'finished' && !liveHere
  // A win needs someone to beat: only when at least two finished yesterday
  const winnerYesterday = yesterday && yesterday.board.length >= 2 ? yesterday.board[0] : undefined
  const best = board?.board[0]

  return (
    <div className="space-y-6 pb-10">
      <SubPageHeader title={t.title} back="/" />
      <p className="meta -mt-2">
        {new Date(`${day}T12:00:00`).toLocaleDateString(localeOf(getLang()), { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

      {winnerYesterday && (
        <p className="flex items-center gap-3 rounded-m3-lg bg-md-tertiary-container text-md-on-tertiary-container px-4 py-3 text-body-md" data-yesterday>
          <Icon name="crown" size={20} />
          {winnerYesterday.me ? t.yesterdayYou(resultLabel(winnerYesterday)) : t.yesterday(winnerYesterday.name, resultLabel(winnerYesterday))}
        </p>
      )}

      {error && (
        <div className="surface p-6 text-center">
          <p className="text-body-lg">{t.loadFailed}</p>
          <button type="button" className="btn btn-tonal m3-state-layer mt-4" onClick={() => void load()}>
            {t.reload}
          </button>
        </div>
      )}
      {!board && !error && (
        <div className="m3-loading mx-auto mt-10">
          <span className="m3-loading-arc" />
        </div>
      )}

      {board && (
        <>
          {finished && mine ? (
            <m.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring.spatialDefault}
              className="rounded-m3-xxl p-7 text-center"
              style={{ background: 'rgb(var(--mx-brand))', color: 'rgb(var(--mx-on-brand))' }}
              aria-labelledby="daily-mine"
              data-daily-state="finished"
            >
              <p id="daily-mine" className="text-label-lg opacity-90">
                {t.yourResult}
              </p>
              <p className="text-poster num-poster mt-2" style={{ fontSize: 'clamp(3rem, 14vw, 4.5rem)' }}>
                {mine.total === 10 ? t.resultOld(mine.score, mine.total) : t.streakNumber(mine.score)}
              </p>
              <p className="text-body-md opacity-90 mt-2">{t.nextTomorrow}</p>
            </m.section>
          ) : (
            <section className="surface p-6 space-y-5" data-daily-state={running ? 'running' : 'none'}>
              <p className="text-body-lg">{running ? t.resumeHint : t.intro(board.max ?? DAILY_MAX)}</p>
              <button type="button" className="btn btn-lg btn-brand m3-state-layer w-full" onClick={() => void start()} disabled={starting}>
                <Icon name={running ? 'play' : 'today'} />
                {starting ? t.starting : running ? t.resume(mine?.score ?? 0) : t.start}
              </button>
            </section>
          )}

          <section aria-labelledby="daily-board" className="space-y-3">
            <h2 id="daily-board" className="text-title-md">
              {t.board}
            </h2>
            {board.board.filter((r) => !r.me).length === 0 && board.running.filter((r) => !r.me).length === 0 && (
              <p className="meta">{t.boardEmpty}</p>
            )}
            {board.board.length > 0 && (
              <ol className="space-y-2">
                {board.board.map((r, i) => (
                  <li
                    key={r.id}
                    className={`flex items-center gap-4 px-4 min-h-[56px] rounded-m3-lg ${
                      r.me ? 'bg-md-primary-container text-md-on-primary-container' : 'bg-md-surface-container-low'
                    }`}
                  >
                    <span className="w-6 text-title-md tabular">{i + 1}.</span>
                    <Avatar name={r.name} picture={r.picture} size={36} />
                    <span className="flex-1 min-w-0 truncate text-body-lg">
                      {r.name}
                      {r.me && <span className="ml-2 text-label-md opacity-80">{t.you}</span>}
                      {i === 0 && r === best && board.board.length > 1 && <span className="ml-2 text-label-md opacity-80">· {t.leads}</span>}
                    </span>
                    <span className="text-title-md num-poster">{resultLabel(r)}</span>
                  </li>
                ))}
              </ol>
            )}
            {board.running.filter((r) => !r.me).length > 0 && (
              <ul className="space-y-2" data-running>
                {board.running
                  .filter((r) => !r.me)
                  .map((r) => (
                    <li key={r.id} className="flex items-center gap-4 px-4 min-h-[48px] rounded-m3-lg border border-dashed border-md-outline-variant">
                      <Avatar name={r.name} picture={r.picture} size={28} />
                      <span className="flex-1 min-w-0 truncate text-body-md">{r.name}</span>
                      <span className="text-label-lg text-md-on-surface-variant">{t.runningNow(r.score)}</span>
                    </li>
                  ))}
              </ul>
            )}
            <p className="meta">{t.noFriends}</p>
          </section>
        </>
      )}
    </div>
  )
}
