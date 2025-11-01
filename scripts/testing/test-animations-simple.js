/**
 * SUPER SIMPLE ACHIEVEMENT ANIMATION TEST
 * NO page reload, direct animation trigger via Custom Events
 *
 * USAGE:
 * 1. Open http://localhost:5174/ in browser
 * 2. Open browser console (F12)
 * 3. Copy-paste this ENTIRE script
 * 4. Press ENTER
 * 5. Watch animations!
 */

console.log('🎬 ACHIEVEMENT ANIMATION TEST - SUPER SIMPLE VERSION\n')
console.log('⚠️  Make sure you are on http://localhost:5174/\n')

// Helper function to dispatch achievement unlock event
const unlockAchievement = (playerName, achievementId) => {
  const event = new CustomEvent('test-achievement-unlock', {
    detail: { playerName, achievementId }
  })
  window.dispatchEvent(event)
  console.log(`🎯 Triggered: ${achievementId} for ${playerName}`)
}

// Wait a moment for React to load
setTimeout(() => {
  console.log('🎬 Starting animation sequence...\n')

  // TEST 1: Single Achievement (immediate)
  console.log('TEST 1: Single Achievement')
  unlockAchievement('TestPlayer', 'hardcore_champion')

  // TEST 2: Multiple Achievements (after 5 seconds)
  setTimeout(() => {
    console.log('\nTEST 2: Multiple Achievements (Sequential Queue)')
    unlockAchievement('TestPlayer', 'time_traveler')
    unlockAchievement('TestPlayer', 'perfectionist')
    unlockAchievement('TestPlayer', 'lightning_fast')
    unlockAchievement('TestPlayer', 'comeback_king')
  }, 5000)

  // TEST 3: Multiple Players (after 25 seconds)
  setTimeout(() => {
    console.log('\nTEST 3: Multiple Players')
    unlockAchievement('Alice', 'perfect_streak')
    unlockAchievement('Bob', 'decade_master')
    unlockAchievement('Charlie', 'music_expert')
  }, 25000)

  console.log('\n⏱️  Timeline:')
  console.log('  0s: HARDCORE_CHAMPION (3s + 1s pause)')
  console.log('  5s: 4 achievements queued')
  console.log('  5-21s: Sequential animations (4×3s + 3×1s)')
  console.log(' 25s: 3 more achievements (different players)')
  console.log(' 25-37s: Sequential animations (3×3s + 2×1s)')
  console.log('\n👀 Watch the center of the screen!')
  console.log('🎉 You should see:')
  console.log('   ✅ Slide-in animation')
  console.log('   ✅ Confetti burst')
  console.log('   ✅ Player name + achievement')
  console.log('   ✅ 3 second display')
  console.log('   ✅ Fade-out')
  console.log('   ✅ 1 second pause before next')

}, 500)
