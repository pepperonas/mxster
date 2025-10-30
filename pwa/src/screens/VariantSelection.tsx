/**
 * Variant Selection Screen
 * Choose game variant: Physical (with QR cards) or Virtual (random songs)
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '@/contexts'
import { GAME_VARIANTS, GAME_VARIANT_INFO } from '@/utils/gameModes'
import type { GameVariant } from '@/types'

export function VariantSelection() {
  const navigate = useNavigate()
  const { gameMode, setGameVariant } = useGame()

  // Redirect if no game mode selected
  useEffect(() => {
    if (!gameMode) {
      navigate('/mode-selection')
    }
  }, [gameMode, navigate])

  const handleVariantSelect = (variant: GameVariant) => {
    setGameVariant(variant)
    navigate('/player-setup')
  }

  // Don't render if no game mode
  if (!gameMode) {
    return null
  }

  const variants: GameVariant[] = [
    GAME_VARIANTS.PHYSICAL,
    GAME_VARIANTS.VIRTUAL
  ]

  return (
    <div className="min-h-screen pt-28 pb-8 relative z-10">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-gradient mb-4">
            Wähle deine Spielvariante
          </h1>
          <p className="text-xl text-text-secondary">
            Mit echten Karten oder komplett digital
          </p>
        </div>

        {/* Variant Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {variants.map((variant) => {
            const info = GAME_VARIANT_INFO[variant]
            return (
              <button
                key={variant}
                onClick={() => handleVariantSelect(variant)}
                className="glass rounded-2xl p-10 border-2 border-accent/30 hover:border-accent hover:shadow-glow-accent transition-all text-left group"
              >
                {/* Icon */}
                <div className="text-7xl mb-6 group-hover:scale-110 transition-transform">
                  {info.icon}
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold mb-4 text-white group-hover:text-gradient">
                  {info.name}
                </h2>

                {/* Description */}
                <p className="text-text-secondary mb-6 leading-relaxed text-lg">
                  {info.description}
                </p>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {info.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-secondary flex-shrink-0">✓</span>
                      <span className="text-text-secondary">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Requirements (if any) */}
                {info.requirements && info.requirements.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-semibold text-yellow-400 mb-2">
                      Benötigt:
                    </p>
                    {info.requirements.map((req, idx) => (
                      <p key={idx} className="text-xs text-text-secondary">
                        • {req}
                      </p>
                    ))}
                  </div>
                )}

                {/* Hover Arrow */}
                <div className="mt-6 flex justify-end">
                  <span className="text-secondary group-hover:translate-x-2 transition-transform text-2xl">
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
            onClick={() => navigate('/mode-selection')}
            className="btn btn-secondary"
          >
            ← Zurück
          </button>
        </div>
      </div>
    </div>
  )
}
