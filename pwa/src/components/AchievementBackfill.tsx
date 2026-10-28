import { useEffect, useRef } from 'react'
import { useAchievements } from '@/contexts/AchievementContext'
import { useGameHistory } from '@/contexts/GameHistoryContext'
import { useSettings } from '@/contexts/SettingsContext'
import { backfillAchievements } from '@/game/achievementRules'
import { songById } from '@/data/catalogue'

/**
 * Once per visit, after rounds and achievements have loaded: credit what the
 * stored rounds earn. Achievements were only evaluated in hardcore before
 * v0.12.3; this catches the other rounds up. Silent — no flood of unlock cards.
 */
export function AchievementBackfill() {
  const { history, ready: historyReady } = useGameHistory()
  const { applyEffects, ready } = useAchievements()
  const { settings } = useSettings()
  const done = useRef(false)

  useEffect(() => {
    if (done.current || !historyReady || !ready) return
    done.current = true
    applyEffects(
      backfillAchievements(history ?? [], (id) => songById(id)?.genre, settings.hiddenPlayers ?? []),
      { silent: true }
    )
  }, [historyReady, ready, history, applyEffects, settings.hiddenPlayers])

  return null
}
