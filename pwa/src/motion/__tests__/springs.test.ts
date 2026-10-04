import { describe, it, expect } from 'vitest'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  M3_SPRINGS,
  spring,
  springPosition,
  springSettleTime,
  springToCss,
  springCssBlock,
  toMotionSpring
} from '../springs'

const TOKENS = resolve(__dirname, '../../styles/design-tokens.css')
const BEGIN = '/* BEGIN GENERATED SPRINGS — src/motion/springs.ts */'
const END = '/* END GENERATED SPRINGS */'

describe('M3 spring parameters', () => {
  it('converts damping ratio to Motion damping (c = 2ζ√k)', () => {
    expect(spring.spatialFast).toEqual({ type: 'spring', stiffness: 800, damping: 33.94, mass: 1 })
    expect(spring.spatialDefault.damping).toBe(31.19)
    expect(spring.spatialSlow.damping).toBe(22.63)
    expect(spring.effectsFast.damping).toBe(123.29)
    expect(spring.effectsDefault.damping).toBe(80)
    expect(spring.effectsSlow.damping).toBe(56.57)
    expect(toMotionSpring({ stiffness: 100, dampingRatio: 0.5 }).damping).toBe(10)
  })
})

describe('closed-form spring', () => {
  const sample = (spec: (typeof M3_SPRINGS)[keyof typeof M3_SPRINGS]) =>
    Array.from({ length: 200 }, (_, i) => springPosition(spec, i / 200))

  it('starts at rest at 0 and settles at 1', () => {
    for (const spec of Object.values(M3_SPRINGS)) {
      expect(springPosition(spec, 0)).toBeCloseTo(0, 10)
      expect(springPosition(spec, springSettleTime(spec))).toBeCloseTo(1, 2)
    }
  })

  it('lets spatial springs overshoot and keeps effects springs monotonic', () => {
    expect(Math.max(...sample(M3_SPRINGS.spatialFast))).toBeGreaterThan(1.05)
    expect(Math.max(...sample(M3_SPRINGS.spatialDefault))).toBeGreaterThan(1)
    const effects = sample(M3_SPRINGS.effectsDefault)
    expect(Math.max(...effects)).toBeLessThanOrEqual(1)
    effects.slice(1).forEach((v, i) => expect(v).toBeGreaterThanOrEqual(effects[i] - 1e-12))
  })

  it('orders settle times fast < default < slow, in the M3 duration ballpark', () => {
    const t = (n: keyof typeof M3_SPRINGS) => springSettleTime(M3_SPRINGS[n])
    expect(t('spatialFast')).toBeLessThan(t('spatialDefault'))
    expect(t('spatialDefault')).toBeLessThan(t('spatialSlow'))
    expect(t('effectsFast')).toBeLessThan(t('effectsDefault'))
    expect(t('effectsDefault')).toBeLessThan(t('effectsSlow'))
    expect(t('spatialSlow')).toBeLessThan(0.8)
    expect(t('effectsFast')).toBeLessThan(0.2)
  })

  it('samples into a CSS linear() that ends exactly at 1', () => {
    const css = springToCss(M3_SPRINGS.spatialFast)
    expect(css.easing.startsWith('linear(0, ')).toBe(true)
    expect(css.easing.endsWith(', 1)')).toBe(true)
    expect(css.durationMs).toBeGreaterThan(300)
  })
})

describe('design-tokens.css', () => {
  it('contains the generated spring block (regenerate: UPDATE_SPRING_CSS=1)', () => {
    const css = readFileSync(TOKENS, 'utf8')
    const i = css.indexOf(BEGIN)
    const j = css.indexOf(END)
    expect(i).toBeGreaterThan(-1)
    expect(j).toBeGreaterThan(i)
    const expected = `${BEGIN}\n${springCssBlock()}\n${END}`
    const actual = css.slice(i, j + END.length)
    if (process.env.UPDATE_SPRING_CSS && actual !== expected) {
      writeFileSync(TOKENS, css.slice(0, i) + expected + css.slice(j + END.length))
      return
    }
    expect(actual).toBe(expected)
  })
})
