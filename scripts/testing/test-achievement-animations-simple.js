/**
 * SIMPLE ACHIEVEMENT ANIMATION TEST
 * Creates game history that triggers achievements on next game end
 *
 * USAGE - Copy and paste in browser console:
 * http://localhost:5174/
 */

(function() {
  console.log('🎬 ACHIEVEMENT ANIMATION TEST - Simple Method\n')

  // Method 1: Generate game history that will trigger achievements
  console.log('📝 Step 1: Creating game history...')

  const history = {
    games: []
  }

  // Generate 51 games for MARATHON_RUNNER (50 games achievement)
  // Generate wins for UNBEATABLE (5 consecutive wins)
  // Generate high scores for MUSIC_EXPERT (1000 total points)
  const players = ['TestPlayer1', 'TestPlayer2']

  for (let i = 0; i < 51; i++) {
    const isTestPlayer1Win = i < 5 // First 5 games TestPlayer1 wins (for UNBEATABLE)

    const game = {
      timestamp: Date.now() - (51 - i) * 60000, // Spread over time
      mode: 'hardcore',
      variant: 'virtual',
      players: [
        {
          name: 'TestPlayer1',
          score: isTestPlayer1Win ? 150 : 80, // High score for winner
          cards: 10,
          timeline: []
        },
        {
          name: 'TestPlayer2',
          score: isTestPlayer1Win ? 80 : 90,
          cards: 10,
          timeline: []
        }
      ]
    }

    history.games.push(game)
  }

  localStorage.setItem('mxster_history', JSON.stringify(history))
  console.log('✅ Created 51 game history entries')
  console.log('   - TestPlayer1: 5 consecutive wins, 1000+ total points')
  console.log('   - Both players: 51 total games (MARATHON_RUNNER)\n')

  // Method 2: Create settings with test players
  console.log('📝 Step 2: Creating player settings...')
  const settings = {
    randomStartPosition: false,
    hideYearsInTimeline: false,
    savedPlayers: ['TestPlayer1', 'TestPlayer2']
  }
  localStorage.setItem('mxster_settings', JSON.stringify(settings))
  console.log('✅ Settings created\n')

  // Method 3: Instructions for triggering animations
  console.log('🎯 NEXT STEPS TO SEE ANIMATIONS:\n')
  console.log('Option A - Finish a Real Game:')
  console.log('  1. Start a new Hardcore game with TestPlayer1 and TestPlayer2')
  console.log('  2. Play until end (10 cards)')
  console.log('  3. At game end, achievements will be checked')
  console.log('  4. Animations will play for:')
  console.log('     - MARATHON_RUNNER (51 games played)')
  console.log('     - MUSIC_EXPERT (1000+ points)')
  console.log('     - UNBEATABLE (5 consecutive wins for TestPlayer1)')
  console.log('     - Plus any in-game achievements (HARDCORE_CHAMPION, etc.)\n')

  console.log('Option B - Quick Test with Console Hack:')
  console.log('  1. Navigate to /game page')
  console.log('  2. Open React DevTools')
  console.log('  3. Find AchievementContext')
  console.log('  4. Call unlockAchievement() directly\n')

  console.log('Option C - Use Existing Test Script:')
  console.log('  Run: /scripts/testing/unlock-all-achievements.js')
  console.log('  This unlocks all achievements and shows them in the dialog\n')

  console.log('💡 RECOMMENDED: Play a quick game and skip through it!')
  console.log('   The animations will trigger at the END of the game.')

})()
