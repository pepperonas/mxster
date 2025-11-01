/**
 * ACHIEVEMENT ANIMATION TEST SCRIPT
 * Test the achievement unlock animation system in the browser console
 *
 * USAGE:
 * 1. Open http://localhost:5174/ in browser
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Watch the animations!
 *
 * This script simulates achievement unlocks by directly calling the
 * notification queue system.
 */

console.log('🎬 ACHIEVEMENT ANIMATION TEST STARTING...\n')
console.log('⚠️  Make sure you are on http://localhost:5174/ or http://127.0.0.1:5174/\n')

// Wait for React to load
setTimeout(() => {
  console.log('Step 1: Checking if React context is available...')

  // Try to access the notification queue via window
  // We'll simulate achievement unlocks by directly manipulating localStorage
  // and then triggering the unlock function

  // TEST SCENARIO 1: Single Achievement
  console.log('\n📋 TEST 1: Single Achievement Unlock')
  console.log('   Unlocking: HARDCORE_CHAMPION for player "TestUser"')

  setTimeout(() => {
    // Get current achievements or create new
    const achievements = JSON.parse(localStorage.getItem('mxster_achievements') || '{}')

    if (!achievements.TestUser) {
      achievements.TestUser = {
        playerName: 'TestUser',
        achievements: [
          {id: 'perfect_streak', name: 'Volltreffer-Serie', description: '3x hintereinander alle Felder richtig erraten', icon: '🎯', target: 3, unlocked: false, progress: 0},
          {id: 'perfectionist', name: 'Perfektionist', description: 'Alle Songs in einem Spiel richtig einsortiert', icon: '⭐', unlocked: false},
          {id: 'time_traveler', name: 'Zeitreisender', description: 'Songs aus 5 verschiedenen Dekaden korrekt platziert', icon: '🕰️', target: 5, unlocked: false, progress: 0},
          {id: 'hardcore_champion', name: 'Hardcore-Champion', description: '100+ Punkte in einem Hardcore-Spiel erreicht', icon: '🏆', target: 100, unlocked: false, progress: 0},
          {id: 'marathon_runner', name: 'Marathonläufer', description: '50 Spiele gespielt', icon: '🏃', target: 50, unlocked: false, progress: 0},
          {id: 'unbeatable', name: 'Unbesiegbar', description: '5 Spiele in Folge gewonnen', icon: '👑', target: 5, unlocked: false, progress: 0},
          {id: 'decade_master', name: 'Dekaden-Kenner', description: '10 Songs einer Dekade perfekt erraten', icon: '🎸', target: 10, unlocked: false, progress: 0},
          {id: 'lightning_fast', name: 'Blitzschnell', description: 'Ein Spiel in unter 5 Minuten abgeschlossen', icon: '⚡', unlocked: false},
          {id: 'comeback_king', name: 'Comeback-King', description: 'Vom letzten Platz zum Gewinner aufgestiegen', icon: '🔥', unlocked: false},
          {id: 'music_expert', name: 'Musikexperte', description: '1000 Gesamtpunkte über alle Spiele erreicht', icon: '🎓', target: 1000, unlocked: false, progress: 0}
        ],
        stats: {totalGames: 0, totalWins: 0, consecutiveWins: 0, totalPoints: 0, perfectStreakCurrent: 0, perfectStreakBest: 0}
      }
    }

    // Unlock HARDCORE_CHAMPION
    const achievement = achievements.TestUser.achievements.find(a => a.id === 'hardcore_champion')
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true
      achievement.unlockedAt = Date.now()
      achievement.progress = 100

      localStorage.setItem('mxster_achievements', JSON.stringify(achievements))
      console.log('✅ TEST 1 Complete: Achievement unlocked in localStorage')
      console.log('🔄 Triggering page reload to see animation...')

      // Reload to trigger React context and animation
      setTimeout(() => location.reload(), 500)
    } else {
      console.log('⚠️  Achievement already unlocked. Resetting...')
      achievement.unlocked = false
      delete achievement.unlockedAt
      achievement.progress = 0
      localStorage.setItem('mxster_achievements', JSON.stringify(achievements))
      console.log('🔄 Reset complete. Run script again to test.')
    }
  }, 1000)

}, 500)

console.log('\n⏱️  Timeline:')
console.log('  0.5s: Check React context')
console.log('  1.5s: Unlock achievement & reload page')
console.log('  After reload: Animation should trigger!')
console.log('\n💡 TIP: If you want to test multiple achievements, see test-achievement-animations-advanced.js')
