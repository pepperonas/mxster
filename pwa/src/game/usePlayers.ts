/**
 * Everything the player management needs in one place: who is known, their
 * numbers, and the actions that must touch history, achievements and settings
 * together (a rename that only reached one of them would split a person).
 */
import { useCallback, useMemo } from 'react'
import { useAchievements, useGameHistory, useSettings } from '@/contexts'
import { useMe } from '@/auth/AuthContext'
import { ownPlayerName } from './owner'
import { knownPlayers, summarize, type PlayerSummary } from './stats'

export interface KnownPlayer {
  name: string
  /** The account holder. */
  isMe: boolean
  quickPick: boolean
  summary: PlayerSummary | null
  achievements: number
}

export function usePlayers() {
  const me = useMe()
  const { history, renamePlayer: renameInHistory } = useGameHistory()
  const { settings, addPlayer, removePlayer, renamePlayer: renameInSettings, hidePlayer } = useSettings()
  const { playerAchievements, renamePlayer: renameAchievements, removePlayer: dropAchievements } = useAchievements()
  const myName = ownPlayerName(me.name)

  // Removed people drop out of the numbers (also as team members); the rounds stay
  const summaries = useMemo(() => summarize(history, settings.hiddenPlayers), [history, settings.hiddenPlayers])

  const players: KnownPlayer[] = useMemo(() => {
    const names = knownPlayers(history, [myName, ...settings.savedPlayers], settings.hiddenPlayers)
    const byName = new Map(summaries.map((s) => [s.name, s]))
    return names
      .map((name) => ({
        name,
        isMe: name === myName,
        quickPick: settings.savedPlayers.includes(name),
        summary: byName.get(name) ?? null,
        achievements: playerAchievements.get(name)?.achievements.filter((a) => a.unlocked).length ?? 0
      }))
      .sort(
        (a, b) => Number(b.isMe) - Number(a.isMe) || (b.summary?.games ?? 0) - (a.summary?.games ?? 0) || a.name.localeCompare(b.name, 'de')
      )
  }, [history, myName, settings.savedPlayers, settings.hiddenPlayers, summaries, playerAchievements])

  const rename = useCallback(
    (from: string, to: string) => {
      const name = to.trim()
      if (!name || name === from) return
      renameInHistory(from, name)
      renameAchievements(from, name)
      renameInSettings(from, name)
    },
    [renameInHistory, renameAchievements, renameInSettings]
  )

  const remove = useCallback(
    (name: string) => {
      dropAchievements(name)
      hidePlayer(name)
    },
    [dropAchievements, hidePlayer]
  )

  const setQuickPick = useCallback((name: string, on: boolean) => (on ? addPlayer(name) : removePlayer(name)), [addPlayer, removePlayer])

  return {
    players,
    summaries,
    history,
    myName,
    rename,
    remove,
    add: addPlayer,
    setQuickPick
  }
}
