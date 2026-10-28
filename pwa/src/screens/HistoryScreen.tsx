/**
 * Verlauf — finished rounds, newest first, grouped by day. A row opens the
 * round (ranking and the songs everyone collected).
 */
import { useParams } from 'react-router-dom'
import { roundSongIds } from '@/utils/cover'
import { SongCover } from '@/components/game/SongInfo'
import { songById } from '@/data/catalogue'
import type { IconName } from '@/components/ui/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { sharedElement } from '@/motion/vtName'
import { m } from 'motion/react'
import { useGameHistory, useUI } from '@/contexts'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { SubPageHeader } from '@/shell/AppShell'
import { Icon } from '@/components/ui/Icon'
import { MODE_COPY } from '@/game/modeCopy'
import { formatDay, formatTime } from '@/utils/format'
import { spring } from '@/motion/springs'
import type { HistoryEntry } from '@/types'
import { rankPlayers } from '@/game/tiebreak'
import { useMessages } from '@/i18n'
import { historyText } from '@/i18n/messages/history'

export function HistoryScreen() {
  const { history, ready } = useGameHistory()
  const navigate = useAppNavigate()
  const t = useMessages(historyText)

  const groups = new Map<string, HistoryEntry[]>()
  for (const g of history) {
    const key = formatDay(g.date)
    groups.set(key, [...(groups.get(key) ?? []), g])
  }

  return (
    <div className="pt-4 md:pt-10">
      <h1 className="text-headline-md mb-6">{t.title}</h1>

      {/* Still loading from the account: placeholders, never "nothing here yet" */}
      {history.length === 0 && !ready ? (
        <SkeletonRows count={4} />
      ) : history.length === 0 ? (
        <EmptyState
          icon="history"
          title={t.emptyTitle}
          text={t.emptyText}
          action={<button type="button" className="btn btn-brand m3-state-layer" onClick={() => navigate('/new')}>{t.firstRound}</button>}
        />
      ) : (
        <div className="space-y-6">
          {[...groups].map(([day, games]) => (
            <section key={day} aria-label={day}>
              <h2 className="text-title-sm text-md-on-surface-variant mb-2 first-letter:uppercase">{day}</h2>
              <ul className="space-y-2">
                {games.map((g, i) => (
                  <m.li key={g.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring.spatialDefault, delay: Math.min(i, 6) * 0.03 }}>
                    <button
                      type="button"
                      className="row m3-state-layer"
                      onClick={() => navigate(`/history/${g.id}`)}
                      style={sharedElement(`game-${g.id}`)}
                    >
                      <RoundCovers game={g} fallback={MODE_COPY[g.gameMode]?.icon ?? 'note'} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-title-md truncate">{t.wins(g.winner.name)}</span>
                        <span className="block meta truncate">
                          {t.rowMeta(g.players.length, MODE_COPY[g.gameMode]?.name ?? t.round)}
                        </span>
                      </span>
                      <span className="meta tabular">{formatTime(g.date)}</span>
                    </button>
                  </m.li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

export function HistoryDetailScreen() {
  const { id } = useParams()
  const { getById, deleteGame } = useGameHistory()
  const { showModal } = useUI()
  const navigate = useAppNavigate()
  const game = getById(Number(id))
  const t = useMessages(historyText)

  if (!game) {
    return (
      <div>
        <SubPageHeader title={t.round} back="/history" />
        <p className="meta pt-6">{t.gone}</p>
      </div>
    )
  }

  const hardcore = game.gameMode === 'hardcore'
  const ranked = rankPlayers(game.players, game.gameMode, game.winner.name)

  const askDelete = () =>
    showModal(t.deleteTitle, <p className="text-body-lg">{t.deleteBody}</p>, [
      { text: t.keep },
      {
        text: t.delete,
        variant: 'danger',
        onClick: () => {
          deleteGame(game.id)
          navigate('/history', { replace: true })
        }
      }
    ])

  return (
    <div>
      <SubPageHeader title={t.detailTitle(MODE_COPY[game.gameMode]?.name ?? t.round, formatDay(game.date))} back="/history" />

      <div className="pt-2 space-y-6" style={sharedElement(`game-${game.id}`)}>
        <section className="rounded-m3-xxl p-6" style={{ background: 'rgb(var(--mx-brand))', color: 'rgb(var(--mx-on-brand))' }}>
          <p className="text-label-lg opacity-90">{t.winnerIs}</p>
          <p className="text-poster break-words" style={{ fontSize: 'clamp(2.2rem, 10vw, 3.2rem)' }}>
            {game.winner.name}
          </p>
          <p className="mt-2 text-body-md opacity-90">
            {t.resultAt(hardcore ? t.points(game.winner.score) : t.songsRight(game.winner.cards), formatTime(game.date))}
          </p>
        </section>

        <RoundCoverGrid game={game} />

        {ranked.map(({ player: p, place }) => (
          <section key={p.name} className="surface p-5" aria-label={p.name}>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-6 text-title-md tabular text-md-on-surface-variant">{place}.</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-title-md truncate">{p.name}</h2>
                {p.members && <p className="meta truncate">{p.members.join(', ')}</p>}
              </div>
              <span className="text-title-sm tabular">{hardcore ? t.pointsShort(p.score) : t.songs(p.cards)}</span>
            </div>
            {p.timeline.length > 0 ? (
              <ol className="space-y-1">
                {[...p.timeline]
                  .sort((a, b) => a.year - b.year)
                  .map((s) => (
                    <li key={s.id} className="flex items-baseline gap-3 py-1">
                      <span className="w-12 text-title-sm tabular text-md-primary">{s.year}</span>
                      <span className="min-w-0 flex-1 truncate text-body-md">
                        {s.title} <span className="text-md-on-surface-variant">{t.by} {s.artist}</span>
                      </span>
                    </li>
                  ))}
              </ol>
            ) : (
              <p className="meta">{t.noSongs}</p>
            )}
          </section>
        ))}

        <button type="button" className="btn btn-text m3-state-layer text-md-error" onClick={askDelete}>
          <Icon name="delete" size={20} />
          {t.deleteRound}
        </button>
      </div>
    </div>
  )
}

/** Up to three covers of the round, fanned out; the mode's icon when the round has no songs stored. */
function RoundCovers({ game, fallback }: { game: HistoryEntry; fallback: IconName }) {
  const ids = roundSongIds(game).slice(0, 3)
  if (ids.length === 0)
    return (
      <span className="grid place-items-center w-11 h-11 shrink-0 rounded-m3-md bg-md-tertiary-container text-md-on-tertiary-container">
        <Icon name={fallback} size={22} />
      </span>
    )
  return (
    <span className="relative shrink-0 h-11" style={{ width: 44 + (ids.length - 1) * 12 }} aria-hidden="true" data-round-covers>
      {ids.map((id, i) => (
        <span key={id} className="absolute top-0 rounded-m3-md shadow-m3-1 ring-2 ring-md-surface-container-low" style={{ left: i * 12, zIndex: 3 - i }}>
          <SongCover song={{ id }} size={44} />
        </span>
      ))}
    </span>
  )
}

/** Every song of the round as a cover with its year, in play order. */
function RoundCoverGrid({ game }: { game: HistoryEntry }) {
  const t = useMessages(historyText)
  const songs = roundSongIds(game)
    .map((id) => songById(id))
    .filter((s): s is NonNullable<ReturnType<typeof songById>> => Boolean(s))
  if (songs.length === 0) return null
  return (
    <section className="surface p-5" aria-label={t.roundSongs}>
      <h2 className="text-title-md mb-3">{t.roundSongs}</h2>
      <ul className="grid grid-cols-4 sm:grid-cols-6 gap-2" data-round-cover-grid>
        {songs.map((s) => (
          <li key={s.id} className="relative" title={`${s.title} – ${s.artist} (${s.year})`}>
            <span className="block aspect-square [&>span]:!w-full [&>span]:!h-full">
              <SongCover song={s} size={96} />
            </span>
            <span className="absolute left-1 bottom-1 rounded-m3-xs bg-md-surface/85 px-1 text-label-sm num-poster text-md-on-surface">{s.year}</span>
            <span className="sr-only">{`${s.title} – ${s.artist}, ${s.year}`}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
