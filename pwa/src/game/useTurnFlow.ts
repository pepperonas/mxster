/**
 * Turn flow — the game loop as an explicit phase machine.
 *
 *   idle ──draw──────▶ placing (timeline modes) ──placeCard──▶ revealed ──continueTurn──▶ next player / over
 *                    └▶ guessing (hardcore)      ──submitGuess─▶ revealed ──continueTurn──▶ next player / over
 *
 * The UI renders and animates each phase instead of chaining modals with
 * timeouts. Rules come from src/game/* and services/gameLogic and are applied
 * exactly as before:
 *  - timeline modes credit a correct card when it is placed; the win check
 *    runs when the turn is continued ("Nächster Spieler");
 *  - hardcore credits card + points when the result is continued ("Weiter").
 * Bots play through the same placeCard/submitGuess entry points.
 */
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import { useGame, useUI, useAchievements, useGameHistory } from '@/contexts'
import {
  validateGuess,
  placeCardInTimeline,
  checkWinCondition,
  selectRandomSong
} from '@/services'
import { BotPlayer } from '@/services/botPlayer'
import type { BotAction } from '@/services/botStrategies/types'
import { songs } from '@/data/songs'
import type { Player, Song } from '@/types'
import { evaluatePlacement, timelineSongsFor } from './placement'
import { guessBreakdown, guessDetailsFor, type GuessBreakdown } from './guess'
import { endOfGameAchievements, realtimeScoreAchievements, type AchievementEffect, type RankingSnapshot } from './achievementRules'
import { evaluateSkip, SKIP_PENALTY_POINTS } from './skipRules'

export type TurnPhase = 'idle' | 'placing' | 'guessing' | 'revealed' | 'over'

export type Reveal =
  | {
      kind: 'placement'
      song: Song
      gapIndex: number
      isCorrect: boolean
      isFirstCard: boolean
      playerIndex: number
      /** Cards of the placing player after this placement. */
      cardsAfter: number
    }
  | {
      kind: 'guess'
      song: Song
      check: ReturnType<typeof validateGuess>
      breakdown: GuessBreakdown
      playerIndex: number
    }

export interface SkipNotice {
  kind: 'penalty' | 'danger'
  newScore?: number
  nextPenaltyProbability?: number
}

interface Options {
  /** Called once when the game ends, with the final player snapshot. */
  onGameOver: (winner: Player, players: Player[]) => void
  /** Called after a skip that needs to be explained (penalty / danger zone). */
  onSkipNotice: (notice: SkipNotice, acknowledge: () => void) => void
}

export function useTurnFlow({ onGameOver, onSkipNotice }: Options) {
  const game = useGame()
  const {
    gameMode,
    players,
    currentPlayer,
    currentSong,
    playedSongs,
    globalTimeline,
    currentSongSkips,
    updatePlayer,
    setCurrentSong,
    addToGlobalTimeline,
    addToPlayedSongs,
    incrementSkipCount,
    resetSkipCounts,
    nextTurn,
    nextPlayerOnly
  } = game
  const { addToast } = useUI()
  const { unlockAchievement, updateProgress, checkAchievements } = useAchievements()
  const { saveGame, history } = useGameHistory()

  const [reveal, setReveal] = useState<Reveal | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [isBotThinking, setIsBotThinking] = useState(false)

  const gameStartTime = useRef<number>(Date.now())
  const rankingsHistory = useRef<RankingSnapshot[]>([])
  const botBusy = useRef(false)

  const phase: TurnPhase = gameOver
    ? 'over'
    : reveal
      ? 'revealed'
      : !currentSong
        ? 'idle'
        : gameMode === 'hardcore'
          ? 'guessing'
          : 'placing'

  const activePlayer: Player | undefined = players[currentPlayer]
  const activeTimeline = timelineSongsFor(gameMode, activePlayer, globalTimeline)

  const applyEffects = useCallback(
    (effects: AchievementEffect[]) => {
      for (const fx of effects) {
        if (fx.type === 'unlock') unlockAchievement(fx.player, fx.id)
        else updateProgress(fx.player, fx.id, fx.value)
      }
    },
    [unlockAchievement, updateProgress]
  )

  // ── Song source ──────────────────────────────────────────────────────────
  const drawSong = useCallback((): Song | null => {
    const song = selectRandomSong(songs, playedSongs)
    if (!song) {
      addToast('Alle Songs wurden bereits gespielt!', 'warning')
      return null
    }
    addToPlayedSongs(song.spotifyId || song.id)
    setCurrentSong(song)
    return song
  }, [playedSongs, addToPlayedSongs, setCurrentSong, addToast])

  // ── Game end ─────────────────────────────────────────────────────────────
  const finishGame = useCallback(
    (winner: Player, finalPlayers: Player[]) => {
      if (gameOver) return
      setGameOver(true)
      try {
        saveGame({
          winner: { name: winner.name, cards: winner.cards, score: winner.score },
          players: finalPlayers,
          gameMode: gameMode ?? ''
        })
        addToast('Spiel wurde zur Historie hinzugefügt!', 'success')
      } catch (error) {
        console.error('❌ Failed to save game:', error)
      }
      if (gameMode === 'hardcore') {
        applyEffects(
          endOfGameAchievements({
            players: finalPlayers,
            winner,
            gameDurationMinutes: (Date.now() - gameStartTime.current) / 60000,
            rankingsHistory: rankingsHistory.current
          })
        )
        if (history && history.length > 0) {
          const historyData = { version: '1.0', games: history }
          finalPlayers.forEach((p) => checkAchievements(p.name, historyData))
        }
      }
      onGameOver(winner, finalPlayers)
    },
    [gameOver, saveGame, gameMode, addToast, applyEffects, history, checkAchievements, onGameOver]
  )

  // ── Timeline modes ───────────────────────────────────────────────────────
  const placeCard = useCallback(
    (gapIndex: number) => {
      if (phase !== 'placing' || !currentSong || !activePlayer) return
      const playerIndex = currentPlayer
      const { isCorrect, newTimeline, isFirstCard } = evaluatePlacement(activeTimeline, currentSong, gapIndex)

      if (isCorrect) {
        if (gameMode === 'timeline_global') {
          addToGlobalTimeline(currentSong, playerIndex)
          updatePlayer(playerIndex, { cards: activePlayer.cards + 1 })
        } else {
          updatePlayer(playerIndex, { timeline: newTimeline, cards: activePlayer.cards + 1 })
        }
      }

      setReveal({
        kind: 'placement',
        song: currentSong,
        gapIndex,
        isCorrect,
        isFirstCard,
        playerIndex,
        cardsAfter: activePlayer.cards + (isCorrect ? 1 : 0)
      })
    },
    [phase, currentSong, activePlayer, currentPlayer, activeTimeline, gameMode, addToGlobalTimeline, updatePlayer]
  )

  // ── Hardcore ─────────────────────────────────────────────────────────────
  const submitGuess = useCallback(
    (title: string, artist: string, year: string) => {
      if (phase !== 'guessing' || !currentSong) return
      const check = validateGuess(title, artist, year, currentSong)
      setReveal({ kind: 'guess', song: currentSong, check, breakdown: guessBreakdown(check), playerIndex: currentPlayer })
    },
    [phase, currentSong, currentPlayer]
  )

  const skip = useCallback(() => {
    if (phase !== 'guessing' || !currentSong || !activePlayer) return
    incrementSkipCount(currentPlayer)
    const result = evaluateSkip(currentSongSkips, currentPlayer, players.length, gameMode === 'hardcore')

    if (result.penaltyApplied) {
      const newScore = activePlayer.score - SKIP_PENALTY_POINTS
      updatePlayer(currentPlayer, { score: newScore })
      onSkipNotice({ kind: 'penalty', newScore }, () => {
        resetSkipCounts()
        // Turn passes first (it clears the song), then the next player gets a
        // fresh song — the dialog promises one is drawn automatically.
        nextTurn()
        drawSong()
      })
    } else if (result.dangerZone) {
      onSkipNotice({ kind: 'danger', nextPenaltyProbability: result.nextPenaltyProbability }, () => nextPlayerOnly())
    } else {
      nextPlayerOnly()
    }
  }, [
    phase,
    currentSong,
    activePlayer,
    incrementSkipCount,
    currentPlayer,
    currentSongSkips,
    players.length,
    gameMode,
    updatePlayer,
    onSkipNotice,
    resetSkipCounts,
    nextTurn,
    drawSong,
    nextPlayerOnly
  ])

  // ── Continue after a reveal ──────────────────────────────────────────────
  const continueTurn = useCallback(() => {
    if (!reveal || gameOver) return

    if (reveal.kind === 'placement') {
      setReveal(null)
      if (reveal.isCorrect) {
        // The placement already updated the player in state
        const win = checkWinCondition(players, reveal.playerIndex, gameMode!)
        if (win.gameOver && win.winner) {
          finishGame(win.winner, players)
          return
        }
      }
      nextTurn()
      return
    }

    // Hardcore: credit card + points now
    const player = players[reveal.playerIndex]
    const { breakdown, check, song } = reveal
    const newScore = player.score + breakdown.total
    const updated: Player = {
      ...player,
      timeline: placeCardInTimeline(player.timeline, song, breakdown.total, guessDetailsFor(check)),
      cards: player.cards + 1,
      score: newScore
    }
    updatePlayer(reveal.playerIndex, { timeline: updated.timeline, cards: updated.cards, score: updated.score })
    applyEffects(realtimeScoreAchievements(player.name, player.score, newScore))

    const updatedPlayers = players.map((p, i) => (i === reveal.playerIndex ? updated : p))
    rankingsHistory.current.push({
      turn: updated.cards,
      rankings: [...updatedPlayers].sort((a, b) => b.score - a.score).map((p) => p.name)
    })

    setReveal(null)
    const win = checkWinCondition(updatedPlayers, reveal.playerIndex, gameMode!)
    if (win.gameOver && win.winner) {
      finishGame(win.winner, updatedPlayers)
      return
    }
    nextTurn()
    addToast('Karte platziert!', 'success')
  }, [reveal, gameOver, players, gameMode, finishGame, nextTurn, updatePlayer, applyEffects, addToast])

  // ── Bots ─────────────────────────────────────────────────────────────────
  // Effect events always see the latest placeCard/submitGuess (no stale closures).
  const onBotAction = useEffectEvent((action: BotAction) => {
    if (action.type === 'guess') submitGuess(action.data.title, action.data.artist, action.data.year)
    else placeCard(action.data.position)
  })
  const onBotError = useEffectEvent(() => {
    addToast('Bot-Fehler aufgetreten', 'error')
    nextTurn()
  })

  const songKey = currentSong ? currentSong.spotifyId || currentSong.id : null
  const botTurn = Boolean(activePlayer?.isBot) && (phase === 'placing' || phase === 'guessing')

  useEffect(() => {
    // botBusy: if the song changes while the bot is still thinking (someone
    // draws again), the re-run must not start a second bot turn.
    if (!botTurn || !activePlayer || !currentSong || botBusy.current) return
    botBusy.current = true
    setIsBotThinking(true)
    const bot = new BotPlayer(activePlayer)
    bot
      .executeTurn(gameMode!, currentSong, activeTimeline, (action) => onBotAction(action))
      .catch(() => onBotError())
      .finally(() => {
        botBusy.current = false
        setIsBotThinking(false)
      })
    // activeTimeline/currentSong are read at the moment the bot starts thinking
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botTurn, songKey, currentPlayer])

  return {
    phase,
    reveal,
    gameOver,
    isBotThinking,
    activePlayer,
    activeTimeline,
    drawSong,
    placeCard,
    submitGuess,
    skip,
    continueTurn
  }
}

export type TurnFlow = ReturnType<typeof useTurnFlow>
