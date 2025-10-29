import { useEffect } from 'react'
import { AppProviders, useAuth, useGame, useUI, useBeatSync } from '@/contexts'
import { Modal, Toast, ActionBar, Sidebar, BeatBackground } from '@/components'
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

  // Demo: Test Modal
  const showDemoModal = () => {
    ui.showModal(
      'Demo Modal',
      <div>
        <p>Dies ist ein Test-Modal mit React Portal!</p>
        <p className="mt-2 text-gray-400">✅ Modal Component funktioniert</p>
      </div>,
      [
        { label: 'Abbrechen', variant: 'secondary', onClick: () => console.log('Cancelled') },
        { label: 'OK', variant: 'primary', onClick: () => console.log('Confirmed') }
      ]
    )
  }

  // Demo: Test Toast
  const showDemoToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: '✅ Erfolgreich!',
      error: '❌ Fehler aufgetreten',
      warning: '⚠️ Warnung',
      info: 'ℹ️ Information'
    }
    ui.addToast(messages[type], type)
  }

  return (
    <>
      {/* Beat-synchronized Background */}
      <BeatBackground />

      {/* Layout Components */}
      <ActionBar />
      <Sidebar />

      {/* Modal & Toast (rendered via Portal) */}
      <Modal />
      <Toast />

      {/* Main Content */}
      <div id="app" className="min-h-screen pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-8 border border-gray-800">
            <h1 className="text-4xl font-bold mb-4">🎵 mxster</h1>
            <p className="text-xl mb-6 text-purple-400">React + TypeScript Migration</p>

            <div className="space-y-6">
              {/* Progress */}
              <div className="space-y-2">
                <p className="text-green-400">✅ React erfolgreich geladen</p>
                <p className="text-green-400">✅ TypeScript aktiv</p>
                <p className="text-green-400">✅ Tailwind CSS funktioniert</p>
                <p className="text-green-400">✅ Context API: 4 Contexts aktiv</p>
                <p className="text-green-400">✅ Custom Hooks implementiert</p>
                <p className="text-green-400">✅ Utility Services konvertiert</p>
                <p className="text-yellow-400 font-semibold">🔨 Phase 6: Basis-Komponenten erstellt!</p>
              </div>

              {/* Context Status */}
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <h3 className="font-semibold mb-2">Context Status:</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-300">
                    Auth: {auth.isLoading ? 'Loading...' : auth.isLoggedIn ? '🟢 Logged In' : '🔴 Not Logged In'}
                  </p>
                  <p className="text-gray-300">Game Mode: {game.gameMode || 'Not selected'}</p>
                  <p className="text-gray-300">Players: {game.players.length}</p>
                  <p className="text-gray-300">Beat Sync: {beatSync.enabled ? '🟢 On' : '🔴 Off'}</p>
                </div>
              </div>

              {/* Demo Buttons */}
              <div className="space-y-4">
                <h3 className="font-semibold">Component Demos:</h3>

                {/* Modal Demo */}
                <div>
                  <button
                    onClick={showDemoModal}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                  >
                    🪟 Modal testen
                  </button>
                </div>

                {/* Toast Demos */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => showDemoToast('success')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
                  >
                    Toast: Success
                  </button>
                  <button
                    onClick={() => showDemoToast('error')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                  >
                    Toast: Error
                  </button>
                  <button
                    onClick={() => showDemoToast('warning')}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors text-sm"
                  >
                    Toast: Warning
                  </button>
                  <button
                    onClick={() => showDemoToast('info')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
                  >
                    Toast: Info
                  </button>
                </div>

                <p className="text-sm text-gray-400 italic">
                  💡 Klicke oben links auf das Menu-Icon, um die Sidebar zu öffnen!
                </p>
              </div>

              {/* Phase Status */}
              <div className="mt-8 p-4 bg-purple-900/30 rounded-lg border border-purple-800/50">
                <p className="text-purple-300 font-semibold">
                  Phase 6 abgeschlossen! Basis-Komponenten implementiert.
                </p>
                <p className="text-sm text-purple-400 mt-2">
                  Nächste Phase: Game Setup Flow (Mode Selection, Player Setup, Routing)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
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
