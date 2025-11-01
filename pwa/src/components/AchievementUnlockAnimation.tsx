/**
 * Achievement Unlock Animation Component
 * Shows a 3-second celebration animation when an achievement is unlocked
 * Includes confetti, achievement icon, and player name
 */

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import confetti from 'canvas-confetti'
import { useAchievementNotifications } from '@/contexts/AchievementNotificationContext'

export function AchievementUnlockAnimation() {
  const { currentNotification, removeCurrentNotification } = useAchievementNotifications()

  // Trigger confetti on mount
  useEffect(() => {
    if (!currentNotification) return

    // Initial confetti burst
    const triggerConfetti = () => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#f97316', '#22d3ee', '#fbbf24', '#a855f7']
      })

      // Multiple bursts for 2 seconds
      const duration = 2000
      const end = Date.now() + duration

      const frame = () => {
        if (Date.now() > end) return

        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ['#6366f1', '#f97316', '#22d3ee']
        })
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ['#6366f1', '#f97316', '#22d3ee']
        })

        requestAnimationFrame(frame)
      }

      frame()
    }

    // Delay confetti slightly after animation starts
    setTimeout(triggerConfetti, 300)

    // Auto-remove after 3 seconds
    const timer = setTimeout(() => {
      removeCurrentNotification()
    }, 3000)

    return () => clearTimeout(timer)
  }, [currentNotification, removeCurrentNotification])

  if (!currentNotification) return null

  const { playerName, achievement } = currentNotification

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
      role="alert"
      aria-live="assertive"
    >
      <div
        className="glass border-4 border-accent rounded-2xl p-8 shadow-glow-accent
                    animate-achievement-unlock pointer-events-auto max-w-md mx-4"
      >
        <div className="text-center">
          {/* Achievement Icon with bounce animation */}
          <div className="text-8xl mb-4 animate-bounce-once">{achievement.icon}</div>

          {/* Player Name */}
          <div className="text-sm text-secondary font-semibold mb-2 uppercase tracking-wider">
            {playerName}
          </div>

          {/* Achievement Unlocked Title */}
          <div className="text-2xl font-bold text-gradient mb-3">Achievement Freigeschaltet!</div>

          {/* Achievement Name */}
          <div className="text-xl font-bold text-white mb-2">{achievement.name}</div>

          {/* Achievement Description */}
          <div className="text-sm text-text-secondary">{achievement.description}</div>
        </div>
      </div>
    </div>,
    document.body
  )
}
