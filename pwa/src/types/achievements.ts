import type { IconName } from '@/components/ui/Icon'
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
  BOT_SLAYER_HARD = 'bot_slayer_hard'          // 3x schweren Bot besiegt
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
export const ACHIEVEMENT_DEFINITIONS: Record<AchievementId, Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'>> = {
  [AchievementId.PERFECT_STREAK]: {
    id: AchievementId.PERFECT_STREAK,
    name: 'Volltreffer-Serie',
    description: '3x hintereinander alle Felder richtig erraten',
    icon: 'target',
    target: 3
  },
  [AchievementId.PERFECTIONIST]: {
    id: AchievementId.PERFECTIONIST,
    name: 'Perfektionist',
    description: 'Alle Songs in einem Spiel richtig einsortiert',
    icon: 'star'
  },
  [AchievementId.TIME_TRAVELER]: {
    id: AchievementId.TIME_TRAVELER,
    name: 'Zeitreisender',
    description: 'Songs aus 5 verschiedenen Dekaden korrekt platziert',
    icon: 'history',
    target: 5
  },
  [AchievementId.HARDCORE_CHAMPION]: {
    id: AchievementId.HARDCORE_CHAMPION,
    name: 'Hardcore-Champion',
    description: '100+ Punkte in einem Hardcore-Spiel erreicht',
    icon: 'trophy'
    // No target - one-time achievement (just unlock once)
  },
  [AchievementId.MARATHON_RUNNER]: {
    id: AchievementId.MARATHON_RUNNER,
    name: 'Marathonläufer',
    description: '50 Spiele gespielt',
    icon: 'run',
    target: 50
  },
  [AchievementId.UNBEATABLE]: {
    id: AchievementId.UNBEATABLE,
    name: 'Unbesiegbar',
    description: '5 Spiele in Folge gewonnen',
    icon: 'crown',
    target: 5
  },
  [AchievementId.DECADE_MASTER]: {
    id: AchievementId.DECADE_MASTER,
    name: 'Dekaden-Kenner',
    description: '10 Songs einer Dekade perfekt erraten',
    icon: 'library',
    target: 10
  },
  [AchievementId.LIGHTNING_FAST]: {
    id: AchievementId.LIGHTNING_FAST,
    name: 'Blitzschnell',
    description: 'Ein Spiel in unter 5 Minuten abgeschlossen',
    icon: 'bolt'
  },
  [AchievementId.COMEBACK_KING]: {
    id: AchievementId.COMEBACK_KING,
    name: 'Comeback-King',
    description: 'Vom letzten Platz zum Gewinner aufgestiegen',
    icon: 'flame'
  },
  [AchievementId.MUSIC_EXPERT]: {
    id: AchievementId.MUSIC_EXPERT,
    name: 'Musikexperte',
    description: '1000 Gesamtpunkte über alle Spiele erreicht',
    icon: 'school',
    target: 1000
  },
  [AchievementId.ZEITMASCHINE]: {
    id: AchievementId.ZEITMASCHINE,
    name: 'Zeitmaschine',
    description: 'Songs aus 3 verschiedenen Dekaden erraten',
    icon: 'alarm',
    target: 3
  },
  [AchievementId.GENRE_HOPPER]: {
    id: AchievementId.GENRE_HOPPER,
    name: 'Genre-Hopper',
    description: 'Songs aus 4 verschiedenen Musikrichtungen erraten',
    icon: 'palette',
    target: 4
  },
  [AchievementId.NAME_DROPPER]: {
    id: AchievementId.NAME_DROPPER,
    name: 'Name-Dropper',
    description: '5 Künstler hintereinander richtig erraten',
    icon: 'mic',
    target: 5
  },
  [AchievementId.SOCIAL_BUTTERFLY]: {
    id: AchievementId.SOCIAL_BUTTERFLY,
    name: 'Gesellschaftsmensch',
    description: 'Mit 5 verschiedenen Spielern gespielt',
    icon: 'groups',
    target: 5
  },
  [AchievementId.PUNKTEJAEGER]: {
    id: AchievementId.PUNKTEJAEGER,
    name: 'Punktejäger',
    description: '75+ Punkte in einem Hardcore-Spiel erreicht',
    icon: 'medal'
    // No target - one-time achievement (just unlock once)
  },
  [AchievementId.FLAWLESS_VICTORY]: {
    id: AchievementId.FLAWLESS_VICTORY,
    name: 'Makellos',
    description: 'Ein Spiel mit 150/150 Punkten gewinnen',
    icon: 'diamond'
  },
  [AchievementId.LEGENDARY_STREAK]: {
    id: AchievementId.LEGENDARY_STREAK,
    name: 'Legendäre Serie',
    description: '10 Spiele in Folge gewonnen',
    icon: 'sparkle',
    target: 10
  },
  [AchievementId.CENTURION]: {
    id: AchievementId.CENTURION,
    name: 'Zenturio',
    description: '100 Spiele gespielt',
    icon: 'verified',
    target: 100
  },
  [AchievementId.MASTER_OF_TIME]: {
    id: AchievementId.MASTER_OF_TIME,
    name: 'Meister der Zeit',
    description: 'Ein Spiel in unter 3 Minuten abgeschlossen',
    icon: 'timer'
  },
  [AchievementId.COMEBACK_PROFI]: {
    id: AchievementId.COMEBACK_PROFI,
    name: 'Comeback-Profi',
    description: '5x vom Rückstand zum Sieg gekommen',
    icon: 'trending',
    target: 5
  },
  [AchievementId.GRAND_MASTER]: {
    id: AchievementId.GRAND_MASTER,
    name: 'Großmeister',
    description: '5000 Gesamtpunkte über alle Spiele erreicht',
    icon: 'premium',
    target: 5000
  },
  [AchievementId.BOT_SLAYER_EASY]: {
    id: AchievementId.BOT_SLAYER_EASY,
    name: 'Bot-Jäger',
    description: '3x einen einfachen Bot besiegt',
    icon: 'bot',
    target: 3
  },
  [AchievementId.BOT_SLAYER_MEDIUM]: {
    id: AchievementId.BOT_SLAYER_MEDIUM,
    name: 'Bot-Bezwinger',
    description: '3x einen mittleren Bot besiegt',
    icon: 'shield',
    target: 3
  },
  [AchievementId.BOT_SLAYER_HARD]: {
    id: AchievementId.BOT_SLAYER_HARD,
    name: 'Bot-Meister',
    description: '3x einen schweren Bot besiegt',
    icon: 'rocket',
    target: 3
  }
}

/** Icon of an achievement by id — stored achievements may still carry old emoji. */
export function achievementIcon(id: AchievementId): IconName {
  return ACHIEVEMENT_DEFINITIONS[id]?.icon ?? 'trophy'
}
