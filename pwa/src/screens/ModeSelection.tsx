/**
 * Mode Selection Screen
 * Choose game mode: Guess, Persönliche Timeline, Globale Timeline
 */

import { useNavigate } from 'react-router-dom'
import { useGame } from '@/contexts'
import { GAME_MODE_INFO, GAME_MODES } from '@/utils/gameModes'
import type { GameMode } from '@/types'

export function ModeSelection() {
  const navigate = useNavigate()
  const { setGameMode } = useGame()

  const handleModeSelect = (mode: GameMode) => {
    setGameMode(mode)
    navigate('/variant-selection')
  }

  const modes: GameMode[] = [
    GAME_MODES.GUESS,
    GAME_MODES.TIMELINE_PERSONAL,
    GAME_MODES.TIMELINE_GLOBAL
  ]

  return (
    <div className="min-h-screen pt-28 pb-8 relative z-10">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-gradient mb-4">
            Wähle deinen Spielmodus
          </h1>
          <p className="text-xl text-text-secondary">
            Drei verschiedene Wege, dein Musikwissen zu testen
          </p>
        </div>

        {/* Mode Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {modes.map((mode) => {
            const info = GAME_MODE_INFO[mode]
            return (
              <button
                key={mode}
                onClick={() => handleModeSelect(mode)}
                className="glass rounded-2xl p-8 border-2 border-accent/30 hover:border-accent hover:shadow-glow-accent transition-all text-left group"
              >
                {/* Icon */}
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">
                  {info.icon}
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-gradient">
                  {info.name}
                </h2>

                {/* Description */}
                <p className="text-text-secondary mb-6 leading-relaxed">
                  {info.description}
                </p>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  {info.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-text-secondary">
                      <span className="text-secondary">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Scoring */}
                <div className="pt-4 border-t border-border">
                  <p className="text-sm font-semibold text-secondary">
                    {info.scoring}
                  </p>
                </div>

                {/* Hover Arrow */}
                <div className="mt-6 flex justify-end">
                  <span className="text-secondary group-hover:translate-x-2 transition-transform">
                    →
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Back Button */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/')}
            className="btn btn-secondary"
          >
            ← Zurück
          </button>
        </div>
      </div>
    </div>
  )
}
