/**
 * UNLOCK ALL ACHIEVEMENTS TEST SCRIPT
 * Creates 2 test players:
 * - Player "m": ALL 10 achievements unlocked
 * - Player "n": 5 achievements unlocked, 5 locked (with progress)
 */

console.log('🚀 UNLOCK ACHIEVEMENTS SCRIPT STARTING...\n')

// STEP 1: Complete wipe
console.log('Step 1: Wiping ALL mxster data...')
localStorage.removeItem('mxster_achievements')
localStorage.removeItem('mxster_settings')
localStorage.removeItem('mxster_game_state')
localStorage.removeItem('mxster_history')
console.log('✅ All old data deleted\n')

// STEP 2: Create settings
console.log('Step 2: Creating settings...')
const settings = {
  randomStartPosition: false,
  hideYearsInTimeline: false,
  savedPlayers: ['m', 'n']
}
localStorage.setItem('mxster_settings', JSON.stringify(settings))
console.log('✅ Settings created with players "m" and "n"\n')

// STEP 3: Create achievements
console.log('Step 3: Creating achievements...')
const achievements = {
  m: {
    playerName: 'm',
    achievements: [
      {id: 'perfect_streak', name: 'Volltreffer-Serie', description: '3x hintereinander alle Felder richtig erraten', icon: '🎯', target: 3, unlocked: true, unlockedAt: Date.now(), progress: 3},
      {id: 'perfectionist', name: 'Perfektionist', description: 'Alle Songs in einem Spiel richtig einsortiert', icon: '⭐', unlocked: true, unlockedAt: Date.now()},
      {id: 'time_traveler', name: 'Zeitreisender', description: 'Songs aus 5 verschiedenen Dekaden korrekt platziert', icon: '🕰️', target: 5, unlocked: true, unlockedAt: Date.now(), progress: 5},
      {id: 'hardcore_champion', name: 'Hardcore-Champion', description: '100+ Punkte in einem Hardcore-Spiel erreicht', icon: '🏆', target: 100, unlocked: true, unlockedAt: Date.now(), progress: 100},
      {id: 'marathon_runner', name: 'Marathonläufer', description: '50 Spiele gespielt', icon: '🏃', target: 50, unlocked: true, unlockedAt: Date.now(), progress: 50},
      {id: 'unbeatable', name: 'Unbesiegbar', description: '5 Spiele in Folge gewonnen', icon: '👑', target: 5, unlocked: true, unlockedAt: Date.now(), progress: 5},
      {id: 'decade_master', name: 'Dekaden-Kenner', description: '10 Songs einer Dekade perfekt erraten', icon: '🎸', target: 10, unlocked: true, unlockedAt: Date.now(), progress: 10},
      {id: 'lightning_fast', name: 'Blitzschnell', description: 'Ein Spiel in unter 5 Minuten abgeschlossen', icon: '⚡', unlocked: true, unlockedAt: Date.now()},
      {id: 'comeback_king', name: 'Comeback-King', description: 'Aus letztem Platz zum Gewinner aufgestiegen', icon: '🔥', unlocked: true, unlockedAt: Date.now()},
      {id: 'music_expert', name: 'Musikexperte', description: '1000 Gesamtpunkte über alle Spiele erreicht', icon: '🎓', target: 1000, unlocked: true, unlockedAt: Date.now(), progress: 1000}
    ],
    stats: {totalGames: 50, totalWins: 25, consecutiveWins: 5, totalPoints: 1000, perfectStreakCurrent: 3, perfectStreakBest: 3}
  },
  n: {
    playerName: 'n',
    achievements: [
      {id: 'perfect_streak', name: 'Volltreffer-Serie', description: '3x hintereinander alle Felder richtig erraten', icon: '🎯', target: 3, unlocked: true, unlockedAt: Date.now(), progress: 3},
      {id: 'perfectionist', name: 'Perfektionist', description: 'Alle Songs in einem Spiel richtig einsortiert', icon: '⭐', unlocked: false},
      {id: 'time_traveler', name: 'Zeitreisender', description: 'Songs aus 5 verschiedenen Dekaden korrekt platziert', icon: '🕰️', target: 5, unlocked: true, unlockedAt: Date.now(), progress: 5},
      {id: 'hardcore_champion', name: 'Hardcore-Champion', description: '100+ Punkte in einem Hardcore-Spiel erreicht', icon: '🏆', target: 100, unlocked: false, progress: 75},
      {id: 'marathon_runner', name: 'Marathonläufer', description: '50 Spiele gespielt', icon: '🏃', target: 50, unlocked: true, unlockedAt: Date.now(), progress: 50},
      {id: 'unbeatable', name: 'Unbesiegbar', description: '5 Spiele in Folge gewonnen', icon: '👑', target: 5, unlocked: false, progress: 2},
      {id: 'decade_master', name: 'Dekaden-Kenner', description: '10 Songs einer Dekade perfekt erraten', icon: '🎸', target: 10, unlocked: true, unlockedAt: Date.now(), progress: 10},
      {id: 'lightning_fast', name: 'Blitzschnell', description: 'Ein Spiel in unter 5 Minuten abgeschlossen', icon: '⚡', unlocked: false},
      {id: 'comeback_king', name: 'Comeback-King', description: 'Aus letztem Platz zum Gewinner aufgestiegen', icon: '🔥', unlocked: true, unlockedAt: Date.now()},
      {id: 'music_expert', name: 'Musikexperte', description: '1000 Gesamtpunkte über alle Spiele erreicht', icon: '🎓', target: 1000, unlocked: false, progress: 450}
    ],
    stats: {totalGames: 50, totalWins: 15, consecutiveWins: 2, totalPoints: 450, perfectStreakCurrent: 1, perfectStreakBest: 3}
  }
}

localStorage.setItem('mxster_achievements', JSON.stringify(achievements))
console.log('✅ Achievements created:')
console.log('   - Player "m": 10/10 unlocked (100%)')
console.log('   - Player "n": 5/10 unlocked (50%)')

// STEP 4: Verify
console.log('\nStep 4: Verifying...')
const verify = JSON.parse(localStorage.getItem('mxster_achievements'))
console.log('   ✅ Player "m":', verify.m ? `${verify.m.achievements.filter(a => a.unlocked).length}/10` : 'NOT FOUND')
console.log('   ✅ Player "n":', verify.n ? `${verify.n.achievements.filter(a => a.unlocked).length}/10` : 'NOT FOUND')

console.log('\n🎉 SUCCESS! Reloading page in 2 seconds...')
console.log('👀 After reload: Click 🏆 icon and switch between players!')

setTimeout(() => location.reload(), 2000)
