/**
 * Verlauf — finished rounds, newest first, grouped by day. A row opens the
 * round (ranking and the songs everyone collected).
 */
import { useParams } from 'react-router-dom'
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
  const { history } = useGameHistory()
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

      {history.length === 0 ? (
        <div className="surface p-8 text-center">
          <Icon name="history" size={40} className="mx-auto text-md-on-surface-variant" />
          <p className="mt-4 text-title-md">{t.emptyTitle}</p>
          <p className="mt-1 meta">{t.emptyText}</p>
          <button type="button" className="btn btn-brand m3-state-layer mt-6" onClick={() => navigate('/new')}>
            {t.firstRound}
          </button>
        </div>
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
                      style={{ viewTransitionName: `game-${g.id}` }}
                    >
                      <span className="grid place-items-center w-11 h-11 shrink-0 rounded-m3-md bg-md-tertiary-container text-md-on-tertiary-container">
                        <Icon name={MODE_COPY[g.gameMode]?.icon ?? 'note'} size={22} />
                      </span>
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

      <div className="pt-2 space-y-6" style={{ viewTransitionName: `game-${game.id}` }}>
        <section className="rounded-m3-xxl p-6" style={{ background: 'rgb(var(--mx-brand))', color: 'rgb(var(--mx-on-brand))' }}>
          <p className="text-label-lg opacity-90">{t.winnerIs}</p>
          <p className="text-poster break-words" style={{ fontSize: 'clamp(2.2rem, 10vw, 3.2rem)' }}>
            {game.winner.name}
          </p>
          <p className="mt-2 text-body-md opacity-90">
            {t.resultAt(hardcore ? t.points(game.winner.score) : t.songsRight(game.winner.cards), formatTime(game.date))}
          </p>
        </section>

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
