import { describe, it, expect } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { SettingsProvider } from '../SettingsContext'
import { UIProvider } from '../UIContext'
import { AchievementNotificationProvider } from '../AchievementNotificationContext'
import { AchievementProvider, useAchievements } from '../AchievementContext'
import { AchievementId } from '@/types/achievements'
import { fakeDoc } from '@/test/fakeApi'

const wrapper = ({ children }: { children: ReactNode }) => (
  <SettingsProvider>
    <UIProvider>
      <AchievementNotificationProvider>
        <AchievementProvider>{children}</AchievementProvider>
      </AchievementNotificationProvider>
    </UIProvider>
  </SettingsProvider>
)

describe('AchievementContext', () => {
  it('keeps every change of a burst, for new people too, and stores it on the server', async () => {
    const { result } = renderHook(() => useAchievements(), { wrapper })
    // the document has loaded from the (fake) server
    await waitFor(() => expect(fakeDoc('achievements').version).toBeGreaterThanOrEqual(0))
    await new Promise((r) => setTimeout(r, 20))
    act(() => {
      // what the end of a round does: many calls before the next render
      result.current.updateProgress('Anna', AchievementId.GENRE_HOPPER, 2)
      result.current.updateProgress('Tom', AchievementId.ZEITMASCHINE, 1)
      result.current.unlockAchievement('Anna', AchievementId.LIGHTNING_FAST)
      result.current.applyEffects([{ type: 'add', player: 'Lisa', id: AchievementId.MARATHON_RUNNER, value: 1 }])
    })
    const get = (name: string, id: AchievementId) => result.current.getPlayerAchievements(name).find((a) => a.id === id)!
    await waitFor(() => expect(result.current.getAllPlayerNames().sort()).toEqual(['Anna', 'Lisa', 'Tom']))
    expect(get('Anna', AchievementId.GENRE_HOPPER).progress).toBe(2)
    expect(get('Anna', AchievementId.LIGHTNING_FAST).unlocked).toBe(true)
    expect(get('Tom', AchievementId.ZEITMASCHINE).progress).toBe(1)
    expect(get('Lisa', AchievementId.MARATHON_RUNNER).progress).toBe(1)
    await waitFor(
      () => expect(Object.keys((fakeDoc('achievements').data ?? {}) as object).sort()).toEqual(['Anna', 'Lisa', 'Tom']),
      { timeout: 3000 }
    )
  })
})
