/**
 * Game End Statistics Dialog Component
 * Shows winner celebration with confetti, round statistics, and global player stats
 */

import { useEffect, useMemo, useState } from 'react'
import { m } from 'motion/react'
import { celebrate } from '@/motion/celebrate'
import { prefersReducedMotion } from '@/motion/policy'
import { spring } from '@/motion/springs'
import { useGameHistory } from '@/hooks'
import type { Player } from '@/types'

interface GameEndStatsDialogProps {
  winner: Player
  allPlayers: Player[]
  gameMode: string
  onClose: () => void
  onNewRound: () => void
}

export function GameEndStatsDialog({ winner, allPlayers, gameMode, onClose, onNewRound }: GameEndStatsDialogProps) {
  const { history } = useGameHistory()
  const [showStats, setShowStats] = useState(false)

  // Podium first (trophy + confetti), then the statistics slide in
  useEffect(() => {
    if (prefersReducedMotion()) {
      setShowStats(true)
      return
    }
    const cancel = celebrate('big', { x: 0.5, y: 0.35 })
    const timer = window.setTimeout(() => setShowStats(true), 900)
    return () => {
      cancel()
      window.clearTimeout(timer)
    }
  }, [])

  // Calculate round statistics
  const roundStats = useMemo(() => {
    return allPlayers.map((player) => {
      // In Timeline modes: cards = correctly placed cards
      // In Hardcore mode: cards = total attempts (can be >10 if wrong placements)
      const correctCards = player.cards
      const songsInTimeline = player.timeline.length

      return {
        name: player.name,
        correctCards,
        songsInTimeline,
        score: player.score,
        cards: player.cards
      }
    })
  }, [allPlayers])

  // Calculate global player statistics
  const globalStats = useMemo(() => {
    const playerStats = new Map<
      string,
      {
        totalGames: number
        wins: number
        totalScore: number
        avgScore: number
        winRate: number
      }
    >()

    history.forEach((game) => {
      game.players.forEach((player) => {
        if (!playerStats.has(player.name)) {
          playerStats.set(player.name, {
            totalGames: 0,
            wins: 0,
            totalScore: 0,
            avgScore: 0,
            winRate: 0
          })
        }

        const stats = playerStats.get(player.name)!
        stats.totalGames++
        stats.totalScore += player.score

        if (game.winner.name === player.name) {
          stats.wins++
        }
      })
    })

    // Calculate derived stats
    playerStats.forEach((stats) => {
      stats.avgScore = stats.totalGames > 0 ? stats.totalScore / stats.totalGames : 0
      stats.winRate = stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0
    })

    return Array.from(playerStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.winRate - a.winRate)
  }, [history])

  return (
    <div className="py-6">
      {/* Winner Celebration */}
      <div className="text-center mb-8">
        <m.div
          className="text-6xl sm:text-8xl mb-4"
          initial={{ scale: 0.2, rotate: -25, y: 30 }}
          animate={{ scale: 1, rotate: 0, y: 0 }}
          transition={{ ...spring.spatialSlow, delay: 0.05 }}
          aria-hidden="true"
        >
          🏆
        </m.div>
        <h2 className="text-3xl sm:text-4xl font-bold text-gradient mb-2">{winner.name}</h2>
        <p className="text-lg sm:text-xl text-secondary mb-4">ist der Gewinner!</p>
        {gameMode === 'hardcore' && (
          <div className="inline-block glass px-6 py-3 rounded-full border-2 border-accent">
            <span className="text-3xl font-bold text-accent">{winner.score} Punkte</span>
          </div>
        )}
        {gameMode !== 'hardcore' && (
          <div className="inline-block glass px-6 py-3 rounded-full border-2 border-accent">
            <span className="text-3xl font-bold text-accent">{winner.cards} Karten</span>
          </div>
        )}
      </div>

      {/* Stats become visible after confetti */}
      <div
        className={`transition-[opacity,transform] duration-m3-spatial-slow ease-m3-spatial-slow ${
          showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Round Statistics */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>Rundenstatistiken</span>
          </h3>

          <div className="space-y-4 stagger-children">
            {roundStats.map((playerStat) => (
              <div
                key={playerStat.name}
                className="glass p-4 rounded-m3-md border-2 border-accent/30 hover:border-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {playerStat.name === winner.name && <span className="text-3xl">🏆</span>}
                    <div>
                      <h4 className="text-lg font-bold text-text-primary">{playerStat.name}</h4>
                      {gameMode === 'hardcore' && (
                        <p className="text-sm text-text-secondary">{playerStat.score} Punkte</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-secondary">{playerStat.cards}</div>
                    <p className="text-xs text-text-secondary">Karten platziert</p>
                  </div>
                </div>

                {/* Progress bar showing cards placed towards goal of 10 */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-text-secondary mb-2">
                    <span>Fortschritt</span>
                    <span>{playerStat.cards} / 10 Karten</span>
                  </div>
                  <div className="h-4 bg-primary/50 rounded-full overflow-hidden border border-accent/20">
                    <div
                      className="h-full bg-gradient-to-r from-secondary to-accent m3-bar-fill"
                      style={{ transform: `scaleX(${Math.max(0, Math.min(1, (Math.min((playerStat.cards / 10) * 100, 100)) / 100))})` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Player Statistics */}
        {globalStats.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
              <span>🌍</span>
              <span>Globale Statistiken</span>
            </h3>

            <div className="glass p-4 sm:p-6 rounded-m3-md border-2 border-accent/30">
              <div className="space-y-4 stagger-children">
                {globalStats.slice(0, 5).map((playerGlobal, index) => (
                  <div key={playerGlobal.name} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    {/* Rank + Name */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 sm:w-12 text-center flex-shrink-0">
                        {index === 0 && <span className="text-2xl sm:text-3xl">🥇</span>}
                        {index === 1 && <span className="text-2xl sm:text-3xl">🥈</span>}
                        {index === 2 && <span className="text-2xl sm:text-3xl">🥉</span>}
                        {index > 2 && (
                          <span className="text-lg sm:text-xl font-bold text-text-secondary">#{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-text-primary truncate">{playerGlobal.name}</div>
                        <div className="text-xs text-text-secondary">
                          {playerGlobal.totalGames} Spiele · Ø {playerGlobal.avgScore.toFixed(1)} Punkte
                        </div>
                      </div>
                      <div className="sm:hidden text-right flex-shrink-0">
                        <div className="text-lg font-bold text-accent">{playerGlobal.wins}</div>
                        <div className="text-xs text-text-secondary">Siege</div>
                      </div>
                    </div>

                    {/* Win Rate Bar */}
                    <div className="flex-1 pl-11 sm:pl-0">
                      <div className="flex justify-between text-xs text-text-secondary mb-1">
                        <span>Siegesrate</span>
                        <span>{playerGlobal.winRate.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-primary/50 rounded-full overflow-hidden border border-accent/20">
                        <div
                          className="h-full bg-gradient-to-r from-accent to-secondary m3-bar-fill"
                          style={{ transform: `scaleX(${Math.max(0, Math.min(1, (playerGlobal.winRate) / 100))})` }}
                        />
                      </div>
                    </div>

                    {/* Wins - desktop only */}
                    <div className="hidden sm:block w-20 text-right flex-shrink-0">
                      <div className="text-lg font-bold text-accent">{playerGlobal.wins}</div>
                      <div className="text-xs text-text-secondary">Siege</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <button onClick={onClose} className="btn btn-secondary px-6 py-3 text-base sm:text-lg w-full sm:w-auto">
            🏠 Zur Startseite
          </button>
          <button onClick={onNewRound} className="btn btn-accent px-6 py-3 text-base sm:text-lg shadow-m3-2 w-full sm:w-auto">
            🔄 Neue Runde
          </button>
        </div>
      </div>
    </div>
  )
}
