/** Friends between accounts, search, invitations into rooms. */
import { api } from '@/api/client'

export interface Person {
  id: number
  name: string
  firstName: string
  picture: string
}

export type Relation = 'none' | 'friend' | 'outgoing' | 'incoming'

export interface FriendLists {
  friends: Person[]
  incoming: Person[]
  outgoing: Person[]
}

export interface Invite {
  id: number
  code: string
  from: Person | null
}

export const friendsApi = {
  list: () => api<FriendLists>('/api/friends'),
  search: (q: string) => api<{ results: Array<Person & { relation: Relation }> }>(`/api/users/search?q=${encodeURIComponent(q)}`),
  request: (id: number) => api<{ relation: Relation }>(`/api/friends/${id}`, { method: 'POST' }),
  accept: (id: number) => api<{ relation: Relation }>(`/api/friends/${id}/accept`, { method: 'POST' }),
  remove: (id: number) => api<{ relation: Relation }>(`/api/friends/${id}`, { method: 'DELETE' }),
  invites: () => api<{ invites: Invite[] }>('/api/invites'),
  dismissInvite: (id: number) => api(`/api/invites/${id}`, { method: 'DELETE' })
}
