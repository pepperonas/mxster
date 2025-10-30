/**
 * Settings Dialog Component
 * Extracted to ensure proper re-rendering on state changes
 */

import { useSettings } from '@/contexts'

export function SettingsDialog() {
  const { settings, updateSettings } = useSettings()

  return (
    <div className="py-4">
      <div className="space-y-6">
        {/* Random Start Position Setting */}
        <div className="glass p-4 rounded-lg border-2 border-accent/30 hover:border-accent/50 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <span>🎲</span>
                <span className="text-gradient">Zufällige Startposition</span>
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

        {/* Future settings can be added here */}
      </div>
    </div>
  )
}
