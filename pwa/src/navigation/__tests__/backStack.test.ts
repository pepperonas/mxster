import { describe, it, expect, beforeEach } from 'vitest'
import { backStep, notePath, tabStep } from '../backStack'

const TOP = ['/', '/history', '/stats', '/players', '/achievements', '/profile']

beforeEach(() => sessionStorage.clear())

describe('back buttons', () => {
  it('step back when the target is the page right behind', () => {
    expect(backStep('/players', 2, { 0: '/', 1: '/players', 2: '/players/Anna' })).toEqual({ kind: 'back' })
  })

  it('replace in place when the page behind is another one (no second copy)', () => {
    expect(backStep('/history', 1, { 0: '/', 1: '/history/7' })).toEqual({ kind: 'go', to: '/history', replace: true })
  })

  it('replace when opened directly (first entry, unknown index)', () => {
    expect(backStep('/', 0, {})).toEqual({ kind: 'go', to: '/', replace: true })
    expect(backStep('/', null, { 0: '/' })).toEqual({ kind: 'go', to: '/', replace: true })
  })
})

describe('navigation bar', () => {
  it('opens a destination from Home as a new page', () => {
    expect(tabStep('/players', '/', TOP, 0, { 0: '/' })).toEqual({ kind: 'go', to: '/players', replace: false })
  })

  it('swaps between destinations, so back always lands on Home', () => {
    expect(tabStep('/stats', '/players', TOP, 1, { 0: '/', 1: '/players' })).toEqual({ kind: 'go', to: '/stats', replace: true })
  })

  it('goes back to Home instead of stacking another Home', () => {
    expect(tabStep('/', '/stats', TOP, 1, { 0: '/', 1: '/stats' })).toEqual({ kind: 'back' })
    expect(tabStep('/', '/stats', TOP, 0, { 0: '/stats' })).toEqual({ kind: 'go', to: '/', replace: true })
  })

  it('from a page below a destination a new page (it keeps its own way back)', () => {
    expect(tabStep('/stats', '/players/Anna', TOP, 2, {})).toEqual({ kind: 'go', to: '/stats', replace: false })
  })
})

describe('notePath', () => {
  it('remembers the path per history index, the latest wins', () => {
    notePath(0, '/')
    notePath(1, '/players')
    notePath(1, '/stats')
    expect(backStep('/', 1)).toEqual({ kind: 'back' })
    expect(JSON.parse(sessionStorage.getItem('mxtape_nav_stack')!)).toEqual({ 0: '/', 1: '/stats' })
  })

  it('ignores entries without an index', () => {
    notePath(undefined, '/x')
    expect(sessionStorage.getItem('mxtape_nav_stack')).toBeNull()
  })
})
