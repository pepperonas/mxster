/**
 * UNLOCK ACHIEVEMENTS WITH ANIMATIONS
 * This script unlocks achievements WITHOUT page reload
 * and triggers the animations directly via React Context
 *
 * USAGE:
 * 1. Open http://localhost:5174/ in browser
 * 2. Open browser console (F12)
 * 3. Copy and paste this ENTIRE script
 * 4. Watch the animations play sequentially!
 */

console.log('🚀 UNLOCK ACHIEVEMENTS WITH ANIMATIONS - STARTING...\n')

// Function to access React DevTools and trigger achievement unlock
const triggerAchievementUnlock = (playerName, achievementId, achievement) => {
  console.log(`🏆 Triggering: ${achievement.name} for ${playerName}`)

  try {
    // Method 1: Try to access React Fiber
    const rootElement = document.getElementById('root')
    if (!rootElement) {
      console.error('❌ Root element not found!')
      return false
    }

    // Get React Fiber instance
    const fiberKey = Object.keys(rootElement).find(key =>
      key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')
    )

    if (!fiberKey) {
      console.error('❌ React Fiber not found!')
      console.log('⚠️  Make sure you are on the app page and React is loaded!')
      return false
    }

    // Navigate React Fiber tree to find AchievementContext
    let fiber = rootElement[fiberKey]
    let achievementContext = null

    // Search for AchievementContext in the fiber tree
    const searchFiber = (node, depth = 0) => {
      if (depth > 50) return null // Prevent infinite loops

      if (node?.memoizedState?.memoizedState) {
        // Check if this is AchievementProvider by looking for unlockAchievement function
        const context = node.memoizedState.memoizedState
        if (context && typeof context === 'object' && 'unlockAchievement' in context) {
          return context
        }
      }

      // Search children
      if (node?.child) {
        const result = searchFiber(node.child, depth + 1)
        if (result) return result
      }

      // Search siblings
      if (node?.sibling) {
        const result = searchFiber(node.sibling, depth + 1)
        if (result) return result
      }

      return null
    }

    achievementContext = searchFiber(fiber)

    if (achievementContext && achievementContext.unlockAchievement) {
      console.log('✅ Found AchievementContext! Triggering unlock...')
      achievementContext.unlockAchievement(playerName, achievementId)
      return true
    } else {
      console.error('❌ AchievementContext not found in React tree')
      console.log('💡 TIP: Try playing a game first, then run this script')
      return false
    }
  } catch (error) {
    console.error('❌ Error accessing React:', error)
    return false
  }
}

// Wait for React to fully load
setTimeout(() => {
  console.log('🔍 Searching for React Context...\n')

  // Test with single achievement first
  const testAchievement = {
    id: 'hardcore_champion',
    name: 'Hardcore-Champion',
    description: '100+ Punkte in einem Hardcore-Spiel erreicht',
    icon: '🏆',
    unlocked: true,
    unlockedAt: Date.now(),
    target: 100,
    progress: 100
  }

  const success = triggerAchievementUnlock('TestPlayer', 'hardcore_champion', testAchievement)

  if (success) {
    console.log('✅ First animation triggered!\n')
    console.log('🎬 Triggering multiple achievements in sequence...\n')

    // Trigger multiple achievements with delays
    const achievements = [
      {
        id: 'time_traveler',
        name: 'Zeitreisender',
        description: 'Songs aus 5 verschiedenen Dekaden korrekt platziert',
        icon: '🕰️',
        unlocked: true,
        unlockedAt: Date.now(),
        target: 5,
        progress: 5
      },
      {
        id: 'perfectionist',
        name: 'Perfektionist',
        description: 'Alle Songs in einem Spiel richtig einsortiert',
        icon: '⭐',
        unlocked: true,
        unlockedAt: Date.now()
      },
      {
        id: 'lightning_fast',
        name: 'Blitzschnell',
        description: 'Ein Spiel in unter 5 Minuten abgeschlossen',
        icon: '⚡',
        unlocked: true,
        unlockedAt: Date.now()
      },
      {
        id: 'comeback_king',
        name: 'Comeback-King',
        description: 'Vom letzten Platz zum Gewinner aufgestiegen',
        icon: '🔥',
        unlocked: true,
        unlockedAt: Date.now()
      }
    ]

    // Trigger all achievements immediately (they will queue automatically)
    achievements.forEach((ach, index) => {
      setTimeout(() => {
        triggerAchievementUnlock('TestPlayer', ach.id, ach)
      }, index * 100) // Small delay to ensure proper queueing
    })

    console.log('🎯 Expected timeline:')
    console.log('  0s: HARDCORE_CHAMPION (3s animation)')
    console.log('  4s: TIME_TRAVELER (1s pause + 3s animation)')
    console.log('  8s: PERFECTIONIST (1s pause + 3s animation)')
    console.log(' 12s: LIGHTNING_FAST (1s pause + 3s animation)')
    console.log(' 16s: COMEBACK_KING (1s pause + 3s animation)')
    console.log(' Total: ~20 seconds\n')

    console.log('👀 Watch the center of the screen for animations!')
    console.log('🎉 Each animation should show:')
    console.log('   - Slide-in from top')
    console.log('   - Confetti burst')
    console.log('   - 3 seconds display')
    console.log('   - Fade-out')
    console.log('   - 1 second pause before next')
  } else {
    console.log('\n❌ Failed to access React Context\n')
    console.log('🔧 ALTERNATIVE METHOD:')
    console.log('   1. Start a Hardcore game')
    console.log('   2. Navigate to /game page')
    console.log('   3. Run this script again')
    console.log('   4. OR: Play game to end naturally\n')

    console.log('💡 EASIEST METHOD:')
    console.log('   Just play a quick Hardcore game and skip through!')
    console.log('   Achievements will trigger at game end automatically.')
  }

}, 1000)
