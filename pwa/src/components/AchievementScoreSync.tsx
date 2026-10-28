import { useEffect, useRef } from 'react'
import { useAchievements } from '@/contexts/AchievementContext'
import { useMe } from '@/auth/AuthContext'
import { ownPlayerName } from '@/game/owner'
import { totalPoints } from '@/game/achievementPoints'
import { useSyncMode } from '@/sync/syncMode'
import { api } from '@/api/client'

/**
 * Tells the server the account holder's achievement points (total and count),
 * so friends can compare on the achievements page. Only the account holder —
 * the other people on this account have no account of their own. Once the
 * achievements have loaded, then on every change, debounced. Never for guests.
 */
export function AchievementScoreSync() {
  const guest = useSyncMode() === 'guest'
  return guest ? null : <Sync />
}

function Sync() {
  const me = useMe()
  const { getPlayerAchievements, ready } = useAchievements()
  const sent = useRef<string | null>(null)
  const own = getPlayerAchievements(ownPlayerName(me.name))
  const points = totalPoints(own)
  const unlocked = new Set(own.filter((a) => a.unlocked).map((a) => a.id)).size

  useEffect(() => {
    if (!ready) return
    const key = `${points}/${unlocked}`
    if (sent.current === key) return
    const timer = window.setTimeout(() => {
      api('/api/achievements/score', { method: 'PUT', json: { points, unlocked } })
        .then(() => {
          sent.current = key
        })
        .catch(() => {
          /* next change or next visit tries again */
        })
    }, 1500)
    return () => window.clearTimeout(timer)
  }, [ready, points, unlocked])

  return null
}
