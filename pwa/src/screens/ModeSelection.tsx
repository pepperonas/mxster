/**
 * Mode Selection Screen
 * Choose game mode: Guess, Persönliche Timeline, Globale Timeline
 */

import { useAppNavigate } from '@/hooks/useAppNavigate'
import { useGame } from '@/contexts'
import { GAME_MODE_INFO, GAME_MODES } from '@/utils/gameModes'
import type { GameMode } from '@/types'
import { markSharedElement, TRAIL_MODE } from '@/components/ui/SelectionTrail'

export function ModeSelection() {
  const navigate = useAppNavigate()
  const { setGameMode } = useGame()

  const handleModeSelect = (mode: GameMode, card: HTMLElement) => {
    // The tapped card's icon morphs into the next screen's selection trail
    markSharedElement(card.querySelector('[data-trail-icon]'), TRAIL_MODE)
    setGameMode(mode)
    navigate('/variant-selection')
  }

  const modes: GameMode[] = [
    GAME_MODES.HARDCORE,
    GAME_MODES.TIMELINE_PERSONAL,
    GAME_MODES.TIMELINE_GLOBAL
  ]

  return (
    <div className="min-h-screen pt-28 pb-8 relative z-10">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-display-sm md:text-display-md text-emphasized text-gradient mb-4">
            Wähle deinen Spielmodus
          </h1>
          <p className="text-title-lg text-text-secondary">
            Drei verschiedene Wege, dein Musikwissen zu testen
          </p>
        </div>

        {/* Mode Cards */}
        <div className="grid md:grid-cols-3 gap-6 stagger-children">
          {modes.map((mode) => {
            const info = GAME_MODE_INFO[mode]
            return (
              <button
                key={mode}
                onClick={(e) => handleModeSelect(mode, e.currentTarget)}
                className="card card-glow p-8 border-2 border-transparent hover:border-md-primary/60 active:rounded-m3-xl text-left group"
              >
                {/* Icon */}
                <div className="mb-6">
                  <span
                    data-trail-icon
                    className="inline-block text-6xl group-hover:scale-110 transition-transform duration-m3-spatial-fast ease-m3-spatial-fast"
                  >
                    {info.icon}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-headline-sm mb-3 text-text-primary group-hover:text-gradient">
                  {info.name}
                </h2>

                {/* Description */}
                <p className="text-body-md text-text-secondary mb-6">
                  {info.description}
                </p>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  {info.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-body-sm text-text-secondary">
                      <span className="text-secondary">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Scoring */}
                <div className="pt-4 border-t border-border">
                  <p className="text-label-lg text-secondary">
                    {info.scoring}
                  </p>
                </div>

                {/* Hover Arrow */}
                <div className="mt-6 flex justify-end">
                  <span className="text-secondary group-hover:translate-x-2 transition-transform duration-m3-spatial-fast ease-m3-spatial-fast">
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
