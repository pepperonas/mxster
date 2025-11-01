/**
 * DEBUG: Check all localStorage keys
 * Shows all keys and their data sizes
 */

console.log('🔍 DEBUGGING LOCALSTORAGE\n')
console.log('='.repeat(60))

// Get all keys
const allKeys = Object.keys(localStorage)
console.log(`\n📦 Total keys in localStorage: ${allKeys.length}`)

if (allKeys.length === 0) {
  console.log('⚠️ localStorage is empty!')
} else {
  console.log('\n📋 All keys:')
  allKeys.forEach(key => {
    const value = localStorage.getItem(key)
    const size = value ? value.length : 0
    const sizeKB = (size / 1024).toFixed(2)

    console.log(`\n  Key: "${key}"`)
    console.log(`  Size: ${sizeKB} KB (${size} chars)`)

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        console.log(`  Type: Array with ${parsed.length} items`)
        if (parsed.length > 0) {
          console.log(`  First item:`, parsed[0])
        }
      } else if (typeof parsed === 'object') {
        console.log(`  Type: Object with keys:`, Object.keys(parsed))
      }
    } catch (e) {
      console.log(`  Type: String (not JSON)`)
    }
  })
}

// Check specific keys we need
console.log('\n\n🎯 CHECKING EXPECTED KEYS:')
console.log('='.repeat(60))

const expectedKeys = [
  'mxster_settings',
  'mxster_achievements',
  'mxster_history',
  'mxster_game_state',
  'spotify_auth_tokens'
]

expectedKeys.forEach(key => {
  const exists = localStorage.getItem(key) !== null
  console.log(`  ${exists ? '✅' : '❌'} ${key}`)

  if (exists) {
    const value = localStorage.getItem(key)
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        console.log(`      → Array with ${parsed.length} items`)
      } else if (typeof parsed === 'object') {
        console.log(`      → Object:`, Object.keys(parsed))
      }
    } catch (e) {
      console.log(`      → String`)
    }
  }
})

console.log('\n✅ Debug complete!')
