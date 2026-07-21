/**
 * Variant Selection Screen
 * Choose game variant: Physical (with QR cards) or Virtual (random songs)
 */

import { useEffect } from 'react'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { useGame } from '@/contexts'
import { GAME_VARIANTS, GAME_VARIANT_INFO } from '@/utils/gameModes'
import type { GameVariant } from '@/types'

export function VariantSelection() {
  const navigate = useAppNavigate()
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
    GAME_VARIANTS.VIRTUAL,  // Virtual FIRST (recommended)
    GAME_VARIANTS.PHYSICAL
  ]

  return (
    <div className="min-h-screen pt-28 pb-8 relative z-10">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-display-sm md:text-display-md text-emphasized text-gradient mb-4">
            Wähle deine Spielvariante
          </h1>
          <p className="text-title-lg text-text-secondary">
            Komplett digital oder mit echten Karten
          </p>
        </div>

        {/* Variant Cards */}
        <div className="grid md:grid-cols-2 gap-8 stagger-children">
          {variants.map((variant) => {
            const info = GAME_VARIANT_INFO[variant]
            const isVirtual = variant === GAME_VARIANTS.VIRTUAL
            return (
              <button
                key={variant}
                onClick={() => handleVariantSelect(variant)}
                className={`card card-glow p-10 border-2 text-left group relative ${
                  isVirtual
                    ? 'rounded-m3-xl bg-md-secondary-container hover:bg-md-secondary-container text-md-on-secondary-container border-md-primary'
                    : 'border-transparent hover:border-md-primary/60 active:rounded-m3-xl'
                }`}
              >
                {/* EMPFOHLEN Badge for Virtual Mode */}
                {isVirtual && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-md-tertiary text-md-on-tertiary text-label-sm rounded-m3-full shadow-glow-accent">
                      ⭐ EMPFOHLEN
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className="text-7xl mb-6 group-hover:scale-110 transition-transform">
                  {info.icon}
                </div>

                {/* Title */}
                <h2 className="text-headline-md mb-4 text-text-primary group-hover:text-gradient">
                  {info.name}
                </h2>

                {/* Description */}
                <p className="text-body-lg text-text-secondary mb-6">
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
                    <p className="text-label-lg text-md-tertiary mb-2">
                      Benötigt:
                    </p>
                    {info.requirements.map((req, idx) => (
                      <p key={idx} className="text-body-sm text-text-secondary">
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
