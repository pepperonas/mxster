/**
 * Tagesrunde: the same songs for everyone today, one try, then the friends'
 * results. Starting sets up a one-player round on the own timeline with the
 * day's songs in a fixed order (game/daily.ts); the result is sent when the
 * round ends (GameScreen).
 */
import { useCallback, useEffect, useState } from 'react'
import { m } from 'motion/react'
import { api } from '@/api/client'
import { useMe } from '@/auth/AuthContext'
import { useGame } from '@/contexts'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { SubPageHeader } from '@/shell/AppShell'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { DAILY_SONGS, dailySongs, localDay } from '@/game/daily'
import { songs as bundledSongs } from '@/data/songs'
import { ownPlayerName } from '@/game/owner'
import { spring } from '@/motion/springs'
import { getLang, localeOf, useMessages } from '@/i18n'
import { dailyText } from '@/i18n/messages/daily'
import { GameMode } from '@/types'

export interface DailyRow {
  id: number
  name: string
  picture: string
  score: number
  total: number
  me: boolean
}

export interface DailyBoard {
  day: string
  songs: number
  mine: DailyRow | null
  board: DailyRow[]
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

export function DailyScreen() {
  const t = useMessages(dailyText)
  const me = useMe()
  const game = useGame()
  const navigate = useAppNavigate()
  const day = localDay()
  const { board, error, load } = useDailyBoard(day)
  const [starting, setStarting] = useState(false)

  function start() {
    setStarting(true)
    // From the bundled list, so an admin correction during the day does not
    // give later players other songs; the years still come corrected (songById)
    const songs = dailySongs(day, bundledSongs)
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
    navigate('/game', { replace: true })
  }

  return (
    <div className="space-y-6 pb-10">
      <SubPageHeader title={t.title} back="/" />
      <p className="meta -mt-2">
        {new Date(`${day}T12:00:00`).toLocaleDateString(localeOf(getLang()), { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

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
          {board.mine ? (
            <m.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring.spatialDefault}
              className="rounded-m3-xxl p-7 text-center"
              style={{ background: 'rgb(var(--mx-brand))', color: 'rgb(var(--mx-on-brand))' }}
              aria-labelledby="daily-mine"
            >
              <p id="daily-mine" className="text-label-lg opacity-90">
                {t.yourResult}
              </p>
              <p className="text-poster mt-2" style={{ fontSize: 'clamp(3rem, 14vw, 4.5rem)' }}>
                {t.scoreOf(board.mine.score, board.mine.total)}
              </p>
              <p className="text-body-md opacity-90 mt-2">{t.nextTomorrow}</p>
            </m.section>
          ) : (
            <section className="surface p-6 space-y-5">
              <p className="text-body-lg">{t.intro(DAILY_SONGS)}</p>
              <button type="button" className="btn btn-lg btn-brand m3-state-layer w-full" onClick={start} disabled={starting}>
                <Icon name="today" />
                {starting ? t.starting : t.start}
              </button>
            </section>
          )}

          <section aria-labelledby="daily-board" className="space-y-3">
            <h2 id="daily-board" className="text-title-md">
              {t.board}
            </h2>
            {board.board.filter((r) => !r.me).length === 0 && <p className="meta">{t.boardEmpty}</p>}
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
                    </span>
                    <span className="text-title-md tabular">{t.scoreOf(r.score, r.total)}</span>
                  </li>
                ))}
              </ol>
            )}
            <p className="meta">{t.noFriends}</p>
          </section>
        </>
      )}
    </div>
  )
}
