/**
 * One per-account document on the server (history, achievements, settings),
 * mirrored into React state.
 *
 * - Loads once on mount. If the server has nothing yet and the browser still
 *   holds the pre-account localStorage data, that data is adopted and uploaded
 *   once, then the old key is removed.
 * - Writes are debounced and carry the version they were based on. A 409
 *   means another device wrote in between: the two states are merged with
 *   the document's own merge rule and written again.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError } from '@/api/client'

export type DocKind = 'history' | 'achievements' | 'settings'

interface Doc<T> {
  version: number
  data: T | null
}

export interface SyncedDocOptions<T> {
  initial: T
  /** Combine the local state with the server's newer state after a conflict. */
  merge: (local: T, server: T) => T
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

export function useSyncedDoc<T>(kind: DocKind, options: SyncedDocOptions<T>) {
  const opts = useRef(options)
  opts.current = options

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

  const save = useCallback(async () => {
    if (saving.current || !dirty.current || !loaded.current) return
    saving.current = true
    try {
      for (let attempt = 0; attempt < 4 && dirty.current; attempt++) {
        dirty.current = false
        const data = valueRef.current
        try {
          const res = await api<Doc<T>>(`/api/data/${kind}`, { method: 'PUT', json: { version: version.current, data } })
          version.current = res.version
          if (migratedKey.current) {
            localStorage.removeItem(migratedKey.current)
            migratedKey.current = undefined
          }
        } catch (error) {
          if (error instanceof ApiError && error.status === 409) {
            const current = error.body.current as Doc<unknown>
            const { merge, normalize } = opts.current
            const server = normalize ? normalize(current.data) : ((current.data ?? opts.current.initial) as T)
            const merged = merge(valueRef.current, server)
            version.current = current.version
            valueRef.current = merged
            if (alive.current) setValueState(merged)
            dirty.current = true
            continue
          }
          dirty.current = true // keep it for the next change / retry
          throw error
        }
      }
    } catch (error) {
      console.warn(`[sync] saving ${kind} failed`, error)
    } finally {
      saving.current = false
    }
  }, [kind])

  const schedule = useCallback(() => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void save(), opts.current.debounceMs ?? 600)
  }, [save])

  useEffect(() => {
    alive.current = true
    let cancelled = false
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
        // Something changed locally while the document was still loading.
        if (dirty.current && !migratedKey.current) next = opts.current.merge(valueRef.current, next)
        valueRef.current = next
        loaded.current = true
        setValueState(next)
        setStatus('ready')
        if (dirty.current) void save()
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => {
      cancelled = true
    }
  }, [kind, save])

  // Flush pending writes when the page goes away.
  useEffect(() => {
    const flush = () => {
      if (dirty.current) void save()
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
