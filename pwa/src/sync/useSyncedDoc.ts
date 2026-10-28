/**
 * One per-account document on the server (history, achievements, settings),
 * mirrored into React state.
 *
 * - Loads once on mount. If the server has nothing yet and the browser still
 *   holds the pre-account localStorage data, that data is adopted and uploaded
 *   once, then the old key is removed.
 * - Writes are debounced and carry the version they were based on. A 409
 *   means another device wrote in between: the two states are merged with
 *   the document's own merge rule and written again. The merge also gets the
 *   last state both sides agreed on, so a deletion on this device is not
 *   undone by the other device's copy.
 * - A failed load or write is retried (growing pauses, and at once when the
 *   browser is back online). Until the document has loaded nothing is
 *   written, so a failed load can never overwrite the account with defaults.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError } from '@/api/client'
import { useSyncMode } from './syncMode'

export type DocKind = 'history' | 'achievements' | 'settings'

interface Doc<T> {
  version: number
  data: T | null
}

export interface SyncedDocOptions<T> {
  initial: T
  /**
   * Combine the local state with the server's newer state after a conflict.
   * `base` is the last state this device and the server agreed on.
   */
  merge: (local: T, server: T, base?: T) => T
  /** Old localStorage key from before accounts existed (adopted once). */
  legacyKey?: string
  /** Turn the parsed legacy value into T (or null to ignore it). */
  fromLegacy?: (raw: unknown) => T | null
  /** Normalise whatever the server returns (old shapes, missing fields). */
  normalize?: (raw: unknown) => T
  debounceMs?: number
}

export type SyncStatus = 'loading' | 'ready' | 'error'

export function readLegacy<T>(key: string | undefined, fromLegacy?: (raw: unknown) => T | null): T | null {
  if (!key) return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return fromLegacy ? fromLegacy(parsed) : (parsed as T)
  } catch {
    return null
  }
}

/** Pauses between retries of a failed load or write. */
export const RETRY_FIRST_MS = 2000
export const RETRY_MAX_MS = 30000
/** Browsers drop keepalive requests above 64 KB. */
const KEEPALIVE_MAX = 60_000

export function useSyncedDoc<T>(kind: DocKind, options: SyncedDocOptions<T>) {
  const opts = useRef(options)
  opts.current = options
  const guest = useSyncMode() === 'guest'

  const [value, setValueState] = useState<T>(options.initial)
  const [status, setStatus] = useState<SyncStatus>('loading')

  const valueRef = useRef(value)
  const version = useRef(0)
  const dirty = useRef(false)
  const saving = useRef(false)
  const timer = useRef<number | undefined>(undefined)
  const migratedKey = useRef<string | undefined>(undefined)
  const alive = useRef(true)
  const loaded = useRef(false)
  /** The last state confirmed by the server (for three-way merges). */
  const base = useRef<T | undefined>(undefined)
  const retryTimer = useRef<number | undefined>(undefined)
  const retryDelay = useRef(RETRY_FIRST_MS)

  const save = useCallback(async (leaving = false) => {
    if (guest) return
    if (saving.current || !dirty.current || !loaded.current) return
    saving.current = true
    let failed = false
    try {
      for (let attempt = 0; attempt < 4 && dirty.current; attempt++) {
        dirty.current = false
        const data = valueRef.current
        const json = { version: version.current, data }
        // Closing the tab cancels a normal request; keepalive survives it (small bodies only)
        const keepalive = leaving && JSON.stringify(json).length < KEEPALIVE_MAX
        try {
          const res = await api<Doc<T>>(`/api/data/${kind}`, { method: 'PUT', json, ...(keepalive ? { keepalive } : {}) })
          version.current = res.version
          base.current = data
          retryDelay.current = RETRY_FIRST_MS
          if (migratedKey.current) {
            localStorage.removeItem(migratedKey.current)
            migratedKey.current = undefined
          }
        } catch (error) {
          if (error instanceof ApiError && error.status === 409) {
            const current = error.body.current as Doc<unknown>
            const { merge, normalize } = opts.current
            const server = normalize ? normalize(current.data) : ((current.data ?? opts.current.initial) as T)
            const merged = merge(valueRef.current, server, base.current)
            version.current = current.version
            base.current = server
            valueRef.current = merged
            if (alive.current) setValueState(merged)
            dirty.current = true
            continue
          }
          dirty.current = true // keep it for the retry
          throw error
        }
      }
    } catch (error) {
      failed = true
      console.warn(`[sync] saving ${kind} failed`, error)
    } finally {
      saving.current = false
    }
    if (failed && alive.current && !leaving) {
      // Offline at the end of a round: try again until it is stored
      window.clearTimeout(retryTimer.current)
      retryTimer.current = window.setTimeout(() => void save(), retryDelay.current)
      retryDelay.current = Math.min(RETRY_MAX_MS, retryDelay.current * 2)
    }
  }, [kind, guest])

  const schedule = useCallback(() => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void save(), opts.current.debounceMs ?? 600)
  }, [save])

  useEffect(() => {
    alive.current = true
    if (guest) {
      // No account: start empty and keep everything in memory
      loaded.current = true
      setStatus('ready')
      return
    }
    let cancelled = false
    let pause = RETRY_FIRST_MS
    let again: number | undefined
    const load = () =>
      api<Doc<unknown>>(`/api/data/${kind}`)
        .then((doc) => {
          if (cancelled) return
          const { normalize, initial, legacyKey, fromLegacy } = opts.current
          version.current = doc.version
          let next: T
          if (doc.version === 0) {
            const legacy = readLegacy<T>(legacyKey, fromLegacy)
            if (legacy !== null) {
              next = legacy
              migratedKey.current = legacyKey
              dirty.current = true
            } else next = initial
          } else {
            next = normalize ? normalize(doc.data) : ((doc.data ?? initial) as T)
          }
          base.current = next
          // Something changed locally while the document was still loading.
          if (dirty.current && !migratedKey.current) next = opts.current.merge(valueRef.current, next, opts.current.initial)
          valueRef.current = next
          loaded.current = true
          setValueState(next)
          setStatus('ready')
          if (dirty.current) void save()
        })
        .catch(() => {
          if (cancelled) return
          // Keep trying: until the document is here, nothing may be written
          setStatus('error')
          again = window.setTimeout(load, pause)
          pause = Math.min(RETRY_MAX_MS, pause * 2)
        })
    void load()
    const online = () => {
      if (cancelled) return
      if (!loaded.current) {
        window.clearTimeout(again)
        void load()
      } else if (dirty.current) void save()
    }
    window.addEventListener('online', online)
    return () => {
      cancelled = true
      window.clearTimeout(again)
      window.clearTimeout(retryTimer.current)
      window.removeEventListener('online', online)
    }
  }, [kind, save, guest])

  // Flush pending writes when the page goes away.
  useEffect(() => {
    const flush = () => {
      if (dirty.current) void save(true)
    }
    window.addEventListener('pagehide', flush)
    return () => {
      alive.current = false
      window.removeEventListener('pagehide', flush)
      window.clearTimeout(timer.current)
      flush()
    }
  }, [save])

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === 'function' ? (next as (prev: T) => T)(valueRef.current) : next
      if (Object.is(resolved, valueRef.current)) return
      valueRef.current = resolved
      setValueState(resolved)
      dirty.current = true
      schedule()
    },
    [schedule]
  )

  return { value, setValue, status }
}
