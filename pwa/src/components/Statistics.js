/**
 * Statistics Component
 *
 * Shows detailed game statistics and player performance
 */

export function renderStatistics(players, gameHistory) {
  // Calculate statistics
  const stats = calculateStats(players, gameHistory)

  return `
    <div class="min-h-screen bg-background p-6">
      <div class="max-w-6xl mx-auto space-y-8 animate-fade-in">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-4xl md:text-5xl font-bold text-gradient mb-2">
              <span class="mr-3">📊</span>Statistiken
            </h1>
            <p class="text-text-secondary">
              Deine Spiel-Performance im Überblick
            </p>
          </div>
          <button class="btn-outline btn" onclick="window.mxsterGame.closeStatistics()">
            <span>←</span> Zurück
          </button>
        </div>

        <!-- Overall Stats Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- Total Games -->
          <div class="glass p-6 rounded-xl text-center hover:shadow-glow-sm transition-all">
            <div class="text-4xl font-bold text-gradient mb-2">
              ${stats.totalGames}
            </div>
            <div class="text-sm text-text-secondary">
              Gespielte Runden
            </div>
          </div>

          <!-- Total Songs -->
          <div class="glass p-6 rounded-xl text-center hover:shadow-glow-sm transition-all">
            <div class="text-4xl font-bold text-gradient mb-2">
              ${stats.totalSongs}
            </div>
            <div class="text-sm text-text-secondary">
              Geratene Songs
            </div>
          </div>

          <!-- Success Rate -->
          <div class="glass p-6 rounded-xl text-center hover:shadow-glow-sm transition-all">
            <div class="text-4xl font-bold text-gradient mb-2">
              ${stats.successRate}%
            </div>
            <div class="text-sm text-text-secondary">
              Erfolgsquote
            </div>
          </div>

          <!-- Average Score -->
          <div class="glass p-6 rounded-xl text-center hover:shadow-glow-sm transition-all">
            <div class="text-4xl font-bold text-gradient mb-2">
              ${stats.avgScore}
            </div>
            <div class="text-sm text-text-secondary">
              Ø Punkte/Spieler
            </div>
          </div>
        </div>

        <!-- Player Leaderboard -->
        <div class="card">
          <h2 class="text-2xl font-bold mb-6 flex items-center gap-3">
            <span>🏆</span>
            Spieler-Ranking
          </h2>

          <div class="space-y-3">
            ${renderLeaderboard(players)}
          </div>
        </div>

        <!-- Performance Chart -->
        <div class="card">
          <h2 class="text-2xl font-bold mb-6 flex items-center gap-3">
            <span>📈</span>
            Punkteverteilung
          </h2>

          ${renderPerformanceChart(stats.scoreDistribution)}
        </div>

        <!-- Recent Games History -->
        ${gameHistory && gameHistory.length > 0 ? `
          <div class="card">
            <h2 class="text-2xl font-bold mb-6 flex items-center gap-3">
              <span>🕐</span>
              Letzte Spiele
            </h2>

            <div class="space-y-4">
              ${renderGameHistory(gameHistory.slice(-10).reverse())}
            </div>
          </div>
        ` : ''}

        <!-- Achievements Section -->
        <div class="card">
          <h2 class="text-2xl font-bold mb-6 flex items-center gap-3">
            <span>🎖️</span>
            Errungenschaften
          </h2>

          <div class="grid md:grid-cols-2 gap-4">
            ${renderAchievements(stats)}
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * Calculate statistics from players and game history
 */
function calculateStats(players, gameHistory) {
  const totalGames = gameHistory ? gameHistory.length : 0
  const totalSongs = players.reduce((sum, p) => sum + (p.cards || 0), 0)
  const totalScore = players.reduce((sum, p) => sum + (p.score || 0), 0)
  const avgScore = players.length > 0 ? Math.round(totalScore / players.length) : 0

  // Success rate: percentage of players with score > 0
  const successfulPlayers = players.filter(p => (p.score || 0) > 0).length
  const successRate = players.length > 0 ? Math.round((successfulPlayers / players.length) * 100) : 0

  // Score distribution (how many +3, +2, +1, 0)
  const scoreDistribution = {
    perfect: 0,    // +3 (guessed all 3 correctly)
    good: 0,       // +2 (guessed 2 correctly)
    partial: 0,    // +1 (guessed 1 correctly)
    wrong: 0       // 0 (guessed 0 correctly)
  }

  // Calculate distribution from game history
  if (gameHistory && gameHistory.length > 0) {
    gameHistory.forEach(game => {
      const points = game.pointsEarned || 0
      if (points === 3) scoreDistribution.perfect++
      else if (points === 2) scoreDistribution.good++
      else if (points === 1) scoreDistribution.partial++
      else scoreDistribution.wrong++
    })
  }

  return {
    totalGames,
    totalSongs,
    successRate,
    avgScore,
    scoreDistribution
  }
}

/**
 * Render leaderboard with player rankings
 */
function renderLeaderboard(players) {
  if (!players || players.length === 0) {
    return `<p class="text-text-secondary text-center py-8">Noch keine Spieler vorhanden</p>`
  }

  // Sort players by score (descending)
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0))

  return sortedPlayers.map((player, index) => {
    const rank = index + 1
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`
    const isTopThree = rank <= 3

    return `
      <div class="player-row ${isTopThree ? 'border-accent' : ''} flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="text-2xl font-bold ${isTopThree ? 'text-accent' : 'text-text-secondary'}">
            ${medal}
          </div>
          <div>
            <div class="font-semibold text-text-primary text-lg">
              ${player.name}
            </div>
            <div class="text-sm text-text-secondary">
              ${player.cards || 0} Karten gespielt
            </div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold text-gradient">
            ${player.score || 0}
          </div>
          <div class="text-sm text-text-secondary">
            Punkte
          </div>
        </div>
      </div>
    `
  }).join('')
}

/**
 * Render performance chart (simple bar chart)
 */
function renderPerformanceChart(scoreDistribution) {
  const total = Object.values(scoreDistribution).reduce((sum, val) => sum + val, 0)

  if (total === 0) {
    return `<p class="text-text-secondary text-center py-8">Noch keine Daten verfügbar</p>`
  }

  const categories = [
    { key: 'perfect', label: '🏆 Perfekt (+3)', color: 'from-green-500 to-green-600' },
    { key: 'good', label: '👍 Gut (+2)', color: 'from-blue-500 to-blue-600' },
    { key: 'partial', label: '🤷 Teilweise (+1)', color: 'from-yellow-500 to-yellow-600' },
    { key: 'wrong', label: '❌ Falsch (0)', color: 'from-red-500 to-red-600' }
  ]

  return `
    <div class="space-y-4">
      ${categories.map(cat => {
        const count = scoreDistribution[cat.key]
        const percentage = Math.round((count / total) * 100)

        return `
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-text-secondary text-sm">${cat.label}</span>
              <span class="text-text-primary font-semibold">${count} (${percentage}%)</span>
            </div>
            <div class="w-full bg-primary/50 rounded-full h-3 overflow-hidden">
              <div
                class="h-full bg-gradient-to-r ${cat.color} transition-all duration-500 rounded-full shadow-glow-sm"
                style="width: ${percentage}%"
              ></div>
            </div>
          </div>
        `
      }).join('')}
    </div>
  `
}

/**
 * Render game history list
 */
function renderGameHistory(history) {
  if (!history || history.length === 0) {
    return `<p class="text-text-secondary text-center py-8">Noch keine Spiele gespielt</p>`
  }

  return history.map(game => {
    const date = new Date(game.timestamp || Date.now())
    const dateStr = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const timeStr = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })

    return `
      <div class="glass p-4 rounded-lg hover:shadow-glow-sm transition-all">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-semibold text-text-primary">
              ${game.playerName || 'Unbekannt'}
            </div>
            <div class="text-sm text-text-secondary">
              ${dateStr} • ${timeStr}
            </div>
          </div>
          <div class="text-right">
            <div class="font-bold text-gradient">
              ${game.pointsEarned !== undefined ? `+${game.pointsEarned} Punkte` : 'Keine Daten'}
            </div>
            <div class="text-xs text-text-secondary">
              ${game.songTitle || ''}
            </div>
          </div>
        </div>
      </div>
    `
  }).join('')
}

/**
 * Render achievements
 */
function renderAchievements(stats) {
  const achievements = [
    {
      icon: '🎯',
      title: 'Erste Schritte',
      description: 'Spiele dein erstes Spiel',
      unlocked: stats.totalGames > 0
    },
    {
      icon: '🔥',
      title: 'Musikkenner',
      description: 'Erreiche 50% Erfolgsquote',
      unlocked: stats.successRate >= 50
    },
    {
      icon: '💎',
      title: 'Punktesammler',
      description: 'Erreiche 30 Punkte gesamt',
      unlocked: stats.avgScore >= 30
    },
    {
      icon: '🏆',
      title: 'Meister',
      description: 'Spiele 10 Spiele',
      unlocked: stats.totalGames >= 10
    },
    {
      icon: '🎵',
      title: 'Song-Experte',
      description: 'Rate 20 Songs',
      unlocked: stats.totalSongs >= 20
    },
    {
      icon: '⭐',
      title: 'Perfektionist',
      description: 'Erreiche 80% Erfolgsquote',
      unlocked: stats.successRate >= 80
    }
  ]

  return achievements.map(achievement => {
    return `
      <div class="glass p-6 rounded-xl ${achievement.unlocked ? 'border-2 border-accent shadow-glow-accent' : 'opacity-50'}">
        <div class="text-4xl mb-3">
          ${achievement.unlocked ? achievement.icon : '🔒'}
        </div>
        <h3 class="font-bold text-lg mb-2 text-text-primary">
          ${achievement.title}
        </h3>
        <p class="text-sm text-text-secondary">
          ${achievement.description}
        </p>
        ${achievement.unlocked ? `
          <div class="mt-3 text-xs font-semibold text-accent">
            ✓ Freigeschaltet
          </div>
        ` : `
          <div class="mt-3 text-xs font-semibold text-text-secondary">
            Noch nicht freigeschaltet
          </div>
        `}
      </div>
    `
  }).join('')
}
