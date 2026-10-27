import { describe, it, expect } from 'vitest'
import { audioSrc } from '../PreviewPlayerService'

describe('audioSrc', () => {
  it('plays from the same origin', () => {
    expect(audioSrc('https://mxster.celox.io/audio/song_042.m4a')).toBe('/audio/song_042.m4a')
  })

  it('maps the old .mp3 URL of a saved round to the new file', () => {
    expect(audioSrc('https://mxster.celox.io/audio/song_042.mp3')).toBe('/audio/song_042.m4a')
  })

  it('leaves other paths alone', () => {
    expect(audioSrc('/sounds/click.mp3')).toBe('/sounds/click.mp3')
  })
})
