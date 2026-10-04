import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getParametersForActivity, interpolateParameters } from '../activityAnimations'

const tokens = readFileSync(resolve(__dirname, '../../styles/design-tokens.css'), 'utf8')
const ref = (name: string) => {
  const m = tokens.match(new RegExp(`--md-ref-${name}:\\s*(\\d+) (\\d+) (\\d+);`))
  if (!m) throw new Error(`token ${name} missing`)
  return (Number(m[1]) << 16) | (Number(m[2]) << 8) | Number(m[3])
}

describe('particle colours mirror the design tokens', () => {
  it('timeline palette', () => {
    const p = getParametersForActivity('calm', false)
    expect(p.mainColor).toBe(ref('primary-60'))
    expect(p.accentColor).toBe(ref('tertiary-60'))
    expect(p.starColor).toBe(ref('primary-90'))
  })

  it('hardcore palette', () => {
    const p = getParametersForActivity('calm', true)
    expect(p.mainColor).toBe(ref('tertiary-60'))
    expect(p.accentColor).toBe(ref('tertiary-70'))
    expect(p.starColor).toBe(ref('tertiary-80'))
  })
})

describe('interpolateParameters', () => {
  it('goes from the start value to the target without compounding', () => {
    const a = getParametersForActivity('calm', false)
    const b = getParametersForActivity('intense', false)
    expect(interpolateParameters(a, b, 0).waveAmplitude).toBeCloseTo(a.waveAmplitude)
    expect(interpolateParameters(a, b, 1).waveAmplitude).toBeCloseTo(b.waveAmplitude)
    const mid = interpolateParameters(a, b, 0.5).waveAmplitude
    expect(mid).toBeGreaterThan(Math.min(a.waveAmplitude, b.waveAmplitude))
    expect(mid).toBeLessThan(Math.max(a.waveAmplitude, b.waveAmplitude))
  })
})
