/**
 * Achievement Notification Context
 * Manages achievement unlock notifications with sequential animation queue
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { AchievementId, Achievement } from '@/types/achievements'

interface AchievementNotification {
  id: string
  playerName: string
  achievementId: AchievementId
  achievement: Achievement
  timestamp: number
}

interface AchievementNotificationContextType {
  notifications: AchievementNotification[]
  currentNotification: AchievementNotification | null
  queueNotification: (playerName: string, achievementId: AchievementId, achievement: Achievement) => void
  removeCurrentNotification: () => void
}

const AchievementNotificationContext = createContext<AchievementNotificationContextType | undefined>(
  undefined
)

export function AchievementNotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AchievementNotification[]>([])
  const [currentNotification, setCurrentNotification] = useState<AchievementNotification | null>(
    null
  )
  const [isProcessing, setIsProcessing] = useState(false)

  // Queue a new achievement notification
  const queueNotification = useCallback(
    (playerName: string, achievementId: AchievementId, achievement: Achievement) => {
      const notification: AchievementNotification = {
        id: `${playerName}-${achievementId}-${Date.now()}`,
        playerName,
        achievementId,
        achievement,
        timestamp: Date.now()
      }

      console.log('🎉 Queuing achievement notification:', {
        player: playerName,
        achievement: achievement.name
      })

      setNotifications((prev) => [...prev, notification])
    },
    []
  )

  // Remove current notification and trigger next in queue
  const removeCurrentNotification = useCallback(() => {
    console.log('🗑️ Removing current achievement notification')
    setCurrentNotification(null)
    setIsProcessing(false)
  }, [])

  // Process notification queue (sequential with 1s pause)
  const processQueue = useCallback(async () => {
    if (isProcessing || notifications.length === 0) return

    setIsProcessing(true)

    // Get first notification from queue
    const [first, ...rest] = notifications
    setNotifications(rest)
    setCurrentNotification(first)

    console.log('▶️ Processing achievement notification:', {
      player: first.playerName,
      achievement: first.achievement.name,
      remaining: rest.length
    })

    // Animation will auto-remove after 3s
    // Then we wait 1s before processing next
    setTimeout(() => {
      setIsProcessing(false)
    }, 4000) // 3s animation + 1s pause
  }, [notifications, isProcessing])

  // Auto-process queue when notifications change
  useEffect(() => {
    if (!isProcessing && notifications.length > 0 && !currentNotification) {
      processQueue()
    }
  }, [notifications, isProcessing, currentNotification, processQueue])

  return (
    <AchievementNotificationContext.Provider
      value={{
        notifications,
        currentNotification,
        queueNotification,
        removeCurrentNotification
      }}
    >
      {children}
    </AchievementNotificationContext.Provider>
  )
}

export function useAchievementNotifications() {
  const context = useContext(AchievementNotificationContext)
  if (!context) {
    throw new Error(
      'useAchievementNotifications must be used within AchievementNotificationProvider'
    )
  }
  return context
}
