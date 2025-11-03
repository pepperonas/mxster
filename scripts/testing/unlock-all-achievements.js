/**
 * UNLOCK ALL ACHIEVEMENTS TEST SCRIPT (v0.0.25)
 * Creates 2 test players:
 * - Player "m": ALL 20 achievements unlocked
 * - Player "n": 10 achievements unlocked, 10 locked (with progress)
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
      // Original 10
      {id: 'perfect_streak', name: 'Volltreffer-Serie', description: '3x hintereinander alle Felder richtig erraten', icon: '🎯', target: 3, unlocked: true, unlockedAt: Date.now(), progress: 3},
      {id: 'perfectionist', name: 'Perfektionist', description: 'Alle Songs in einem Spiel richtig einsortiert', icon: '⭐', unlocked: true, unlockedAt: Date.now()},
      {id: 'time_traveler', name: 'Zeitreisender', description: 'Songs aus 5 verschiedenen Dekaden korrekt platziert', icon: '🕰️', target: 5, unlocked: true, unlockedAt: Date.now(), progress: 5},
      {id: 'hardcore_champion', name: 'Hardcore-Champion', description: '100+ Punkte in einem Hardcore-Spiel erreicht', icon: '🏆', target: 100, unlocked: true, unlockedAt: Date.now(), progress: 100},
      {id: 'marathon_runner', name: 'Marathonläufer', description: '50 Spiele gespielt', icon: '🏃', target: 50, unlocked: true, unlockedAt: Date.now(), progress: 50},
      {id: 'unbeatable', name: 'Unbesiegbar', description: '5 Spiele in Folge gewonnen', icon: '👑', target: 5, unlocked: true, unlockedAt: Date.now(), progress: 5},
      {id: 'decade_master', name: 'Dekaden-Kenner', description: '10 Songs einer Dekade perfekt erraten', icon: '🎸', target: 10, unlocked: true, unlockedAt: Date.now(), progress: 10},
      {id: 'lightning_fast', name: 'Blitzschnell', description: 'Ein Spiel in unter 5 Minuten abgeschlossen', icon: '⚡', unlocked: true, unlockedAt: Date.now()},
      {id: 'comeback_king', name: 'Comeback-King', description: 'Aus letztem Platz zum Gewinner aufgestiegen', icon: '🔥', unlocked: true, unlockedAt: Date.now()},
      {id: 'music_expert', name: 'Musikexperte', description: '1000 Gesamtpunkte über alle Spiele erreicht', icon: '🎓', target: 1000, unlocked: true, unlockedAt: Date.now(), progress: 1000},
      // New 10 (v0.0.24)
      {id: 'zeitmaschine', name: 'Zeitmaschine', description: 'Songs aus 3 verschiedenen Dekaden erraten', icon: '⏰', target: 3, unlocked: true, unlockedAt: Date.now(), progress: 3},
      {id: 'genre_hopper', name: 'Genre-Hopper', description: 'Songs aus 4 verschiedenen Genres erraten', icon: '🎸', target: 4, unlocked: true, unlockedAt: Date.now(), progress: 4},
      {id: 'name_dropper', name: 'Name-Dropper', description: '5 Künstler hintereinander richtig erraten', icon: '🎤', target: 5, unlocked: true, unlockedAt: Date.now(), progress: 5},
      {id: 'social_butterfly', name: 'Sozialschmetterling', description: 'Mit 5 verschiedenen Spielern gespielt', icon: '🦋', target: 5, unlocked: true, unlockedAt: Date.now(), progress: 5},
      {id: 'punktejaeger', name: 'Punktejäger', description: '75+ Punkte in einem Spiel erreicht', icon: '🎯', target: 75, unlocked: true, unlockedAt: Date.now(), progress: 75},
      {id: 'flawless_victory', name: 'Makelloser Sieg', description: 'Ein Spiel mit 150/150 Punkten gewonnen', icon: '💎', unlocked: true, unlockedAt: Date.now()},
      {id: 'legendary_streak', name: 'Legendäre Serie', description: '10 Spiele in Folge gewonnen', icon: '🔥', target: 10, unlocked: true, unlockedAt: Date.now(), progress: 10},
      {id: 'centurion', name: 'Zenturio', description: '100 Spiele gespielt', icon: '💯', target: 100, unlocked: true, unlockedAt: Date.now(), progress: 100},
      {id: 'master_of_time', name: 'Meister der Zeit', description: 'Ein Spiel in unter 3 Minuten abgeschlossen', icon: '⚡', unlocked: true, unlockedAt: Date.now()},
      {id: 'comeback_profi', name: 'Comeback-Profi', description: '5x vom Rückstand zum Sieg gekommen', icon: '🔄', target: 5, unlocked: true, unlockedAt: Date.now(), progress: 5},
      {id: 'grand_master', name: 'Großmeister', description: '5000 Gesamtpunkte über alle Spiele erreicht', icon: '👑', target: 5000, unlocked: true, unlockedAt: Date.now(), progress: 5000}
    ],
    stats: {totalGames: 100, totalWins: 60, consecutiveWins: 10, totalPoints: 5000, perfectStreakCurrent: 3, perfectStreakBest: 3}
  },
  n: {
    playerName: 'n',
    achievements: [
      // Original 10
      {id: 'perfect_streak', name: 'Volltreffer-Serie', description: '3x hintereinander alle Felder richtig erraten', icon: '🎯', target: 3, unlocked: true, unlockedAt: Date.now(), progress: 3},
      {id: 'perfectionist', name: 'Perfektionist', description: 'Alle Songs in einem Spiel richtig einsortiert', icon: '⭐', unlocked: false},
      {id: 'time_traveler', name: 'Zeitreisender', description: 'Songs aus 5 verschiedenen Dekaden korrekt platziert', icon: '🕰️', target: 5, unlocked: true, unlockedAt: Date.now(), progress: 5},
      {id: 'hardcore_champion', name: 'Hardcore-Champion', description: '100+ Punkte in einem Hardcore-Spiel erreicht', icon: '🏆', target: 100, unlocked: false, progress: 75},
      {id: 'marathon_runner', name: 'Marathonläufer', description: '50 Spiele gespielt', icon: '🏃', target: 50, unlocked: true, unlockedAt: Date.now(), progress: 50},
      {id: 'unbeatable', name: 'Unbesiegbar', description: '5 Spiele in Folge gewonnen', icon: '👑', target: 5, unlocked: false, progress: 2},
      {id: 'decade_master', name: 'Dekaden-Kenner', description: '10 Songs einer Dekade perfekt erraten', icon: '🎸', target: 10, unlocked: true, unlockedAt: Date.now(), progress: 10},
      {id: 'lightning_fast', name: 'Blitzschnell', description: 'Ein Spiel in unter 5 Minuten abgeschlossen', icon: '⚡', unlocked: false},
      {id: 'comeback_king', name: 'Comeback-King', description: 'Aus letztem Platz zum Gewinner aufgestiegen', icon: '🔥', unlocked: true, unlockedAt: Date.now()},
      {id: 'music_expert', name: 'Musikexperte', description: '1000 Gesamtpunkte über alle Spiele erreicht', icon: '🎓', target: 1000, unlocked: false, progress: 450},
      // New 10 (v0.0.24)
      {id: 'zeitmaschine', name: 'Zeitmaschine', description: 'Songs aus 3 verschiedenen Dekaden erraten', icon: '⏰', target: 3, unlocked: true, unlockedAt: Date.now(), progress: 3},
      {id: 'genre_hopper', name: 'Genre-Hopper', description: 'Songs aus 4 verschiedenen Genres erraten', icon: '🎸', target: 4, unlocked: false, progress: 2},
      {id: 'name_dropper', name: 'Name-Dropper', description: '5 Künstler hintereinander richtig erraten', icon: '🎤', target: 5, unlocked: false, progress: 3},
      {id: 'social_butterfly', name: 'Sozialschmetterling', description: 'Mit 5 verschiedenen Spielern gespielt', icon: '🦋', target: 5, unlocked: true, unlockedAt: Date.now(), progress: 5},
      {id: 'punktejaeger', name: 'Punktejäger', description: '75+ Punkte in einem Spiel erreicht', icon: '🎯', target: 75, unlocked: false, progress: 68},
      {id: 'flawless_victory', name: 'Makelloser Sieg', description: 'Ein Spiel mit 150/150 Punkten gewonnen', icon: '💎', unlocked: false},
      {id: 'legendary_streak', name: 'Legendäre Serie', description: '10 Spiele in Folge gewonnen', icon: '🔥', target: 10, unlocked: false, progress: 2},
      {id: 'centurion', name: 'Zenturio', description: '100 Spiele gespielt', icon: '💯', target: 100, unlocked: false, progress: 50},
      {id: 'master_of_time', name: 'Meister der Zeit', description: 'Ein Spiel in unter 3 Minuten abgeschlossen', icon: '⚡', unlocked: false},
      {id: 'comeback_profi', name: 'Comeback-Profi', description: '5x vom Rückstand zum Sieg gekommen', icon: '🔄', target: 5, unlocked: false, progress: 1},
      {id: 'grand_master', name: 'Großmeister', description: '5000 Gesamtpunkte über alle Spiele erreicht', icon: '👑', target: 5000, unlocked: false, progress: 450}
    ],
    stats: {totalGames: 50, totalWins: 15, consecutiveWins: 2, totalPoints: 450, perfectStreakCurrent: 1, perfectStreakBest: 3}
  }
}

localStorage.setItem('mxster_achievements', JSON.stringify(achievements))
console.log('✅ Achievements created:')
console.log('   - Player "m": 20/20 unlocked (100%)')
console.log('   - Player "n": 10/20 unlocked (50%)')

// STEP 4: Verify
console.log('\nStep 4: Verifying...')
const verify = JSON.parse(localStorage.getItem('mxster_achievements'))
console.log('   ✅ Player "m":', verify.m ? `${verify.m.achievements.filter(a => a.unlocked).length}/20` : 'NOT FOUND')
console.log('   ✅ Player "n":', verify.n ? `${verify.n.achievements.filter(a => a.unlocked).length}/20` : 'NOT FOUND')

console.log('\n🎉 SUCCESS! Reloading page in 2 seconds...')
console.log('👀 After reload: Click 🏆 icon and switch between players!')

setTimeout(() => location.reload(), 2000)
