/**
 * Player Info — who is on turn.
 *
 * On every turn change the card hands over: the outgoing player slides out to
 * the left while the next one springs in from the right (popLayout keeps the
 * height steady). Stats count with springs. A bot shows its thinking state.
 */
import { AnimatePresence, m } from 'motion/react'
import { useGame } from '@/contexts'
import { requiresDJ } from '@/utils/gameModes'
import { spring } from '@/motion/springs'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'

interface PlayerInfoProps {
  isBotExecuting?: boolean
}

const DIFFICULTY = {
  easy: { label: 'Leicht', tone: 'bg-md-success-container text-md-on-success-container' },
  medium: { label: 'Mittel', tone: 'bg-md-warning-container text-md-on-warning-container' },
  hard: { label: 'Schwer', tone: 'bg-md-error-container text-md-on-error-container' }
} as const

export function PlayerInfo({ isBotExecuting = false }: PlayerInfoProps = {}) {
  const { players, currentPlayer, currentDJ, gameMode, gameVariant } = useGame()
  if (players.length === 0 || !gameMode || !gameVariant) return null

  const player = players[currentPlayer]
  const needsDJ = requiresDJ(gameMode, gameVariant)
  const isDJ = needsDJ && currentPlayer === currentDJ
  const role = player.isBot ? 'KI-Gegner' : isDJ ? 'DJ · scannt die Karten' : 'Am Zug'

  return (
    <section
      aria-live="polite"
      aria-label="Aktiver Spieler"
      className="relative overflow-hidden rounded-m3-xl bg-md-surface-container border border-md-outline-variant/50"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <m.div
          key={currentPlayer}
          initial={{ x: 56, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -56, opacity: 0, transition: spring.effectsDefault }}
          transition={spring.spatialDefault}
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-4 sm:p-5"
        >
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <m.span
              initial={{ scale: 0.6, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...spring.spatialFast, delay: 0.06 }}
              className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 grid place-items-center rounded-m3-lg text-2xl sm:text-3xl ${
                player.isBot ? 'bg-md-secondary-container' : 'bg-md-primary-container'
              }`}
              aria-hidden="true"
            >
              {player.isBot ? '🤖' : isDJ ? '🎧' : '🎮'}
            </m.span>
            <div className="min-w-0">
              <p className="text-label-md uppercase tracking-wider text-md-on-surface-variant">{role}</p>
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-headline-sm text-text-primary truncate">{player.name}</h2>
                {player.isBot && player.botDifficulty && (
                  <span className={`text-label-md px-2.5 py-0.5 rounded-m3-full ${DIFFICULTY[player.botDifficulty].tone}`}>
                    {DIFFICULTY[player.botDifficulty].label}
                  </span>
                )}
              </div>
            </div>
          </div>

          <dl className="flex gap-5 sm:gap-6 flex-shrink-0">
            <div className="text-center">
              <dd className="text-headline-sm text-brand">
                <AnimatedNumber value={player.cards} />
              </dd>
              <dt className="text-label-sm uppercase tracking-wider text-md-on-surface-variant">Karten</dt>
            </div>
            {gameMode === 'hardcore' && (
              <div className="text-center">
                <dd className="text-headline-sm text-brand">
                  <AnimatedNumber value={player.score} />
                </dd>
                <dt className="text-label-sm uppercase tracking-wider text-md-on-surface-variant">Punkte</dt>
              </div>
            )}
          </dl>
        </m.div>
      </AnimatePresence>

      {needsDJ && isDJ && (
        <p className="px-5 pb-4 text-body-sm text-center text-md-on-surface-variant">
          Scanne die nächste Karte, die anderen warten.
        </p>
      )}

      <AnimatePresence>
        {player.isBot && isBotExecuting && (
          <m.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={spring.effectsSlow}
            className="px-5 pb-4 text-body-sm text-center text-md-on-surface-variant"
          >
            {player.botDifficulty === 'hard' ? 'Analysiert Möglichkeiten …' : player.botDifficulty === 'medium' ? 'Überlegt …' : 'Denkt nach …'}
          </m.p>
        )}
      </AnimatePresence>
    </section>
  )
}
