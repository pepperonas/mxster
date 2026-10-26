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
