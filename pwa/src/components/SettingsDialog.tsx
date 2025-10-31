/**
 * Settings Dialog Component
 * Extracted to ensure proper re-rendering on state changes
 */

import { useState, useRef } from 'react'
import { useSettings } from '@/contexts'
import { useGameHistory } from '@/hooks'
import { useUI } from '@/contexts'

export function SettingsDialog() {
  const { settings, updateSettings, removePlayer } = useSettings()
  const { history, importGames } = useGameHistory()
  const { addToast, showModal } = useUI()

  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Export all data as JSON
  const handleExport = () => {
    try {
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        settings,
        history
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

  // Handle player removal with confirmation
  const handleRemovePlayer = (playerName: string) => {
    showModal(
      '🗑️ Spieler löschen?',
      <div className="space-y-4">
        <p className="text-gray-300">
          Möchtest du den Spieler <strong className="text-white">"{playerName}"</strong> wirklich löschen?
        </p>
        <div className="glass p-3 border border-yellow-500/30 rounded-lg bg-yellow-900/10">
          <p className="text-sm text-text-secondary">
            <strong className="text-yellow-400">Hinweis:</strong> Diese Aktion kann nicht rückgängig gemacht werden. Der Spieler wird aus deiner gespeicherten Liste entfernt.
          </p>
        </div>
      </div>,
      [
        {
          label: 'Abbrechen',
          variant: 'secondary',
          onClick: () => {
            console.log(`❌ Spieler löschen abgebrochen: ${playerName}`)
          }
        },
        {
          label: 'Löschen',
          variant: 'danger',
          onClick: () => {
            removePlayer(playerName)
            addToast(`✅ Spieler "${playerName}" wurde gelöscht`, 'success')
            console.log(`🗑️ Spieler gelöscht: ${playerName}`)
          }
        }
      ]
    )
  }

  return (
    <div className="py-4">
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

        {/* Future settings can be added here */}
      </div>
    </div>
  )
}
