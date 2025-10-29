import { useEffect } from 'react'
import { AppProviders, useAuth, useGame, useUI, useBeatSync } from '@/contexts'
import './styles/tailwind.css'
import './styles/beatAnimations.css'

function AppContent() {
  const auth = useAuth()
  const game = useGame()
  const ui = useUI()
  const beatSync = useBeatSync()

  useEffect(() => {
    console.log('✅ React + TypeScript App geladen')
    console.log('✅ Auth Context:', auth.isLoggedIn ? 'Logged In' : 'Not Logged In')
    console.log('✅ Game Context:', game.players.length, 'players')
    console.log('✅ UI Context:', 'Ready')
    console.log('✅ BeatSync Context:', beatSync.enabled ? 'Enabled' : 'Disabled')
  }, [])

  return (
    <div id="app" className="min-h-screen bg-gray-900 text-white">
      <div className="container-padding start-screen">
        <div className="card">
          <h1 className="text-4xl font-bold mb-4">🎵 mxster</h1>
          <p className="text-xl mb-6">React + TypeScript Migration</p>
          <div className="space-y-4">
            <p className="text-green-400">✅ React erfolgreich geladen</p>
            <p className="text-green-400">✅ TypeScript aktiv</p>
            <p className="text-green-400">✅ Tailwind CSS funktioniert</p>
            <p className="text-green-400">✅ Context API: 4 Contexts aktiv</p>
            <div className="mt-4 p-4 bg-gray-800 rounded">
              <p className="text-sm text-gray-400">Auth: {auth.isLoading ? 'Loading...' : auth.isLoggedIn ? '🟢 Logged In' : '🔴 Not Logged In'}</p>
              <p className="text-sm text-gray-400">Game Mode: {game.gameMode || 'Not selected'}</p>
              <p className="text-sm text-gray-400">Players: {game.players.length}</p>
              <p className="text-sm text-gray-400">Beat Sync: {beatSync.enabled ? '🟢 On' : '🔴 Off'}</p>
            </div>
            <p className="text-yellow-400 mt-6">
              Phase 3 abgeschlossen! Context & State Management implementiert.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  )
}

export default App
