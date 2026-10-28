/**
 * Achievement unlock — a celebration card that springs in, holds, and leaves.
 *
 * Sequenced with the rest of the UI: while any dialog is open (e.g. the game
 * end statistics) the queue waits, so the card never covers a decision; it
 * plays as soon as the dialog has gone. Confetti uses the theme colours and
 * respects reduced motion.
 */
import { Icon } from '@/components/ui/Icon'
import { achievementDescription, achievementIcon, achievementName } from '@/types/achievements'
import { useMessages } from '@/i18n'
import { achievementText } from '@/i18n/messages/achievements'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, m } from 'motion/react'
import { useAchievementNotifications } from '@/contexts/AchievementNotificationContext'
import { useUI } from '@/contexts'
import { celebrate } from '@/motion/celebrate'
import { spring } from '@/motion/springs'
import { pointsFor } from '@/game/achievementPoints'

const HOLD_MS = 3000

export function AchievementUnlockAnimation() {
  const { currentNotification, removeCurrentNotification } = useAchievementNotifications()
  const { modal } = useUI()
  const t = useMessages(achievementText)
  const visible = Boolean(currentNotification) && !modal.isOpen

  useEffect(() => {
    if (!visible) return
    let cancelConfetti = () => {}
    const start = window.setTimeout(() => {
      cancelConfetti = celebrate('big', { x: 0.5, y: 0.45 })
    }, 250)
    const timer = window.setTimeout(removeCurrentNotification, HOLD_MS)
    return () => {
      window.clearTimeout(start)
      window.clearTimeout(timer)
      cancelConfetti()
    }
  }, [visible, currentNotification, removeCurrentNotification])

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-24 px-4 pointer-events-none" aria-live="assertive">
      <AnimatePresence>
        {visible && currentNotification && (
          <m.div
            key={`${currentNotification.playerName}-${currentNotification.achievement.id}`}
            role="status"
            initial={{ opacity: 0, y: -48, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.96, transition: spring.effectsDefault }}
            transition={spring.spatialDefault}
            className="pointer-events-auto max-w-sm w-full rounded-m3-xl bg-md-tertiary-container text-md-on-tertiary-container shadow-m3-4 p-6 text-center"
            onClick={removeCurrentNotification}
          >
            <m.div
              className="mb-3 inline-grid place-items-center w-24 h-24 rounded-m3-full bg-md-tertiary-container text-md-on-tertiary-container"
              initial={{ scale: 0.3, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...spring.spatialFast, delay: 0.12 }}
              aria-hidden="true"
            >
              <Icon name={achievementIcon(currentNotification.achievement.id)} size={52} />
            </m.div>
            <p className="text-label-lg uppercase tracking-wider opacity-80">{currentNotification.playerName}</p>
            <p className="text-label-lg mt-1">{t.unlocked}</p>
            <p className="text-headline-sm mt-1">{achievementName(currentNotification.achievement.id)}</p>
            <p className="text-body-md mt-2 opacity-90">{achievementDescription(currentNotification.achievement.id)}</p>
            <m.p
              className="mt-4 inline-block rounded-m3-full bg-md-on-tertiary-container text-md-tertiary-container px-4 py-1 text-title-md tabular"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...spring.spatialFast, delay: 0.45 }}
            >
              {t.plusPoints(pointsFor(currentNotification.achievement.id))}
            </m.p>
          </m.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  )
}
