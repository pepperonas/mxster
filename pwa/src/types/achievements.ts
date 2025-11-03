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
  SPEED_DEMON = 'speed_demon',                 // 3 Songs hintereinander in unter 10s geraten
  YEAR_PERFECTIONIST = 'year_perfectionist',   // 5 Songs in einem Spiel auf das exakte Jahr geraten
  DIVERSE_TASTE = 'diverse_taste',             // Songs aus allen verfügbaren Dekaden platzieren
  SOCIAL_BUTTERFLY = 'social_butterfly',       // Mit 5 verschiedenen Spielern gespielt
  ARTIST_EXPERT = 'artist_expert',             // 10 Künstler in einem Spiel richtig erraten
  FLAWLESS_VICTORY = 'flawless_victory',       // Ein Spiel mit 150/150 Punkten gewinnen (SCHWER)
  LEGENDARY_STREAK = 'legendary_streak',       // 10 Spiele in Folge gewonnen (SCHWER)
  CENTURION = 'centurion',                     // 100 Spiele gespielt (SCHWER)
  MASTER_OF_TIME = 'master_of_time',           // Ein Spiel in unter 3 Minuten abgeschlossen (SCHWER)
  GRAND_MASTER = 'grand_master'                // 5000 Gesamtpunkte über alle Spiele (SCHWER)
}

export interface Achievement {
  id: AchievementId
  name: string
  description: string
  icon: string
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
    icon: '🎯',
    target: 3
  },
  [AchievementId.PERFECTIONIST]: {
    id: AchievementId.PERFECTIONIST,
    name: 'Perfektionist',
    description: 'Alle Songs in einem Spiel richtig einsortiert',
    icon: '⭐'
  },
  [AchievementId.TIME_TRAVELER]: {
    id: AchievementId.TIME_TRAVELER,
    name: 'Zeitreisender',
    description: 'Songs aus 5 verschiedenen Dekaden korrekt platziert',
    icon: '🕰️',
    target: 5
  },
  [AchievementId.HARDCORE_CHAMPION]: {
    id: AchievementId.HARDCORE_CHAMPION,
    name: 'Hardcore-Champion',
    description: '100+ Punkte in einem Hardcore-Spiel erreicht',
    icon: '🏆',
    target: 100
  },
  [AchievementId.MARATHON_RUNNER]: {
    id: AchievementId.MARATHON_RUNNER,
    name: 'Marathonläufer',
    description: '50 Spiele gespielt',
    icon: '🏃',
    target: 50
  },
  [AchievementId.UNBEATABLE]: {
    id: AchievementId.UNBEATABLE,
    name: 'Unbesiegbar',
    description: '5 Spiele in Folge gewonnen',
    icon: '👑',
    target: 5
  },
  [AchievementId.DECADE_MASTER]: {
    id: AchievementId.DECADE_MASTER,
    name: 'Dekaden-Kenner',
    description: '10 Songs einer Dekade perfekt erraten',
    icon: '🎸',
    target: 10
  },
  [AchievementId.LIGHTNING_FAST]: {
    id: AchievementId.LIGHTNING_FAST,
    name: 'Blitzschnell',
    description: 'Ein Spiel in unter 5 Minuten abgeschlossen',
    icon: '⚡'
  },
  [AchievementId.COMEBACK_KING]: {
    id: AchievementId.COMEBACK_KING,
    name: 'Comeback-King',
    description: 'Vom letzten Platz zum Gewinner aufgestiegen',
    icon: '🔥'
  },
  [AchievementId.MUSIC_EXPERT]: {
    id: AchievementId.MUSIC_EXPERT,
    name: 'Musikexperte',
    description: '1000 Gesamtpunkte über alle Spiele erreicht',
    icon: '🎓',
    target: 1000
  },
  [AchievementId.SPEED_DEMON]: {
    id: AchievementId.SPEED_DEMON,
    name: 'Geschwindigkeitsrausch',
    description: '3 Songs hintereinander in unter 10 Sekunden geraten',
    icon: '⚡🔥',
    target: 3
  },
  [AchievementId.YEAR_PERFECTIONIST]: {
    id: AchievementId.YEAR_PERFECTIONIST,
    name: 'Jahres-Genie',
    description: '5 Songs in einem Spiel auf das exakte Jahr geraten',
    icon: '📅',
    target: 5
  },
  [AchievementId.DIVERSE_TASTE]: {
    id: AchievementId.DIVERSE_TASTE,
    name: 'Vielseitiger Musikgeschmack',
    description: 'In einem Spiel Songs aus allen verfügbaren Dekaden platzieren',
    icon: '🎵'
  },
  [AchievementId.SOCIAL_BUTTERFLY]: {
    id: AchievementId.SOCIAL_BUTTERFLY,
    name: 'Gesellschaftsmensch',
    description: 'Mit 5 verschiedenen Spielern gespielt',
    icon: '👥',
    target: 5
  },
  [AchievementId.ARTIST_EXPERT]: {
    id: AchievementId.ARTIST_EXPERT,
    name: 'Künstler-Kenner',
    description: '10 Künstler in einem Spiel richtig erraten',
    icon: '🎤',
    target: 10
  },
  [AchievementId.FLAWLESS_VICTORY]: {
    id: AchievementId.FLAWLESS_VICTORY,
    name: 'Makellos',
    description: 'Ein Spiel mit 150/150 Punkten gewinnen',
    icon: '💎'
  },
  [AchievementId.LEGENDARY_STREAK]: {
    id: AchievementId.LEGENDARY_STREAK,
    name: 'Legendäre Serie',
    description: '10 Spiele in Folge gewonnen',
    icon: '🌟',
    target: 10
  },
  [AchievementId.CENTURION]: {
    id: AchievementId.CENTURION,
    name: 'Zenturio',
    description: '100 Spiele gespielt',
    icon: '💯',
    target: 100
  },
  [AchievementId.MASTER_OF_TIME]: {
    id: AchievementId.MASTER_OF_TIME,
    name: 'Meister der Zeit',
    description: 'Ein Spiel in unter 3 Minuten abgeschlossen',
    icon: '⏱️'
  },
  [AchievementId.GRAND_MASTER]: {
    id: AchievementId.GRAND_MASTER,
    name: 'Großmeister',
    description: '5000 Gesamtpunkte über alle Spiele erreicht',
    icon: '👑💎',
    target: 5000
  }
}
