import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSyncedDoc } from '../useSyncedDoc'
import { fakeDoc, seedFakeDoc } from '@/test/fakeApi'

const union = (a: string[], b: string[]) => [...new Set([...b, ...a])]

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers({ shouldAdvanceTime: true })
})
afterEach(() => vi.useRealTimers())

describe('useSyncedDoc', () => {
  it('loads the server document', async () => {
    seedFakeDoc('history', ['a'], 3)
    const { result } = renderHook(() => useSyncedDoc<string[]>('history', { initial: [], merge: union }))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.value).toEqual(['a'])
  })

  it('adopts the pre-account localStorage data once, uploads it and removes the old key', async () => {
    localStorage.setItem('old_key', JSON.stringify(['legacy']))
    const { result } = renderHook(() =>
      useSyncedDoc<string[]>('history', { initial: [], merge: union, legacyKey: 'old_key' })
    )
    await waitFor(() => expect(result.current.value).toEqual(['legacy']))
    await waitFor(() => expect(fakeDoc('history')).toEqual({ version: 1, data: ['legacy'] }))
    expect(localStorage.getItem('old_key')).toBeNull()
  })

  it('ignores legacy data when the account already has a document', async () => {
    seedFakeDoc('history', ['server'], 2)
    localStorage.setItem('old_key', JSON.stringify(['legacy']))
    const { result } = renderHook(() =>
      useSyncedDoc<string[]>('history', { initial: [], merge: union, legacyKey: 'old_key' })
    )
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.value).toEqual(['server'])
  })

  it('writes changes with the version they are based on', async () => {
    seedFakeDoc('history', ['a'], 1)
    const { result } = renderHook(() => useSyncedDoc<string[]>('history', { initial: [], merge: union, debounceMs: 10 }))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    act(() => result.current.setValue((prev) => [...prev, 'b']))
    await act(() => vi.advanceTimersByTimeAsync(50))
    await waitFor(() => expect(fakeDoc('history')).toEqual({ version: 2, data: ['a', 'b'] }))
  })

  it('merges with the server state after a conflict instead of overwriting it', async () => {
    seedFakeDoc('history', ['a'], 1)
    const { result } = renderHook(() => useSyncedDoc<string[]>('history', { initial: [], merge: union, debounceMs: 10 }))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    seedFakeDoc('history', ['a', 'other-device'], 2) // another device wrote in between
    act(() => result.current.setValue((prev) => [...prev, 'mine']))
    await act(() => vi.advanceTimersByTimeAsync(50))
    await waitFor(() => expect(fakeDoc('history').version).toBe(3))
    expect([...(fakeDoc('history').data as string[])].sort()).toEqual(['a', 'mine', 'other-device'])
    expect([...result.current.value].sort()).toEqual(['a', 'mine', 'other-device'])
  })
})

describe('useSyncedDoc when the network fails', () => {
  /** fetch that fails the first `n` calls for the document, then uses the fake API. */
  function flaky(n: number, method: 'GET' | 'PUT') {
    let left = n
    const calls: string[] = []
    const real = globalThis.fetch
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const m = (init.method ?? 'GET').toUpperCase()
      calls.push(m)
      if (m === method && left > 0) {
        left--
        throw new TypeError('Failed to fetch')
      }
      return real(input, init)
    })
    return calls
  }
  afterEach(() => vi.unstubAllGlobals())

  it('keeps loading until it works, and writes nothing before that', async () => {
    seedFakeDoc('history', ['server'], 4)
    const calls = flaky(2, 'GET')
    const { result } = renderHook(() => useSyncedDoc<string[]>('history', { initial: [], merge: union, debounceMs: 10 }))
    await waitFor(() => expect(result.current.status).toBe('error'))
    // a round finished while the document could not load
    act(() => result.current.setValue((prev) => [...prev, 'played']))
    await act(() => vi.advanceTimersByTimeAsync(100))
    expect(calls).not.toContain('PUT')
    expect(fakeDoc('history').data).toEqual(['server'])
    await act(() => vi.advanceTimersByTimeAsync(10_000))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    // the round played meanwhile is kept and joined with the server's
    await waitFor(() => expect([...(fakeDoc('history').data as string[])].sort()).toEqual(['played', 'server']))
  })

  it('tries a failed write again', async () => {
    seedFakeDoc('history', ['a'], 1)
    const calls = flaky(2, 'PUT')
    const { result } = renderHook(() => useSyncedDoc<string[]>('history', { initial: [], merge: union, debounceMs: 10 }))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    act(() => result.current.setValue((prev) => [...prev, 'b']))
    await act(() => vi.advanceTimersByTimeAsync(20_000))
    await waitFor(() => expect(fakeDoc('history').data).toEqual(['a', 'b']))
    expect(calls.filter((c) => c === 'PUT')).toHaveLength(3)
  })

  it('tries again at once when the browser is back online', async () => {
    seedFakeDoc('history', ['a'], 1)
    flaky(1, 'PUT')
    const { result } = renderHook(() => useSyncedDoc<string[]>('history', { initial: [], merge: union, debounceMs: 10 }))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    act(() => result.current.setValue((prev) => [...prev, 'b']))
    await act(() => vi.advanceTimersByTimeAsync(50))
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    await act(() => vi.advanceTimersByTimeAsync(50))
    await waitFor(() => expect(fakeDoc('history').data).toEqual(['a', 'b']))
  })
})

describe('useSyncedDoc conflicts keep deletions', () => {
  it('hands the merge the last agreed state, so a deletion here is not undone', async () => {
    seedFakeDoc('history', ['a', 'b'], 1)
    const threeWay = (local: string[], server: string[], base?: string[]) => {
      const gone = new Set((base ?? []).filter((x) => !local.includes(x)))
      return union(local, server).filter((x) => !gone.has(x))
    }
    const { result } = renderHook(() => useSyncedDoc<string[]>('history', { initial: [], merge: threeWay, debounceMs: 10 }))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    seedFakeDoc('history', ['a', 'b', 'c'], 2) // another device added c
    act(() => result.current.setValue((prev) => prev.filter((x) => x !== 'b'))) // this one deletes b
    await act(() => vi.advanceTimersByTimeAsync(50))
    await waitFor(() => expect(fakeDoc('history').version).toBe(3))
    expect([...(fakeDoc('history').data as string[])].sort()).toEqual(['a', 'c'])
  })
})
