import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { challengeCardLayoutId, pendingCardLayoutId } from '../TimelineBoard'

/**
 * A card on its way to the board shares a layoutId with its dock card. With
 * one constant id, the card revealed last turn stayed registered under it and
 * Motion hid it (opacity 0) as soon as the next card was placed — the board
 * looked empty exactly when someone wanted to object.
 */
describe('card layout ids', () => {
  it('are per song', () => {
    expect(pendingCardLayoutId('a')).not.toBe(pendingCardLayoutId('b'))
    expect(challengeCardLayoutId('a')).not.toBe(pendingCardLayoutId('a'))
  })

  it('no board or dock card uses a constant layout id', () => {
    for (const file of ['../TimelineBoard.tsx', '../PlacementDock.tsx']) {
      const src = readFileSync(resolve(__dirname, file), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
      expect(src).not.toMatch(/layoutId=\{?['"`]/)
      expect(src).not.toMatch(/layoutId=\{[A-Z_]+\}/)
    }
  })
})
