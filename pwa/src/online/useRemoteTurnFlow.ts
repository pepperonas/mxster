/**
 * The turn flow on a player's device in an online round: the state is the
 * host's (mirrored into the game context), every action becomes an intent.
 * Same shape as the local flow, so the game screen does not care which one
 * it drives.
 */
import { useGame } from '@/contexts'
import { deriveTurn } from '@/game/deriveTurn'
import type { TurnFlow } from '@/game/useTurnFlow'
import type { Intent } from './protocol'

export function useRemoteTurnFlow(send: (intent: Intent) => void): TurnFlow {
  const g = useGame()
  const { phase, activePlayer, activeTimeline } = deriveTurn({ ...g, finished: g.finished })
  return {
    phase,
    reveal: g.reveal,
    gameOver: g.finished,
    isBotThinking: false,
    activePlayer,
    activeTimeline,
    pending: g.pending,
    drawSong: () => {
      send({ action: 'draw' })
      return null
    },
    placeCard: (gap: number) => send({ action: 'place', gap }),
    startChallenge: () => send({ action: 'challenge' }),
    cancelChallenge: () => send({ action: 'cancelChallenge' }),
    claimGap: (gap: number) => send({ action: 'claim', gap }),
    revealPlacement: () => send({ action: 'reveal' }),
    submitGuess: (title: string, artist: string, year: string) => send({ action: 'guess', title, artist, year }),
    skip: () => send({ action: 'skip' }),
    continueTurn: () => send({ action: 'continue' })
  }
}
