/**
 * Settings Dialog Component
 * Extracted to ensure proper re-rendering on state changes
 */

import { useState, useRef } from 'react'
import { useSettings, useAchievements } from '@/contexts'
import { useGameHistory } from '@/hooks'
import { useUI } from '@/contexts'

export function SettingsDialog() {
  const { settings, updateSettings, removePlayer } = useSettings()
  const { history, importGames, deleteGame } = useGameHistory()
  const { exportAchievements, importAchievements, playerAchievements } = useAchievements()
  const { addToast, showModal } = useUI()

  const [isDragging, setIsDragging] = useState(false)
  const [playerToDelete, setPlayerToDelete] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Export all data as JSON
  const handleExport = () => {
    try {
      const achievementsData = JSON.parse(exportAchievements())

      const exportData = {
        version: '1.1', // Bumped version to include achievements
        exportedAt: new Date().toISOString(),
        settings,
        history,
        achievements: achievementsData
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)

      const link = document.createElement('a')
      link.href = url
      link.download = `mxster-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      addToast('✅ Daten erfolgreich exportiert', 'success')
      console.log('📦 Export successful:', exportData)
    } catch (error) {
      console.error('❌ Export failed:', error)
      addToast('❌ Export fehlgeschlagen', 'error')
    }
  }

  // Import data from JSON file
  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      const importData = JSON.parse(text)

      // Validate structure
      if (!importData.version || !importData.settings) {
        throw new Error('Ungültiges Dateiformat')
      }

      // Import settings
      if (importData.settings) {
        updateSettings(importData.settings)
        console.log('⚙️ Settings imported:', importData.settings)
      }

      // Import history
      if (importData.history) {
        const historyData = JSON.stringify({ version: '1.0', games: importData.history })
        const result = importGames(historyData, false) // Replace existing history
        console.log('📊 History import result:', result)
      }

      // Import achievements (if available)
      if (importData.achievements) {
        const achievementsStr = JSON.stringify(importData.achievements)
        importAchievements(achievementsStr)
        console.log('🏆 Achievements imported:', importData.achievements)
      }

      addToast('✅ Daten erfolgreich importiert', 'success')
      console.log('📥 Import successful')
    } catch (error) {
      console.error('❌ Import failed:', error)
      addToast('❌ Import fehlgeschlagen: Ungültige Datei', 'error')
    }
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImport(file)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file && file.type === 'application/json') {
      handleImport(file)
    } else {
      addToast('⚠️ Bitte nur JSON-Dateien hochladen', 'warning')
    }
  }

  // Handle complete data deletion with confirmation
  const handleDeleteAllData = () => {
    // Count all data
    const totalPlayers = settings.savedPlayers.length
    const totalGames = history.length
    const totalAchievements = Array.from(playerAchievements.values()).reduce(
      (sum, player) => sum + player.achievements.filter(a => a.unlocked).length,
      0
    )

    showModal(
      '⚠️ Alle Daten löschen?',
      <div className="space-y-4">
        <p className="text-gray-300">
          Möchtest du <strong className="text-red-400">ALLE Daten</strong> unwiderruflich löschen?
        </p>

        {/* Statistics about to be deleted */}
        <div className="glass p-4 border border-blue-500/30 rounded-lg bg-blue-900/10">
          <p className="text-sm font-bold text-blue-300 mb-3">Was wird gelöscht:</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-primary/50 rounded-lg border border-accent/20">
              <div className="text-2xl font-bold text-accent">{totalPlayers}</div>
              <div className="text-xs text-text-secondary">Spieler</div>
            </div>
            <div className="text-center p-3 bg-primary/50 rounded-lg border border-accent/20">
              <div className="text-2xl font-bold text-accent">{totalGames}</div>
              <div className="text-xs text-text-secondary">Spiele</div>
            </div>
            <div className="text-center p-3 bg-primary/50 rounded-lg border border-accent/20">
              <div className="text-2xl font-bold text-accent">{totalAchievements}</div>
              <div className="text-xs text-text-secondary">Achievements</div>
            </div>
            <div className="text-center p-3 bg-primary/50 rounded-lg border border-accent/20">
              <div className="text-2xl font-bold text-accent">✓</div>
              <div className="text-xs text-text-secondary">Einstellungen</div>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="glass p-4 border border-red-500/50 rounded-lg bg-red-900/20">
          <p className="text-sm text-text-secondary leading-relaxed">
            <strong className="text-red-400">⚠️ ACHTUNG:</strong> Diese Aktion kann <strong>nicht rückgängig</strong> gemacht werden!
            Alle Spieler, Spielhistorie, Achievements und Einstellungen werden <strong>permanent gelöscht</strong>.
            Die App wird auf den Auslieferungszustand zurückgesetzt.
          </p>
        </div>

        {/* Extra confirmation */}
        <div className="glass p-3 border border-yellow-500/30 rounded-lg bg-yellow-900/10">
          <p className="text-sm text-yellow-300">
            💡 <strong>Tipp:</strong> Erstelle vorher ein Backup über "Sichern & Wiederherstellen", wenn du deine Daten behalten möchtest!
          </p>
        </div>
      </div>,
      [
        {
          text: 'Abbrechen',
          variant: 'secondary',
          closeOnClick: true,
          onClick: () => {
            console.log('❌ Alle Daten löschen abgebrochen')
          }
        },
        {
          text: 'Alles unwiderruflich löschen',
          variant: 'danger',
          closeOnClick: true,
          onClick: () => {
            console.log('🗑️ Deleting all data...')

            // CRITICAL: Clear localStorage SYNCHRONOUSLY before page reload
            // Do NOT call React state updates (like clearAll()) - they won't persist after reload

            // Method 1: Remove specific keys
            const keysToDelete = [
              'mxster_settings',
              'mxster_achievements',
              'mxster_history',
              'mxster_game_state',
              'spotify_auth_tokens',
              'beat_sync_config',
              'app_settings'
            ]

            keysToDelete.forEach(key => {
              localStorage.removeItem(key)
              console.log(`🗑️ Removed: ${key}`)
            })

            // Method 2: Also clear ALL other mxster/hitster keys (cleanup)
            const allKeys = Object.keys(localStorage)
            allKeys.forEach(key => {
              if (key.includes('mxster') || key.includes('hitster')) {
                localStorage.removeItem(key)
                console.log(`🧹 Cleaned up: ${key}`)
              }
            })

            // Verify localStorage is empty
            const remainingKeys = Object.keys(localStorage).filter(k =>
              k.includes('mxster') || k.includes('hitster')
            )
            console.log('📋 Remaining mxster/hitster keys:', remainingKeys.length)

            console.log('✅ All data deleted from localStorage')

            // IMPORTANT: Hard reload to bypass service worker cache
            // This ensures no cached data is loaded after deletion
            window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now()
          }
        }
      ]
    )
  }

  // Handle player removal confirmation (inline dialog)
  const confirmDeletePlayer = () => {
    if (!playerToDelete) return

    const playerName = playerToDelete

    // 1. Delete from settings (saved players list)
    removePlayer(playerName)
    console.log(`🗑️ Removed player from settings: ${playerName}`)

    // 2. Delete all games from history where player participated
    const gamesToDelete = history.filter(game =>
      game.players.some(p => p.name === playerName)
    )
    gamesToDelete.forEach(game => {
      deleteGame(game.id)
    })
    console.log(`🗑️ Deleted ${gamesToDelete.length} games for player: ${playerName}`)

    // 3. Delete achievements (done via localStorage)
    const achievementsData = JSON.parse(localStorage.getItem('mxster_achievements') || '{}')
    if (achievementsData[playerName]) {
      delete achievementsData[playerName]
      localStorage.setItem('mxster_achievements', JSON.stringify(achievementsData))
      console.log(`🗑️ Deleted achievements for player: ${playerName}`)
    }

    addToast(`✅ Spieler "${playerName}" wurde komplett gelöscht`, 'success')
    console.log(`✅ Player "${playerName}" completely deleted from all systems`)

    // Close confirmation dialog
    setPlayerToDelete(null)
  }

  // Handle player removal with confirmation
  const handleRemovePlayer = (playerName: string) => {
    setPlayerToDelete(playerName)
  }

  // Get data for player to delete (if any)
  const playerGames = playerToDelete
    ? history.filter(game => game.players.some(p => p.name === playerToDelete))
    : []
  const playerAchievementData = playerToDelete ? playerAchievements.get(playerToDelete) : null
  const unlockedCount = playerAchievementData?.achievements.filter(a => a.unlocked).length || 0

  return (
    <div className="py-4">
      {/* Inline Confirmation Dialog */}
      {playerToDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative glass rounded-2xl shadow-glow-accent border-2 border-red-500/50 max-w-md w-full mx-4">
            {/* Header */}
            <div className="p-6 border-b border-red-500/30">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🗑️</span>
                <span>Spieler komplett löschen?</span>
              </h3>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-300">
                Möchtest du den Spieler <strong className="text-white">"{playerToDelete}"</strong> wirklich <strong className="text-red-400">komplett löschen</strong>?
              </p>

              {/* Statistics about to be deleted */}
              <div className="glass p-3 border border-blue-500/30 rounded-lg bg-blue-900/10">
                <p className="text-sm font-bold text-blue-300 mb-2">Was wird gelöscht:</p>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>✓ Spieler aus gespeicherter Liste</li>
                  <li>✓ {playerGames.length} Spiele aus der Spielhistorie</li>
                  <li>✓ {unlockedCount} freigeschaltete Achievements</li>
                  <li>✓ Alle Statistiken und Fortschritte</li>
                </ul>
              </div>

              {/* Warning */}
              <div className="glass p-3 border border-red-500/30 rounded-lg bg-red-900/10">
                <p className="text-sm text-text-secondary">
                  <strong className="text-red-400">⚠️ Achtung:</strong> Diese Aktion kann <strong>nicht rückgängig</strong> gemacht werden!
                  Alle Daten dieses Spielers werden <strong>permanent gelöscht</strong>.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 p-6 border-t border-red-500/30">
              <button
                onClick={() => setPlayerToDelete(null)}
                className="px-6 py-2.5 rounded-lg font-medium transition-all btn btn-secondary"
              >
                Abbrechen
              </button>
              <button
                onClick={confirmDeletePlayer}
                className="px-6 py-2.5 rounded-lg font-medium transition-all bg-red-600 hover:bg-red-700 text-white border-2 border-red-500"
              >
                Endgültig löschen
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Random Start Position Setting */}
        <div className="glass p-4 rounded-lg border-2 border-accent/30 hover:border-accent/50 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <span>🎲</span>
                <span className="text-white">Zufällige Startposition</span>
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Songs starten an einer zufälligen Position statt am Anfang.
                Es werden mindestens 60 Sekunden Spielzeit garantiert.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={settings.randomStartPosition}
                onChange={(e) => updateSettings({ randomStartPosition: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
            </label>
          </div>
        </div>

        {/* Hide Years in Timeline Setting */}
        <div className="glass p-4 rounded-lg border-2 border-accent/30 hover:border-accent/50 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <span>🙈</span>
                <span className="text-white">Jahreszahlen verstecken</span>
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Jahreszahlen in der Timeline werden unscharf dargestellt.
                Verhindert Schummeln beim Ablesen der Timeline.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={settings.hideYearsInTimeline}
                onChange={(e) => updateSettings({ hideYearsInTimeline: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
            </label>
          </div>
        </div>

        {/* Player Management Setting */}
        <div className="glass p-4 rounded-lg border-2 border-accent/30">
          <div className="mb-3">
            <h3 className="font-bold flex items-center gap-2">
              <span>👥</span>
              <span className="text-white">Gespeicherte Spieler</span>
            </h3>
            <p className="text-sm text-text-secondary mt-1">
              Verwalte deine gespeicherten Spieler. Diese können in der Spielerauswahl schnell hinzugefügt werden.
            </p>
          </div>

          {settings.savedPlayers.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {settings.savedPlayers.map((playerName, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-primary/50 rounded-lg border border-accent/20 hover:border-accent/40 transition-colors"
                >
                  <span className="text-white font-medium">{playerName}</span>
                  <button
                    onClick={() => handleRemovePlayer(playerName)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400 hover:text-red-300 border border-transparent hover:border-red-500/30"
                    aria-label={`Entfernen: ${playerName}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-secondary">
              <p className="text-sm">Keine gespeicherten Spieler vorhanden.</p>
              <p className="text-xs mt-1">Spieler werden automatisch gespeichert, wenn du sie in der Spielerauswahl eingibst.</p>
            </div>
          )}
        </div>

        {/* Backup & Restore */}
        <div className="glass p-4 rounded-lg border-2 border-accent/30">
          <div className="mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <span>💾</span>
              <span className="text-white">Sichern & Wiederherstellen</span>
            </h3>
            <p className="text-sm text-text-secondary mt-1">
              Exportiere alle Daten (Einstellungen, Spieler, Spielhistorie) als JSON-Datei oder importiere eine Sicherung.
            </p>
          </div>

          {/* Export Button */}
          <div className="mb-4">
            <button
              onClick={handleExport}
              className="w-full btn btn-accent flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Backup erstellen</span>
            </button>
          </div>

          {/* Import Section with Drag & Drop */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer
              ${isDragging
                ? 'border-accent bg-accent/10 scale-[1.02]'
                : 'border-accent/30 hover:border-accent/50 hover:bg-accent/5'
              }
            `}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="space-y-2">
              <div className="text-4xl">📂</div>
              <p className="text-white font-medium">
                {isDragging ? 'Datei hier ablegen...' : 'Backup wiederherstellen'}
              </p>
              <p className="text-sm text-text-secondary">
                Klicken oder JSON-Datei hierher ziehen
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg text-sm">
            <p className="text-blue-300 flex items-start gap-2">
              <span className="text-lg flex-shrink-0">ℹ️</span>
              <span>
                <strong>Hinweis:</strong> Beim Import werden alle aktuellen Einstellungen und Daten überschrieben.
                Erstelle vorher ein Backup, wenn du deine aktuellen Daten behalten möchtest!
              </span>
            </p>
          </div>
        </div>

        {/* Danger Zone: Delete All Data */}
        <div className="glass p-4 rounded-lg border-2 border-red-500/50 bg-red-900/10">
          <div className="mb-4">
            <h3 className="font-bold flex items-center gap-2 text-red-400">
              <span>⚠️</span>
              <span>Gefahrenzone</span>
            </h3>
            <p className="text-sm text-text-secondary mt-1">
              Lösche alle Daten unwiderruflich aus der App.
            </p>
          </div>

          <button
            onClick={handleDeleteAllData}
            className="w-full bg-red-600/20 hover:bg-red-600/30 border-2 border-red-500/50 hover:border-red-500 text-red-300 hover:text-red-200 font-bold py-3 px-4 rounded-lg transition-all"
          >
            🗑️ Alle Daten löschen
          </button>
        </div>

        {/* Future settings can be added here */}
      </div>
    </div>
  )
}
