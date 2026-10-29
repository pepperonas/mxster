import { describe, it, expect } from 'vitest'
import { englishPath } from '../legacyPaths'

describe('englishPath', () => {
  it('maps every old top-level address', () => {
    expect(englishPath('/neu')).toBe('/new')
    expect(englishPath('/spiel')).toBe('/game')
    expect(englishPath('/verlauf')).toBe('/history')
    expect(englishPath('/statistik')).toBe('/stats')
    expect(englishPath('/spieler')).toBe('/players')
    expect(englishPath('/erfolge')).toBe('/achievements')
    expect(englishPath('/profil')).toBe('/settings') // the profile became the settings (v0.21.0)
  })

  it('keeps ids, names and room codes', () => {
    expect(englishPath('/verlauf/abc123')).toBe('/history/abc123')
    expect(englishPath('/spieler/Anna%20B')).toBe('/players/Anna%20B')
    expect(englishPath('/raum/ABCD2345')).toBe('/room/ABCD2345')
  })

  it('renames the player filter and keeps other parameters', () => {
    expect(englishPath('/erfolge', '?spieler=Anna')).toBe('/achievements?player=Anna')
    expect(englishPath('/verlauf', '?x=1')).toBe('/history?x=1')
  })

  it('leaves current and unknown addresses alone', () => {
    expect(englishPath('/history')).toBeNull()
    expect(englishPath('/r/ABCD2345')).toBeNull()
    expect(englishPath('/')).toBeNull()
    expect(englishPath('/neuigkeiten')).toBeNull()
  })
})
