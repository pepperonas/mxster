/**
 * Where the account documents live. "account": on the server (the normal app).
 * "guest": only in memory — a guest who joined a room by link has no account,
 * so nothing is loaded or saved and no request ever asks for one.
 */
import { createContext, useContext, type ReactNode } from 'react'

export type SyncMode = 'account' | 'guest'

const SyncModeContext = createContext<SyncMode>('account')

export function SyncModeProvider({ mode, children }: { mode: SyncMode; children: ReactNode }) {
  return <SyncModeContext.Provider value={mode}>{children}</SyncModeContext.Provider>
}

export const useSyncMode = () => useContext(SyncModeContext)
