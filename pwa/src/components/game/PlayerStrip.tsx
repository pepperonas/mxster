/**
 * Who is playing and who is on turn. The active player's chip widens to show
 * "ist dran"; the highlight travels between chips as one shared element.
 */
import { m } from 'motion/react'
import { useGame } from '@/contexts'
import { Icon } from '@/components/ui/Icon'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { spring } from '@/motion/springs'
import { activeMember, initialOf } from '@/game/teams'
import { ChallengeDots } from './PlacementDock'

export function PlayerStrip({ thinking = false }: { thinking?: boolean }) {
  const { players, currentPlayer, gameMode, tiebreak, challengesEnabled } = useGame()
  const hardcore = gameMode === 'hardcore'
  const showChallenges = challengesEnabled && !hardcore

  return (
    <ul className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 py-1" aria-label="Spieler">
      {players.map((p, i) => {
        const active = i === currentPlayer
        const out = Boolean(tiebreak) && !tiebreak!.contenders.includes(i)
        return (
          <m.li
            key={p.name}
            layout
            transition={spring.spatialDefault}
            className={`relative shrink-0 flex items-center gap-2 h-12 pl-1.5 pr-4 rounded-m3-full ${out ? 'opacity-60' : ''}`}
            aria-current={active ? 'true' : undefined}
            aria-label={out ? `${p.name}, nicht im Stechen` : undefined}
          >
            {active && (
              <m.span
                layoutId="turn-highlight"
                transition={spring.spatialDefault}
                className="absolute inset-0 rounded-m3-full bg-md-primary-container"
                aria-hidden="true"
              />
            )}
            {!active && <span className="absolute inset-0 rounded-m3-full bg-md-surface-container-high" aria-hidden="true" />}
            <span
              className={`relative grid place-items-center w-9 h-9 rounded-full text-label-lg ${
                active ? 'bg-md-primary text-md-on-primary' : 'bg-md-surface-container-highest text-md-on-surface-variant'
              }`}
              aria-hidden="true"
            >
              {p.isBot ? <Icon name="bot" size={18} /> : p.members ? <Icon name="groups" size={18} /> : initialOf(p.name)}
            </span>
            <span className={`relative flex flex-col leading-tight ${active ? 'text-md-on-primary-container' : 'text-md-on-surface'}`}>
              <span className="flex items-center gap-1.5 text-label-lg">
                <span className="max-w-[9rem] truncate">{p.name}</span>
                {showChallenges && !p.isBot && (
                  <span className="opacity-80" title={`${p.challenges ?? 0} Einsprüche übrig`}>
                    <ChallengeDots left={p.challenges ?? 0} />
                    <span className="sr-only">, {p.challenges ?? 0} Einsprüche übrig</span>
                  </span>
                )}
              </span>
              <span className={`text-label-sm tabular ${active ? '' : 'text-md-on-surface-variant'}`}>
                {active ? (p.isBot && thinking ? 'überlegt …' : p.members ? `${activeMember(p)} ist dran` : 'ist dran') : null}
                {!active && (
                  <>
                    <AnimatedNumber value={hardcore ? p.score : p.cards} /> {hardcore ? 'Pkt.' : p.cards === 1 ? 'Song' : 'Songs'}
                  </>
                )}
              </span>
            </span>
            {active && (
              <span className="relative ml-1 text-title-sm tabular text-md-on-primary-container">
                <AnimatedNumber value={hardcore ? p.score : p.cards} />
              </span>
            )}
          </m.li>
        )
      })}
    </ul>
  )
}
