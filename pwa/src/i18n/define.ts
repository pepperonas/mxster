/**
 * Message catalogues: one object per area, German and English side by side.
 *
 *   export const homeText = defineMessages({
 *     de: { title: 'Neues Spiel', greet: (name: string) => `Hallo ${name}` },
 *     en: { title: 'New game', greet: (name: string) => `Hi ${name}` }
 *   })
 *
 * The English half must have exactly the German keys with the same types, so a
 * missing or mistyped translation is a compile error. Values are strings or
 * functions (interpolation, plurals).
 */
import { getLang, type Lang } from './lang'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Message = string | ((...args: any[]) => string)
export type Messages = Record<string, Message>
export type Catalogue<T extends Messages> = Record<Lang, T>

export function defineMessages<T extends Messages>(catalogue: { de: T; en: { [K in keyof T]: T[K] } }): Catalogue<T> {
  return catalogue as Catalogue<T>
}

/** The messages in the current language — for code outside React components. */
export const msg = <T extends Messages>(catalogue: Catalogue<T>): T => catalogue[getLang()]
