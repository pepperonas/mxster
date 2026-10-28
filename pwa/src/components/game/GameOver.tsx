/**
 * End of a round: the winner on a poster, the ranking, and two ways on —
 * a rematch with the same people, or back home.
 */
import { useEffect } from 'react'
import { m } from 'motion/react'
import { Vinyl } from '@/components/ui/Vinyl'
import { Icon } from '@/components/ui/Icon'
import { celebrate } from '@/motion/celebrate'
import { haptic } from '@/utils/haptics'
import { spring } from '@/motion/springs'
import type { GameMode, Player } from '@/types'
import { rankPlayers } from '@/game/tiebreak'
import { useMessages } from '@/i18n'
import { gameText } from '@/i18n/messages/game'
import { SignUpOffer } from './SignUpOffer'
import { shareResultCard } from '@/utils/resultImage'
import { formatDay } from '@/utils/format'
import { dailyText } from '@/i18n/messages/daily'

interface GameOverProps {
  winner: Player
  players: Player[]
  mode: GameMode
  /** Missing online on a player's device: only the host starts the next round. */
  onRematch?: () => void
  onHome: () => void
  /** Online, not the host: who starts the next round. */
  rematchBy?: string
  homeLabel?: string
  /** Online guest without an account: offer one (their seat's name pre-filled). */
  signUpName?: string
  /** Today's round: the score instead of a winner. */
  daily?: { score: number; total: number }
}

/** When a ranking row arrives (s): last place first, the winner last after a short pause. */
export function rankDelay(index: number, count: number): number {
  const fromBottom = count - 1 - index
  return 0.4 + fromBottom * 0.08 + (index === 0 ? 0.18 : 0)
}

export function GameOver({ winner, players, mode, onRematch, onHome, rematchBy, homeLabel, signUpName, daily }: GameOverProps) {
  const t = useMessages(gameText)
  const dt = useMessages(dailyText)
  const hardcore = mode === 'hardcore'
  // Who left the room is listed last, without a place
  const ranked: { player: Player; place: number | null }[] = [
    ...rankPlayers(players.filter((p) => !p.left), mode, winner.name),
    ...players.filter((p) => p.left).map((player) => ({ player, place: null }))
  ]

  useEffect(() => {
    haptic('win')
    return celebrate('big')
  }, [])

  return (
    <m.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
      className="fixed inset-0 z-[60] overflow-y-auto bg-md-surface"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={spring.effectsSlow}
    >
      <div className="mx-auto max-w-md px-6 pt-12 pb-10 min-h-full flex flex-col">
        <m.div
          className="self-center"
          initial={{ scale: 0.3, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={spring.spatialSlow}
        >
          <Vinyl size={200} spinning label={<Icon name="trophy" size={26} />} />
        </m.div>

        <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring.spatialDefault, delay: 0.25 }}>
          <p className="mt-8 text-title-md text-md-on-surface-variant text-center">{daily ? dt.gameOverTitle : t.winnerIs}</p>
          <h1 id="game-over-title" className="text-poster text-center break-words" style={{ fontSize: 'clamp(2.8rem, 14vw, 4.5rem)' }}>
            {daily ? dt.scoreOf(daily.score, daily.total) : winner.name}
          </h1>
          {daily && <p className="mt-2 text-title-md text-md-on-surface-variant text-center">{dt.gameOverScore(daily.score, daily.total)}</p>}
          {winner.members && <p className="mt-2 text-title-md text-md-on-surface-variant text-center">{winner.members.join(', ')}</p>}
        </m.div>

        {!daily && (
        <ol className="mt-8 space-y-2">
          {ranked.map(({ player: p, place }, i) => (
            <m.li
              key={p.name}
              // The ranking fills from the bottom up and the winner arrives last, a beat later
              initial={i === 0 ? { opacity: 0, scale: 0.9, y: 12 } : { opacity: 0, x: -16 }}
              animate={i === 0 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, x: 0 }}
              transition={{ ...(i === 0 ? spring.spatialFast : spring.spatialDefault), delay: rankDelay(i, ranked.length) }}
              className={`flex items-center gap-4 px-4 min-h-[56px] rounded-m3-lg ${
                i === 0 ? 'bg-md-primary-container text-md-on-primary-container' : 'bg-md-surface-container-low'
              }`}
            >
              <span className="w-6 text-title-md tabular">{place === null ? '–' : `${place}.`}</span>
              <span className="flex-1 min-w-0">
                <span className="block truncate text-body-lg">{p.name}</span>
                {p.members && <span className="block truncate text-body-sm opacity-80">{p.members.join(', ')}</span>}
                {p.left && <span className="block truncate text-body-sm text-md-on-surface-variant">{t.leftShort}</span>}
              </span>
              <span className="text-title-md tabular">{hardcore ? t.pointsValue(p.score) : t.songsValue(p.cards)}</span>
            </m.li>
          ))}
        </ol>
        )}

        {signUpName !== undefined && <SignUpOffer name={signUpName} />}

        <div className="mt-auto pt-10 space-y-3">
          <button
            type="button"
            className="btn btn-tonal m3-state-layer w-full"
            onClick={() =>
              void shareResultCard({
                kicker: daily ? dt.gameOverTitle : t.winnerIs,
                headline: daily ? dt.scoreOf(daily.score, daily.total) : winner.name,
                rows: daily
                  ? []
                  : ranked.map(({ player: p, place }) => ({
                      place: place === null ? '–' : `${place}.`,
                      name: p.name,
                      value: hardcore ? t.pointsValue(p.score) : t.songsValue(p.cards)
                    })),
                footer: `${formatDay(new Date().toISOString())} · mxtape.celox.io`
              })
            }
          >
            <Icon name="share" />
            {t.shareResult}
          </button>
          {onRematch ? (
            <button type="button" className="btn btn-lg btn-brand m3-state-layer w-full" onClick={onRematch}>
              <Icon name="replay" />
              {t.rematch}
            </button>
          ) : rematchBy ? (
            <p className="text-center text-body-md text-md-on-surface-variant">{t.rematchBy(rematchBy)}</p>
          ) : null}
          <button type="button" className="btn btn-text m3-state-layer w-full" onClick={onHome}>
            {homeLabel ?? t.toHome}
          </button>
        </div>
      </div>
    </m.div>
  )
}
