/**
 * GENERATE REALISTIC GAME HISTORY
 * Creates 3 players (m, n, o) and 1000 realistic games
 * For testing statistics display
 */

console.log('🎮 GENERATING REALISTIC GAME HISTORY...\n')

// STEP 1: Wipe old data
console.log('Step 1: Wiping old data...')
localStorage.removeItem('mxster_achievements')
localStorage.removeItem('mxster_settings')
localStorage.removeItem('mxster_game_state')
localStorage.removeItem('mxster_history')
console.log('✅ Data cleared\n')

// STEP 2: Create settings
console.log('Step 2: Creating settings...')
const settings = {
  randomStartPosition: false,
  hideYearsInTimeline: false,
  savedPlayers: ['m', 'n', 'o']
}
localStorage.setItem('mxster_settings', JSON.stringify(settings))
console.log('✅ Players: m, n, o\n')

// STEP 3: Generate 1000 realistic games
console.log('Step 3: Generating 1000 games...')

const gameModes = ['hardcore', 'timeline_personal', 'timeline_global']
const gameVariants = ['physical', 'virtual']
const players = ['m', 'n', 'o']

// Player skill levels (affects scores)
const skillLevels = {
  m: 0.8,  // 80% skill - best player
  n: 0.6,  // 60% skill - medium player
  o: 0.4   // 40% skill - weakest player
}

const games = []
const now = Date.now()
const oneDay = 24 * 60 * 60 * 1000

for (let i = 0; i < 1000; i++) {
  const gameMode = gameModes[Math.floor(Math.random() * gameModes.length)]
  const gameVariant = gameVariants[Math.floor(Math.random() * gameVariants.length)]
  
  // Random 2-3 players per game
  const numPlayers = 2 + Math.floor(Math.random() * 2)
  const shuffled = [...players].sort(() => Math.random() - 0.5)
  const gamePlayers = shuffled.slice(0, numPlayers)
  
  const playerData = gamePlayers.map(name => {
    const skill = skillLevels[name]
    
    if (gameMode === 'hardcore') {
      // Hardcore mode: score based on skill (0-150 points)
      const baseScore = Math.floor(skill * 150)
      const variance = Math.floor(Math.random() * 30) - 15
      const score = Math.max(0, Math.min(150, baseScore + variance))
      const cards = Math.floor(score / 15) // Cards roughly match score
      
      return {
        name,
        score,
        cards: Math.max(1, cards),
        timeline: []
      }
    } else {
      // Timeline modes: cards based on skill (1-15)
      const baseCards = Math.floor(skill * 15)
      const variance = Math.floor(Math.random() * 6) - 3
      const cards = Math.max(1, Math.min(15, baseCards + variance))
      
      return {
        name,
        score: 0,
        cards,
        timeline: []
      }
    }
  })
  
  // Determine winner (highest score or most cards)
  const winner = playerData.reduce((prev, current) => {
    if (gameMode === 'hardcore') {
      return current.score > prev.score ? current : prev
    } else {
      return current.cards > prev.cards ? current : prev
    }
  })
  
  // Game date: spread over last 60 days
  const daysAgo = Math.floor(Math.random() * 60)
  const gameDate = new Date(now - (daysAgo * oneDay))
  
  // Duration: 10-45 minutes
  const duration = (10 + Math.floor(Math.random() * 35)) * 60 * 1000
  
  games.push({
    id: now + i,
    timestamp: gameDate.getTime(),
    date: gameDate.toISOString(),
    winner: {
      name: winner.name,
      cards: winner.cards,
      score: winner.score
    },
    players: playerData,
    gameMode,
    gameVariant,
    duration,
    totalRounds: gameMode === 'hardcore' ? 10 : winner.cards
  })
}

// Sort games by date (newest first - for display)
games.sort((a, b) => b.timestamp - a.timestamp)

// IMPORTANT: Store as array directly (not as object with version/games)
// useGameHistory expects: HistoryEntry[]
// CRITICAL: Use correct localStorage key: 'mxster_history'
localStorage.setItem('mxster_history', JSON.stringify(games))
console.log('✅ Generated 1000 games')

// STEP 4: Generate achievements based on history
console.log('\nStep 4: Generating achievements from games...')

const achievements = {}

players.forEach(playerName => {
  const playerGames = games.filter(g => g.players.some(p => p.name === playerName))
  const wins = games.filter(g => g.winner.name === playerName).length
  const totalGames = playerGames.length
  const totalPoints = playerGames.reduce((sum, g) => {
    const player = g.players.find(p => p.name === playerName)
    return sum + (player?.score || 0)
  }, 0)
  
  // Calculate consecutive wins
  let maxConsecutiveWins = 0
  let currentStreak = 0
  games.forEach(g => {
    if (g.players.some(p => p.name === playerName)) {
      if (g.winner.name === playerName) {
        currentStreak++
        maxConsecutiveWins = Math.max(maxConsecutiveWins, currentStreak)
      } else {
        currentStreak = 0
      }
    }
  })
  
  // Determine which achievements to unlock based on performance
  const achievementList = [
    {
      id: 'perfect_streak',
      name: 'Volltreffer-Serie',
      description: '3x hintereinander alle Felder richtig erraten',
      icon: '🎯',
      target: 3,
      unlocked: skillLevels[playerName] >= 0.7,
      progress: skillLevels[playerName] >= 0.7 ? 3 : Math.floor(skillLevels[playerName] * 3)
    },
    {
      id: 'perfectionist',
      name: 'Perfektionist',
      description: 'Alle Songs in einem Spiel richtig einsortiert',
      icon: '⭐',
      unlocked: skillLevels[playerName] >= 0.8
    },
    {
      id: 'time_traveler',
      name: 'Zeitreisender',
      description: 'Songs aus 5 verschiedenen Dekaden korrekt platziert',
      icon: '🕰️',
      target: 5,
      unlocked: totalGames >= 20,
      progress: Math.min(5, Math.floor(totalGames / 4))
    },
    {
      id: 'hardcore_champion',
      name: 'Hardcore-Champion',
      description: '100+ Punkte in einem Hardcore-Spiel erreicht',
      icon: '🏆',
      target: 100,
      unlocked: totalPoints >= 100 * wins,
      progress: Math.floor(Math.max(...playerGames.filter(g => g.gameMode === 'hardcore').map(g => g.players.find(p => p.name === playerName)?.score || 0)))
    },
    {
      id: 'marathon_runner',
      name: 'Marathonläufer',
      description: '50 Spiele gespielt',
      icon: '🏃',
      target: 50,
      unlocked: totalGames >= 50,
      progress: totalGames
    },
    {
      id: 'unbeatable',
      name: 'Unbesiegbar',
      description: '5 Spiele in Folge gewonnen',
      icon: '👑',
      target: 5,
      unlocked: maxConsecutiveWins >= 5,
      progress: maxConsecutiveWins
    },
    {
      id: 'decade_master',
      name: 'Dekaden-Kenner',
      description: '10 Songs einer Dekade perfekt erraten',
      icon: '🎸',
      target: 10,
      unlocked: skillLevels[playerName] >= 0.6,
      progress: skillLevels[playerName] >= 0.6 ? 10 : Math.floor(skillLevels[playerName] * 15)
    },
    {
      id: 'lightning_fast',
      name: 'Blitzschnell',
      description: 'Ein Spiel in unter 5 Minuten abgeschlossen',
      icon: '⚡',
      unlocked: playerGames.some(g => g.duration < 5 * 60 * 1000)
    },
    {
      id: 'comeback_king',
      name: 'Comeback-King',
      description: 'Aus letztem Platz zum Gewinner aufgestiegen',
      icon: '🔥',
      unlocked: wins > 0 && skillLevels[playerName] >= 0.5
    },
    {
      id: 'music_expert',
      name: 'Musikexperte',
      description: '1000 Gesamtpunkte über alle Spiele erreicht',
      icon: '🎓',
      target: 1000,
      unlocked: totalPoints >= 1000,
      progress: totalPoints
    }
  ]
  
  // Add unlockedAt timestamp for unlocked achievements
  achievementList.forEach(a => {
    if (a.unlocked && !a.unlockedAt) {
      a.unlockedAt = Date.now() - Math.floor(Math.random() * 30 * oneDay)
    }
  })
  
  achievements[playerName] = {
    playerName,
    achievements: achievementList,
    stats: {
      totalGames,
      totalWins: wins,
      consecutiveWins: maxConsecutiveWins,
      totalPoints,
      perfectStreakCurrent: 0,
      perfectStreakBest: skillLevels[playerName] >= 0.7 ? 3 : Math.floor(skillLevels[playerName] * 3)
    }
  }
})

localStorage.setItem('mxster_achievements', JSON.stringify(achievements))
console.log('✅ Achievements generated for all players')

// STEP 5: Statistics
console.log('\n📊 STATISTICS:')
console.log('='.repeat(60))
players.forEach(p => {
  const playerGames = games.filter(g => g.players.some(pl => pl.name === p))
  const wins = games.filter(g => g.winner.name === p).length
  const winRate = ((wins / playerGames.length) * 100).toFixed(1)
  const unlocked = achievements[p].achievements.filter(a => a.unlocked).length
  
  console.log(`Player "${p}":`)
  console.log(`  Games: ${playerGames.length} | Wins: ${wins} (${winRate}%) | Achievements: ${unlocked}/10`)
})

console.log('\n🎉 SUCCESS! Reloading in 2 seconds...')
console.log('👀 Check Player Stats and Achievements dialogs!')

setTimeout(() => location.reload(), 2000)
