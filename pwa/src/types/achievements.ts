import type { IconName } from '@/components/ui/Icon'
import { msg } from '@/i18n/define'
import { achievementText } from '@/i18n/messages/achievements'
/**
 * Achievement System Types
 * Defines all available achievements and tracking structures
 */

export enum AchievementId {
  PERFECT_STREAK = 'perfect_streak',           // 3x hintereinander alle Felder richtig
  PERFECTIONIST = 'perfectionist',             // Alle Songs in einem Spiel richtig einsortiert
  TIME_TRAVELER = 'time_traveler',             // Songs aus 5 Dekaden korrekt platziert
  HARDCORE_CHAMPION = 'hardcore_champion',     // 100+ Punkte in einem Hardcore-Spiel
  MARATHON_RUNNER = 'marathon_runner',         // 50 Spiele gespielt
  UNBEATABLE = 'unbeatable',                   // 5 Spiele in Folge gewonnen
  DECADE_MASTER = 'decade_master',             // 10 Songs einer Dekade perfekt erraten
  LIGHTNING_FAST = 'lightning_fast',           // Spiel in unter 5 Minuten
  COMEBACK_KING = 'comeback_king',             // Aus letztem Platz zum Gewinner
  MUSIC_EXPERT = 'music_expert',               // 1000 Gesamtpunkte über alle Spiele
  // New achievements (10 additional)
  ZEITMASCHINE = 'zeitmaschine',               // Songs aus 3 verschiedenen Dekaden erraten
  GENRE_HOPPER = 'genre_hopper',               // Songs aus 4 verschiedenen Musikrichtungen erraten
  NAME_DROPPER = 'name_dropper',               // 5 Künstler hintereinander richtig erraten
  SOCIAL_BUTTERFLY = 'social_butterfly',       // Mit 5 verschiedenen Spielern gespielt
  PUNKTEJAEGER = 'punktejaeger',               // 75+ Punkte in einem Hardcore-Spiel erreicht
  FLAWLESS_VICTORY = 'flawless_victory',       // Ein Spiel mit 150/150 Punkten gewinnen (SCHWER)
  LEGENDARY_STREAK = 'legendary_streak',       // 10 Spiele in Folge gewonnen (SCHWER)
  CENTURION = 'centurion',                     // 100 Spiele gespielt (SCHWER)
  MASTER_OF_TIME = 'master_of_time',           // Ein Spiel in unter 3 Minuten abgeschlossen (SCHWER)
  COMEBACK_PROFI = 'comeback_profi',           // 5x vom Rückstand zum Sieg gekommen (SCHWER)
  GRAND_MASTER = 'grand_master',               // 5000 Gesamtpunkte über alle Spiele (SCHWER)
  // Bot Achievements (v0.0.38)
  BOT_SLAYER_EASY = 'bot_slayer_easy',         // 3x einfachen Bot besiegt
  BOT_SLAYER_MEDIUM = 'bot_slayer_medium',     // 3x mittleren Bot besiegt
  BOT_SLAYER_HARD = 'bot_slayer_hard',         // 3x schweren Bot besiegt
  // v0.12.6: 26 more, 50 in total
  FIRST_ROUND = 'first_round',
  REGULAR = 'regular',
  FIRST_WIN = 'first_win',
  WINNER_10 = 'winner_10',
  WINNER_25 = 'winner_25',
  NIGHT_OWL = 'night_owl',
  EARLY_BIRD = 'early_bird',
  LONG_ROUND = 'long_round',
  FULL_HOUSE = 'full_house',
  HOT_STREAK = 'hot_streak',
  UNSTOPPABLE = 'unstoppable',
  OBJECTION_WON = 'objection_won',
  STAR_LAWYER = 'star_lawyer',
  OLDIE_EXPERT = 'oldie_expert',
  ZEITGEIST = 'zeitgeist',
  ALL_OVER = 'all_over',
  COLLECTOR = 'collector',
  ARCHIVIST = 'archivist',
  EXACT_YEAR = 'exact_year',
  TITLE_HERO = 'title_hero',
  ARTIST_EXPERT = 'artist_expert',
  FULL_SCORE = 'full_score',
  TEAM_SPIRIT = 'team_spirit',
  DAILY_FIRST = 'daily_first',
  DAILY_PERFECT = 'daily_perfect',
  DAILY_REGULAR = 'daily_regular'
}

export interface Achievement {
  id: AchievementId
  name: string
  description: string
  /** Icon name (components/ui/Icon). */
  icon: IconName
  unlocked: boolean
  unlockedAt?: number  // Timestamp
  progress?: number    // Optional: Fortschritt für wiederholbare Achievements
  target?: number      // Optional: Zielwert für Fortschritts-Achievements
}

export interface PlayerAchievements {
  playerName: string
  achievements: Achievement[]
  stats: {
    totalGames: number
    totalWins: number
    consecutiveWins: number
    totalPoints: number
    perfectStreakCurrent: number  // Aktuelle Serie von Volltreffern
    perfectStreakBest: number     // Beste Serie
  }
}

// Achievement Definitions
type AchievementDefinition = Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'>

/** Name of an achievement in the current language (never from stored data). */
export function achievementName(id: AchievementId): string {
  const t = msg(achievementText) as unknown as Record<string, string>
  return t[`${id}_name`] ?? id
}

/** Description of an achievement in the current language (never from stored data). */
export function achievementDescription(id: AchievementId): string {
  const t = msg(achievementText) as unknown as Record<string, string>
  return t[`${id}_desc`] ?? ''
}

/** Name and description are read at access time, so they follow the language. */
function localized(def: Omit<AchievementDefinition, 'name' | 'description'>): AchievementDefinition {
  return {
    ...def,
    get name() {
      return achievementName(def.id)
    },
    get description() {
      return achievementDescription(def.id)
    }
  }
}

const DEFINITIONS: Record<AchievementId, Omit<AchievementDefinition, 'name' | 'description'>> = {
  [AchievementId.PERFECT_STREAK]: {
    id: AchievementId.PERFECT_STREAK,
    icon: 'target',
    target: 3
  },
  [AchievementId.PERFECTIONIST]: {
    id: AchievementId.PERFECTIONIST,
    icon: 'star'
  },
  [AchievementId.TIME_TRAVELER]: {
    id: AchievementId.TIME_TRAVELER,
    icon: 'history',
    target: 5
  },
  [AchievementId.HARDCORE_CHAMPION]: {
    id: AchievementId.HARDCORE_CHAMPION,
    icon: 'trophy'
    // No target - one-time achievement (just unlock once)
  },
  [AchievementId.MARATHON_RUNNER]: {
    id: AchievementId.MARATHON_RUNNER,
    icon: 'run',
    target: 50
  },
  [AchievementId.UNBEATABLE]: {
    id: AchievementId.UNBEATABLE,
    icon: 'crown',
    target: 5
  },
  [AchievementId.DECADE_MASTER]: {
    id: AchievementId.DECADE_MASTER,
    icon: 'library',
    target: 10
  },
  [AchievementId.LIGHTNING_FAST]: {
    id: AchievementId.LIGHTNING_FAST,
    icon: 'bolt'
  },
  [AchievementId.COMEBACK_KING]: {
    id: AchievementId.COMEBACK_KING,
    icon: 'flame'
  },
  [AchievementId.MUSIC_EXPERT]: {
    id: AchievementId.MUSIC_EXPERT,
    icon: 'school',
    target: 1000
  },
  [AchievementId.ZEITMASCHINE]: {
    id: AchievementId.ZEITMASCHINE,
    icon: 'alarm',
    target: 3
  },
  [AchievementId.GENRE_HOPPER]: {
    id: AchievementId.GENRE_HOPPER,
    icon: 'palette',
    target: 4
  },
  [AchievementId.NAME_DROPPER]: {
    id: AchievementId.NAME_DROPPER,
    icon: 'mic',
    target: 5
  },
  [AchievementId.SOCIAL_BUTTERFLY]: {
    id: AchievementId.SOCIAL_BUTTERFLY,
    icon: 'groups',
    target: 5
  },
  [AchievementId.PUNKTEJAEGER]: {
    id: AchievementId.PUNKTEJAEGER,
    icon: 'medal'
    // No target - one-time achievement (just unlock once)
  },
  [AchievementId.FLAWLESS_VICTORY]: {
    id: AchievementId.FLAWLESS_VICTORY,
    icon: 'diamond'
  },
  [AchievementId.LEGENDARY_STREAK]: {
    id: AchievementId.LEGENDARY_STREAK,
    icon: 'sparkle',
    target: 10
  },
  [AchievementId.CENTURION]: {
    id: AchievementId.CENTURION,
    icon: 'verified',
    target: 100
  },
  [AchievementId.MASTER_OF_TIME]: {
    id: AchievementId.MASTER_OF_TIME,
    icon: 'timer'
  },
  [AchievementId.COMEBACK_PROFI]: {
    id: AchievementId.COMEBACK_PROFI,
    icon: 'trending',
    target: 5
  },
  [AchievementId.GRAND_MASTER]: {
    id: AchievementId.GRAND_MASTER,
    icon: 'premium',
    target: 5000
  },
  [AchievementId.BOT_SLAYER_EASY]: {
    id: AchievementId.BOT_SLAYER_EASY,
    icon: 'bot',
    target: 3
  },
  [AchievementId.BOT_SLAYER_MEDIUM]: {
    id: AchievementId.BOT_SLAYER_MEDIUM,
    icon: 'shield',
    target: 3
  },
  [AchievementId.BOT_SLAYER_HARD]: {
    id: AchievementId.BOT_SLAYER_HARD,
    icon: 'rocket',
    target: 3
  },
  [AchievementId.FIRST_ROUND]: { id: AchievementId.FIRST_ROUND, icon: 'play' },
  [AchievementId.REGULAR]: { id: AchievementId.REGULAR, icon: 'replay', target: 10 },
  [AchievementId.FIRST_WIN]: { id: AchievementId.FIRST_WIN, icon: 'flag' },
  [AchievementId.WINNER_10]: { id: AchievementId.WINNER_10, icon: 'medal', target: 10 },
  [AchievementId.WINNER_25]: { id: AchievementId.WINNER_25, icon: 'trophy', target: 25 },
  [AchievementId.NIGHT_OWL]: { id: AchievementId.NIGHT_OWL, icon: 'moon' },
  [AchievementId.EARLY_BIRD]: { id: AchievementId.EARLY_BIRD, icon: 'sun' },
  [AchievementId.LONG_ROUND]: { id: AchievementId.LONG_ROUND, icon: 'hourglass' },
  [AchievementId.FULL_HOUSE]: { id: AchievementId.FULL_HOUSE, icon: 'share' },
  [AchievementId.HOT_STREAK]: { id: AchievementId.HOT_STREAK, icon: 'check', target: 5 },
  [AchievementId.UNSTOPPABLE]: { id: AchievementId.UNSTOPPABLE, icon: 'insights', target: 10 },
  [AchievementId.OBJECTION_WON]: { id: AchievementId.OBJECTION_WON, icon: 'hand' },
  [AchievementId.STAR_LAWYER]: { id: AchievementId.STAR_LAWYER, icon: 'shield', target: 10 },
  [AchievementId.OLDIE_EXPERT]: { id: AchievementId.OLDIE_EXPERT, icon: 'album', target: 25 },
  [AchievementId.ZEITGEIST]: { id: AchievementId.ZEITGEIST, icon: 'note', target: 25 },
  [AchievementId.ALL_OVER]: { id: AchievementId.ALL_OVER, icon: 'globe', target: 6 },
  [AchievementId.COLLECTOR]: { id: AchievementId.COLLECTOR, icon: 'timeline', target: 100 },
  [AchievementId.ARCHIVIST]: { id: AchievementId.ARCHIVIST, icon: 'library', target: 500 },
  [AchievementId.EXACT_YEAR]: { id: AchievementId.EXACT_YEAR, icon: 'target', target: 10 },
  [AchievementId.TITLE_HERO]: { id: AchievementId.TITLE_HERO, icon: 'edit', target: 25 },
  [AchievementId.ARTIST_EXPERT]: { id: AchievementId.ARTIST_EXPERT, icon: 'person', target: 50 },
  [AchievementId.FULL_SCORE]: { id: AchievementId.FULL_SCORE, icon: 'diamond' },
  [AchievementId.TEAM_SPIRIT]: { id: AchievementId.TEAM_SPIRIT, icon: 'groups' },
  [AchievementId.DAILY_FIRST]: { id: AchievementId.DAILY_FIRST, icon: 'today' },
  [AchievementId.DAILY_PERFECT]: { id: AchievementId.DAILY_PERFECT, icon: 'star' },
  [AchievementId.DAILY_REGULAR]: { id: AchievementId.DAILY_REGULAR, icon: 'flame', target: 7 }
}

export const ACHIEVEMENT_DEFINITIONS = Object.fromEntries(
  Object.entries(DEFINITIONS).map(([id, def]) => [id, localized(def)])
) as Record<AchievementId, AchievementDefinition>

/** The achievement with name and description in the current language. */
export function localizeAchievement<T extends Achievement>(a: T): T {
  return { ...a, name: achievementName(a.id), description: achievementDescription(a.id) }
}

/** Icon of an achievement by id — stored achievements may still carry old emoji. */
export function achievementIcon(id: AchievementId): IconName {
  return ACHIEVEMENT_DEFINITIONS[id]?.icon ?? 'trophy'
}
