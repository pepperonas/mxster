/**
 * DEBUG: Check localStorage vs React State
 */

console.log('🔍 DEBUGGING ACHIEVEMENT STATE\n')
console.log('='.repeat(60))

// Check localStorage
console.log('\n1️⃣ LOCALSTORAGE DATA:')
console.log('='.repeat(60))

const storedAchievements = localStorage.getItem('mxster_achievements')
const storedSettings = localStorage.getItem('mxster_settings')

if (storedSettings) {
  const settings = JSON.parse(storedSettings)
  console.log('✅ Settings found:')
  console.log('   savedPlayers:', settings.savedPlayers)
} else {
  console.log('❌ No settings')
}

if (storedAchievements) {
  const achievements = JSON.parse(storedAchievements)
  console.log('\n✅ Achievements found:')
  console.log('   Players:', Object.keys(achievements))
  
  if (achievements.m) {
    const unlocked = achievements.m.achievements.filter(a => a.unlocked).length
    const locked = achievements.m.achievements.filter(a => !a.unlocked).length
    
    console.log('\n   Player "m" in localStorage:')
    console.log('   - Total:', achievements.m.achievements.length)
    console.log('   - Unlocked:', unlocked)
    console.log('   - Locked:', locked)
    
    console.log('\n   Individual achievements in localStorage:')
    achievements.m.achievements.forEach((a, i) => {
      const status = a.unlocked ? '✅ UNLOCKED' : '🔒 LOCKED'
      console.log(`   ${i+1}. ${a.icon} ${a.name}: ${status}`)
    })
  }
} else {
  console.log('❌ No achievements in localStorage')
}

// Check React DevTools (if available)
console.log('\n\n2️⃣ REACT STATE CHECK:')
console.log('='.repeat(60))
console.log('Open React DevTools and check:')
console.log('1. Find <AchievementProvider> in component tree')
console.log('2. Check "playerAchievements" Map in hooks')
console.log('3. Expand Map -> "m" -> achievements array')
console.log('4. Verify unlocked property values')

console.log('\n\n3️⃣ CONSOLE LOGS TO WATCH:')
console.log('='.repeat(60))
console.log('After page reload, watch for these console messages:')
console.log('• "🎮 Auto-initialized achievements for player: m"')
console.log('  → BAD: Means player was recreated with locked achievements')
console.log('• "✅ Player m already exists with X unlocked achievements"')
console.log('  → GOOD: Means player data was preserved')

console.log('\n\n💡 NEXT STEPS:')
console.log('='.repeat(60))
console.log('1. Run the unlock script')
console.log('2. Before reload, run this debug script')
console.log('3. After reload, check console for the messages above')
console.log('4. If you see "Auto-initialized", the timing is wrong')
