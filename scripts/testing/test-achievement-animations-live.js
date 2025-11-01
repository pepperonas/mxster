/**
 * LIVE ACHIEVEMENT ANIMATION TEST SCRIPT
 * Simulates a game ending with multiple achievement unlocks
 *
 * USAGE:
 * 1. Start game: Hardcore Mode, Virtual Mode, 2-3 players
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. The script will simulate achievements being unlocked
 *
 * NOTE: This only works during an active game session!
 */

console.log('🎬 LIVE ACHIEVEMENT ANIMATION TEST\n')

// Function to simulate achievement unlock via React DevTools
const simulateAchievementUnlock = (playerName, achievementId, achievementData) => {
  console.log(`🏆 Simulating unlock: ${achievementData.name} for ${playerName}`)

  // Try to access React Fiber to find the AchievementContext
  const rootElement = document.getElementById('root')

  if (!rootElement || !rootElement._reactRootContainer) {
    console.error('❌ React root not found. Make sure you are on the app page!')
    return false
  }

  // Alternative: Use localStorage + custom event
  const event = new CustomEvent('test-achievement-unlock', {
    detail: { playerName, achievementId, achievement: achievementData }
  })
  window.dispatchEvent(event)

  console.log('✅ Event dispatched')
  return true
}

// Test Achievement Data
const ACHIEVEMENTS = {
  hardcore_champion: {
    id: 'hardcore_champion',
    name: 'Hardcore-Champion',
    description: '100+ Punkte in einem Hardcore-Spiel erreicht',
    icon: '🏆',
    unlocked: true,
    unlockedAt: Date.now()
  },
  time_traveler: {
    id: 'time_traveler',
    name: 'Zeitreisender',
    description: 'Songs aus 5 verschiedenen Dekaden korrekt platziert',
    icon: '🕰️',
    unlocked: true,
    unlockedAt: Date.now()
  },
  perfectionist: {
    id: 'perfectionist',
    name: 'Perfektionist',
    description: 'Alle Songs in einem Spiel richtig einsortiert',
    icon: '⭐',
    unlocked: true,
    unlockedAt: Date.now()
  },
  lightning_fast: {
    id: 'lightning_fast',
    name: 'Blitzschnell',
    description: 'Ein Spiel in unter 5 Minuten abgeschlossen',
    icon: '⚡',
    unlocked: true,
    unlockedAt: Date.now()
  },
  comeback_king: {
    id: 'comeback_king',
    name: 'Comeback-King',
    description: 'Vom letzten Platz zum Gewinner aufgestiegen',
    icon: '🔥',
    unlocked: true,
    unlockedAt: Date.now()
  }
}

console.log('⚠️  IMPORTANT: This script requires the AchievementContext to be active.')
console.log('📝 Alternative approach: Finish a real Hardcore game!\n')

console.log('🎮 RECOMMENDED TEST METHOD:')
console.log('  1. Navigate to: Mode Selection')
console.log('  2. Select: Hardcore Mode (🔥)')
console.log('  3. Select: Virtual Mode (🎲)')
console.log('  4. Add players: "Test1" and "Test2"')
console.log('  5. Play game normally')
console.log('  6. Skip songs quickly (click "Überspringen")')
console.log('  7. Reach end of game (10 cards)')
console.log('  8. Watch for animations!')

console.log('\n💡 For instant testing, use the unlock-all-achievements.js script instead!')
console.log('   Location: /scripts/testing/unlock-all-achievements.js')
