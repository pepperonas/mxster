/**
 * Achievements Dialog Component
 * Displays player-specific achievements with locked/unlocked states
 * Locked achievements shown with dramatic black mask effect
 */

import { useAchievements } from '@/contexts/AchievementContext'
import { useSettings } from '@/contexts/SettingsContext'
import { useState, useEffect } from 'react'

interface AchievementsDialogProps {
  isOpen: boolean
  onClose: () => void
  playerName?: string // Optional: pre-select a player
}

export function AchievementsDialog({ isOpen, onClose, playerName }: AchievementsDialogProps) {
  const { playerAchievements, getAllPlayerNames } = useAchievements()
  const { settings } = useSettings()
  const [selectedPlayer, setSelectedPlayer] = useState<string>('')

  // Initialize selected player when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (playerName) {
        setSelectedPlayer(playerName)
      } else {
        const allPlayers = getAllPlayerNames()
        if (allPlayers.length > 0) {
          setSelectedPlayer(allPlayers[0])
        } else if (settings.savedPlayers.length > 0) {
          setSelectedPlayer(settings.savedPlayers[0])
        }
      }
    }
  }, [isOpen, playerName, getAllPlayerNames, settings.savedPlayers])

  if (!isOpen) return null

  // Get all available players (from achievements + saved players)
  const allPlayerNames = Array.from(
    new Set([...getAllPlayerNames(), ...settings.savedPlayers])
  ).sort()

  // No players exist yet - show onboarding
  if (allPlayerNames.length === 0) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center pt-20 pb-6 px-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-md-scrim/60 backdrop-blur-sm"
          style={{ animation: 'm3-scrim-in var(--m3-dur-effects-slow) var(--m3-ease-effects-slow) both' }}
          onClick={onClose}
        />

        {/* Onboarding Card */}
        <div className="relative m3-dialog-panel max-w-md w-full overflow-hidden">
          <div className="p-5 sm:p-8 text-center">
            <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">🎮</div>
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-3 sm:mb-4">Noch keine Spieler</h2>
            <p className="text-text-secondary mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
              Starte dein erstes Spiel, um Achievements freizuschalten!
              <br />
              <br />
              Achievements werden automatisch für jeden Spieler getrackt, sobald du ein Spiel
              startest.
            </p>
            <button onClick={onClose} className="btn btn-accent w-full">
              Verstanden
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Get achievements for selected player
  const achievements = playerAchievements.get(selectedPlayer)?.achievements || []

  // Sort: unlocked first, then by unlock date, locked at the end
  const sortedAchievements = [...achievements].sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1
    if (!a.unlocked && b.unlocked) return 1
    if (a.unlockedAt && b.unlockedAt) return b.unlockedAt - a.unlockedAt
    return 0
  })

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const totalCount = achievements.length

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pt-20 pb-6 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-md-scrim/60 backdrop-blur-sm"
        style={{ animation: 'm3-scrim-in var(--m3-dur-effects-slow) var(--m3-ease-effects-slow) both' }}
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative m3-dialog-panel max-w-4xl w-full max-h-[calc(100vh-12rem)] sm:max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-accent/20 p-4 sm:p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
              🏆 Achievements
            </h2>
            <button
              onClick={onClose}
              className="touch-target rounded-m3-full m3-state-layer transition-colors text-text-secondary hover:text-secondary text-2xl leading-none"
              aria-label="Schließen"
            >
              ✕
            </button>
          </div>

          {/* Player Selector */}
          {allPlayerNames.length > 1 && (
            <div className="mb-4">
              <label className="block text-text-secondary text-sm font-medium mb-2">
                Spieler auswählen:
              </label>
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="w-full px-4 py-3 bg-md-surface-container-highest border border-md-outline-variant rounded-m3-md text-text-primary focus:border-accent focus:outline-none focus:ring-0 transition-colors"
              >
                {allPlayerNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Single Player Name Display */}
          {allPlayerNames.length === 1 && (
            <div className="mb-4">
              <p className="text-lg text-text-primary">
                Spieler: <span className="font-bold text-gradient">{selectedPlayer}</span>
              </p>
            </div>
          )}

          {/* Progress Summary */}
          <div className="glass rounded-m3-md p-4 border border-accent/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary text-sm font-medium">Fortschritt</span>
              <span className="text-text-primary font-bold text-lg">
                {unlockedCount} / {totalCount}
              </span>
            </div>
            <div className="h-3 bg-primary-dark rounded-full overflow-hidden border border-border">
              <div
                className="h-full bg-gradient-to-r from-secondary via-accent to-secondary transition-all duration-500 animate-gradient-x"
                style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              />
            </div>
            {unlockedCount === totalCount && (
              <p className="text-center text-accent text-sm font-bold mt-2 animate-pulse">
                🎉 Alle Achievements freigeschaltet!
              </p>
            )}
          </div>
        </div>

        {/* Achievement Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 stagger-children">
            {sortedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`relative rounded-m3-lg p-4 sm:p-5 border-2 transition-all overflow-hidden ${
                  achievement.unlocked
                    ? 'glass border-accent/30 hover:border-accent hover:shadow-glow-accent'
                    : 'bg-md-surface-container-low border-md-outline-variant/40'
                }`}
              >
                {/* LOCKED OVERLAY - Black Mask Effect */}
                {!achievement.unlocked && (
                  <div className="absolute inset-0 bg-md-scrim/85 z-10 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center">
                      <div className="text-6xl mb-2 opacity-30">🔒</div>
                      <p className="text-text-secondary text-sm font-medium">Noch nicht freigeschaltet</p>
                    </div>
                  </div>
                )}

                {/* Achievement Content (shown blurred behind mask when locked) */}
                <div className={achievement.unlocked ? '' : 'blur-sm'}>
                  {/* Icon and Name */}
                  <div className="flex items-start gap-4 mb-3">
                    <div
                      className={`text-5xl ${
                        achievement.unlocked ? 'animate-bounce-slow' : 'grayscale opacity-50'
                      }`}
                    >
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`text-xl font-bold mb-1 ${
                          achievement.unlocked ? 'text-gradient' : 'text-text-secondary/70'
                        }`}
                      >
                        {achievement.name}
                      </h3>
                      <p
                        className={`text-sm ${
                          achievement.unlocked ? 'text-text-secondary' : 'text-text-secondary/60'
                        }`}
                      >
                        {achievement.description}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar (if applicable) */}
                  {achievement.target !== undefined && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className="text-text-secondary font-medium">Fortschritt</span>
                        <span
                          className={`font-bold ${achievement.unlocked ? 'text-accent' : 'text-text-secondary/70'}`}
                        >
                          {achievement.unlocked ? achievement.target : (achievement.progress || 0)} / {achievement.target}
                        </span>
                      </div>
                      <div className="h-2 bg-primary-dark rounded-full overflow-hidden border border-border">
                        <div
                          className={`h-full transition-all duration-500 ${
                            achievement.unlocked
                              ? 'bg-gradient-to-r from-secondary to-accent'
                              : 'bg-md-surface-container-highest'
                          }`}
                          style={{
                            width: `${
                              achievement.unlocked
                                ? 100
                                : Math.min(((achievement.progress || 0) / achievement.target) * 100, 100)
                            }%`
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Unlock Date */}
                  {achievement.unlocked && achievement.unlockedAt && (
                    <div className="mt-3 pt-3 border-t border-accent/20 text-xs text-text-secondary flex items-center gap-2">
                      <span>🎉</span>
                      <span>
                        Freigeschaltet: {new Date(achievement.unlockedAt).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-accent/20 p-4 sm:p-6">
          <button onClick={onClose} className="btn btn-accent w-full text-lg font-bold">
            Schließen
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(251, 191, 36, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 191, 36, 0.7);
        }
      `}</style>
    </div>
  )
}
