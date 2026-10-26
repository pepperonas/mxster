/**
 * Score Overview (hardcore) — the ranking that moves.
 *
 * Rows are layout-animated: when a guess changes the order, players glide to
 * their new rank instead of jumping; scores count with springs. The "am Zug"
 * marker travels between rows as one shared element (layoutId).
 */
import { m } from 'motion/react'
import { useGame } from '@/contexts'
import { TrophyIcon } from '@/utils/icons'
import { spring } from '@/motion/springs'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'

const MEDALS = ['🥇', '🥈', '🥉']

export function ScoreOverview() {
  const { players, currentPlayer, gameMode } = useGame()
  if (gameMode !== 'hardcore') return null

  // Stable tie order: score desc, then seat order
  const ranked = players
    .map((player, seat) => ({ player, seat }))
    .sort((a, b) => b.player.score - a.player.score || a.seat - b.seat)

  return (
    <section className="surface p-5 sm:p-6" aria-labelledby="score-title">
      <div className="flex items-center gap-3 mb-4">
        <TrophyIcon size={22} className="text-md-tertiary" />
        <h3 id="score-title" className="text-title-lg text-md-on-surface">
          Punkteübersicht
        </h3>
      </div>

      <ol className="space-y-2">
        {ranked.map(({ player, seat }, rank) => {
          const active = seat === currentPlayer
          return (
            <m.li
              key={player.name}
              layout
              transition={spring.spatialDefault}
              className="relative flex items-center justify-between gap-3 p-3 rounded-m3-lg bg-md-surface-container-high"
            >
              {active && (
                <m.span
                  layoutId="score-active-ring"
                  transition={spring.spatialDefault}
                  className="absolute inset-0 rounded-m3-lg border-2 border-md-primary pointer-events-none"
                  aria-hidden="true"
                />
              )}
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-9 text-center text-xl" aria-label={`Platz ${rank + 1}`}>
                  {rank < 3 ? MEDALS[rank] : <span className="text-title-sm text-md-on-surface-variant">#{rank + 1}</span>}
                </span>
                <div className="min-w-0">
                  <p className="text-title-sm text-md-on-surface truncate">
                    {player.name}
                    {active && <span className="sr-only"> (am Zug)</span>}
                  </p>
                  <p className="text-body-sm text-md-on-surface-variant">
                    <AnimatedNumber value={player.cards} /> {player.cards === 1 ? 'Karte' : 'Karten'}
                  </p>
                </div>
              </div>
              <p className="text-headline-sm text-brand">
                <AnimatedNumber value={player.score} />
              </p>
            </m.li>
          )
        })}
      </ol>

      <p className="mt-4 pt-3 border-t border-md-outline-variant/60 text-center text-body-sm text-md-on-surface-variant">
        Gewinner: die meisten Punkte nach 10 Karten
      </p>
    </section>
  )
}
