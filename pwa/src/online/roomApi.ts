/** REST side of a room. */
import { api } from '@/api/client'
import type { MusicMode, RoomInfo, RoomStatus } from './protocol'

export const roomApi = {
  create: (music: MusicMode, options: Record<string, unknown>) => api<RoomInfo>('/api/rooms', { method: 'POST', json: { music, options } }),
  read: (code: string) => api<RoomInfo>(`/api/rooms/${encodeURIComponent(code)}`),
  join: (code: string, name?: string) => api<RoomInfo>(`/api/rooms/${encodeURIComponent(code)}/join`, { method: 'POST', json: { name } }),
  setStatus: (code: string, status: RoomStatus) =>
    api<RoomInfo>(`/api/rooms/${encodeURIComponent(code)}/status`, { method: 'POST', json: { status } }),
  kick: (code: string, seat: number) => api(`/api/rooms/${encodeURIComponent(code)}/kick/${seat}`, { method: 'POST' }),
  invite: (code: string, userId: number) => api(`/api/rooms/${encodeURIComponent(code)}/invite/${userId}`, { method: 'POST' })
}

export const roomLink = (code: string) => `${window.location.origin}/r/${code}`
