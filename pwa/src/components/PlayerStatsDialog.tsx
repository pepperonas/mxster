/**
 * Player Statistics Dialog Component
 * Shows graphical player statistics from game history
 */

import { useGameHistory } from '@/hooks'
import { useMemo } from 'react'

interface PlayerStats {
  name: string
  totalGames: number
  hardcoreGames: number // NEW: Count only hardcore mode games for avgScore
  wins: number
  losses: number
  winRate: number
  totalScore: number
  avgScore: number
  bestDecade: string
  decadeStats: Record<string, number> // decade -> correct cards
  bestGenre: string
  genreStats: Record<string, number> // genre -> correct cards
}

export function PlayerStatsDialog() {
  const { history } = useGameHistory()

  // Calculate player statistics
  const playerStats = useMemo((): PlayerStats[] => {
    if (history.length === 0) return []

    const statsMap = new Map<string, PlayerStats>()

    history.forEach((game) => {
      game.players.forEach((player) => {
        if (!statsMap.has(player.name)) {
          statsMap.set(player.name, {
            name: player.name,
            totalGames: 0,
            hardcoreGames: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            totalScore: 0,
            avgScore: 0,
            bestDecade: 'N/A',
            decadeStats: {},
            bestGenre: 'N/A',
            genreStats: {}
          })
        }

        const stats = statsMap.get(player.name)!
        stats.totalGames++
        stats.totalScore += player.score

        // Count COMPLETED hardcore mode games for avgScore calculation
        // Only count games where player actually finished (10 cards in timeline)
        if (game.gameMode === 'hardcore' && player.timeline.length === 10) {
          stats.hardcoreGames++
        }

        // Check if winner
        if (game.winner.name === player.name) {
          stats.wins++
        }

        // Analyze decade knowledge from timeline
        player.timeline.forEach((song) => {
          const decade = Math.floor(song.year / 10) * 10
          const decadeKey = `${decade}s`
          stats.decadeStats[decadeKey] = (stats.decadeStats[decadeKey] || 0) + 1

          // Analyze genre knowledge from timeline
          if (song.genre) {
            stats.genreStats[song.genre] = (stats.genreStats[song.genre] || 0) + 1
          }
        })
      })
    })

    // Calculate derived stats
    statsMap.forEach((stats) => {
      stats.losses = stats.totalGames - stats.wins
      stats.winRate = stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0
      // FIXED: Calculate avgScore only from hardcore games (where points are earned)
      stats.avgScore = stats.hardcoreGames > 0 ? stats.totalScore / stats.hardcoreGames : 0

      // Find best decade
      if (Object.keys(stats.decadeStats).length > 0) {
        const bestDecadeEntry = Object.entries(stats.decadeStats).reduce((max, current) =>
          current[1] > max[1] ? current : max
        )
        stats.bestDecade = bestDecadeEntry[0]
      }

      // Find best genre
      if (Object.keys(stats.genreStats).length > 0) {
        const bestGenreEntry = Object.entries(stats.genreStats).reduce((max, current) =>
          current[1] > max[1] ? current : max
        )
        stats.bestGenre = bestGenreEntry[0]
      }
    })

    // Sort by win rate, then by total wins
    return Array.from(statsMap.values()).sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate
      return b.wins - a.wins
    })
  }, [history])

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-xl text-text-primary mb-2">Noch keine Statistiken</p>
        <p className="text-sm text-text-secondary">Spiele ein paar Spiele, um deine Statistiken zu sehen!</p>
      </div>
    )
  }

  return (
    <div className="py-4">
      <div className="space-y-6 stagger-children">
        {playerStats.map((player, index) => (
          <div
            key={player.name}
            className="glass p-4 sm:p-6 rounded-m3-md border-2 border-accent/30 hover:border-accent/50 transition-colors"
          >
            {/* Player Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {index === 0 && <span className="text-3xl">🏆</span>}
                {index === 1 && <span className="text-3xl">🥈</span>}
                {index === 2 && <span className="text-3xl">🥉</span>}
                {index > 2 && <span className="text-3xl">👤</span>}
                <div>
                  <h3 className="text-xl font-bold text-gradient">{player.name}</h3>
                  <p className="text-sm text-text-secondary">{player.totalGames} Spiele gespielt</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-secondary">{player.winRate.toFixed(0)}%</div>
                <p className="text-xs text-text-secondary">Siegesrate</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4">
              {/* Wins */}
              <div className="glass p-4 rounded-m3-md border border-secondary/30 bg-secondary/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">✅</span>
                  <span className="text-sm text-text-secondary">Siege</span>
                </div>
                <div className="text-2xl font-bold text-secondary">{player.wins}</div>
              </div>

              {/* Losses */}
              <div className="glass p-4 rounded-m3-md border border-md-error/30 bg-md-error/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">❌</span>
                  <span className="text-sm text-text-secondary">Verloren</span>
                </div>
                <div className="text-2xl font-bold text-md-error">{player.losses}</div>
              </div>

              {/* Total Score (Progressive Achievement Progress) */}
              <div className="glass p-4 rounded-m3-md border border-accent/30 bg-accent/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">👑</span>
                  <span className="text-sm text-text-secondary">Gesamtpunkte</span>
                </div>
                <div className="text-2xl font-bold text-accent">{player.totalScore}</div>

                {/* Under 1000: Show progress to Musikexperte */}
                {player.totalScore < 1000 && (
                  <div className="mt-2">
                    <div className="text-xs text-text-secondary mb-1">
                      {player.totalScore}/1000 bis Musikexperte (🎓)
                    </div>
                    <div className="h-2 bg-primary/50 rounded-full overflow-hidden border border-accent/20">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-secondary transition-all duration-500"
                        style={{ width: `${(player.totalScore / 1000) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 1000-4999: Show Musikexperte achieved, progress to Großmeister */}
                {player.totalScore >= 1000 && player.totalScore < 5000 && (
                  <div className="mt-2">
                    <div className="text-xs text-secondary flex items-center gap-1 mb-2">
                      <span>🎓</span> Musikexperte erreicht!
                    </div>
                    <div className="text-xs text-text-secondary mb-1">
                      {player.totalScore}/5000 bis Großmeister (👑💎)
                    </div>
                    <div className="h-2 bg-primary/50 rounded-full overflow-hidden border border-accent/20">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-secondary transition-all duration-500"
                        style={{ width: `${(player.totalScore / 5000) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 5000+: Show Großmeister achieved */}
                {player.totalScore >= 5000 && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-secondary flex items-center gap-1">
                      <span>🎓</span> Musikexperte erreicht!
                    </div>
                    <div className="text-xs text-secondary flex items-center gap-1">
                      <span>👑💎</span> Großmeister erreicht!
                    </div>
                  </div>
                )}
              </div>

              {/* Average Score */}
              <div className="glass p-4 rounded-m3-md border border-accent/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⭐</span>
                  <span className="text-sm text-text-secondary">Ø Punkte</span>
                </div>
                <div className="text-2xl font-bold text-accent">{player.avgScore.toFixed(1)}</div>
              </div>

              {/* Best Decade */}
              <div className="glass p-4 rounded-m3-md border border-secondary/30 bg-secondary/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎵</span>
                  <span className="text-sm text-text-secondary">Bestes Jahrzehnt</span>
                </div>
                <div className="text-2xl font-bold text-secondary">{player.bestDecade}</div>
              </div>

              {/* Best Genre */}
              <div className="glass p-4 rounded-m3-md border border-accent/30 bg-accent/10 col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎸</span>
                  <span className="text-sm text-text-secondary">Lieblings-Genre</span>
                </div>
                <div className="text-2xl font-bold text-accent">{player.bestGenre}</div>
              </div>
            </div>

            {/* Win Rate Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-text-secondary mb-2">
                <span>Siegesrate</span>
                <span>{player.winRate.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-primary/50 rounded-full overflow-hidden border border-accent/20">
                <div
                  className="h-full bg-gradient-to-r from-accent to-secondary transition-all duration-500 shadow-glow-accent"
                  style={{ width: `${player.winRate}%` }}
                />
              </div>
            </div>

            {/* Decade Distribution */}
            {Object.keys(player.decadeStats).length > 0 && (
              <div className="mt-4 pt-4 border-t border-accent/20">
                <p className="text-sm text-text-secondary mb-3">Jahrzehnte-Verteilung</p>
                <div className="space-y-2">
                  {Object.entries(player.decadeStats)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([decade, count]) => {
                      const maxCount = Math.max(...Object.values(player.decadeStats))
                      const percentage = (count / maxCount) * 100

                      return (
                        <div key={decade} className="flex items-center gap-3">
                          <span className="text-xs text-text-secondary w-12">{decade}</span>
                          <div className="flex-1 h-2 bg-primary/50 rounded-full overflow-hidden border border-accent/10">
                            <div
                              className={`h-full transition-all duration-500 ${
                                player.bestDecade === decade
                                  ? 'bg-gradient-to-r from-secondary to-accent shadow-glow-accent'
                                  : 'bg-gradient-to-r from-accent/70 to-secondary/70'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-text-secondary w-8 text-right">{count}</span>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Genre Distribution */}
            {Object.keys(player.genreStats).length > 0 && (
              <div className="mt-4 pt-4 border-t border-accent/20">
                <p className="text-sm text-text-secondary mb-3">Genre-Verteilung</p>
                <div className="space-y-2">
                  {Object.entries(player.genreStats)
                    .sort(([, countA], [, countB]) => countB - countA) // Sort by count descending
                    .map(([genre, count]) => {
                      const maxCount = Math.max(...Object.values(player.genreStats))
                      const percentage = (count / maxCount) * 100

                      return (
                        <div key={genre} className="flex items-center gap-3">
                          <span className="text-xs text-text-secondary w-20 truncate" title={genre}>{genre}</span>
                          <div className="flex-1 h-2 bg-primary/50 rounded-full overflow-hidden border border-accent/10">
                            <div
                              className={`h-full transition-all duration-500 ${
                                player.bestGenre === genre
                                  ? 'bg-gradient-to-r from-accent to-secondary shadow-glow-accent'
                                  : 'bg-gradient-to-r from-secondary/70 to-accent/70'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-text-secondary w-8 text-right">{count}</span>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
