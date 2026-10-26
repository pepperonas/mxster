import type { GameMode } from '@/types'
import type { IconName } from '@/components/ui/Icon'

/** How each mode is named and explained in the UI. */
export const MODE_COPY: Record<GameMode, { name: string; short: string; how: string; icon: IconName }> = {
  timeline_personal: {
    name: 'Eigene Zeitleiste',
    short: 'Jede:r baut eine eigene Zeitleiste.',
    how: 'Leg jeden Song an die richtige Stelle deiner Zeitleiste. Wer zuerst zehn Songs richtig liegen hat, gewinnt.',
    icon: 'timeline'
  },
  timeline_global: {
    name: 'Gemeinsame Zeitleiste',
    short: 'Alle legen an dieselbe Zeitleiste.',
    how: 'Alle legen an eine gemeinsame Zeitleiste. Jeder richtige Song zählt für dich, zehn Songs gewinnen.',
    icon: 'globe'
  },
  hardcore: {
    name: 'Hardcore',
    short: 'Titel, Interpret und Jahr raten, bis zu 15 Punkte.',
    how: 'Rate Titel und Interpret (je 5 Punkte) und das Jahr (5 Punkte exakt, 2 bei einem Jahr daneben, 1 bei zwei). Nach zehn Songs gewinnt, wer die meisten Punkte hat.',
    icon: 'flame'
  }
}

export const MODE_ORDER: GameMode[] = ['timeline_personal' as GameMode, 'timeline_global' as GameMode, 'hardcore' as GameMode]

export const DIFFICULTY_LABEL = { easy: 'Leicht', medium: 'Mittel', hard: 'Schwer' } as const
