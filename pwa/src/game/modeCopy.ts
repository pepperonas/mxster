import type { GameMode } from '@/types'
import type { IconName } from '@/components/ui/Icon'
import { msg } from '@/i18n'
import { modesText } from '@/i18n/messages/modes'
import { goalWord } from './roundEnd'

export interface ModeCopy {
  name: string
  short: string
  how: (goal: number) => string
  icon: IconName
}

/**
 * How each mode is named and explained in the UI. The texts are getters, so
 * `MODE_COPY[mode].name` is looked up in the current language on every read.
 */
export const MODE_COPY: Record<GameMode, ModeCopy> = {
  timeline_personal: {
    get name() {
      return msg(modesText).personalName
    },
    get short() {
      return msg(modesText).personalShort
    },
    how: (goal) => msg(modesText).personalHow(goalWord(goal)),
    icon: 'timeline'
  },
  timeline_global: {
    get name() {
      return msg(modesText).globalName
    },
    get short() {
      return msg(modesText).globalShort
    },
    how: (goal) => msg(modesText).globalHow(goalWord(goal)),
    icon: 'globe'
  },
  hardcore: {
    get name() {
      return msg(modesText).hardcoreName
    },
    get short() {
      return msg(modesText).hardcoreShort
    },
    how: (goal) => msg(modesText).hardcoreHow(goalWord(goal)),
    icon: 'flame'
  }
}

export const MODE_ORDER: GameMode[] = ['timeline_personal' as GameMode, 'timeline_global' as GameMode, 'hardcore' as GameMode]

/** Bot difficulty labels (getters: current language on every read). */
export const DIFFICULTY_LABEL = {
  get easy() {
    return msg(modesText).easy
  },
  get medium() {
    return msg(modesText).medium
  },
  get hard() {
    return msg(modesText).hard
  }
} as const
