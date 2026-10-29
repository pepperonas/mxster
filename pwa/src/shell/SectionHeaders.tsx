/**
 * Titles and tabs of the destinations that hold two pages:
 * Rückblick (rounds | stats) and Leute (players | friends).
 */
import { useEffect, useState } from 'react'
import { Tabs } from '@/components/ui/Tabs'
import { friendsApi } from '@/online/friendsApi'
import { useMessages } from '@/i18n'
import { shellText } from '@/i18n/messages/shell'

export function ReviewHeader() {
  const t = useMessages(shellText)
  return (
    <header className="space-y-4 mb-6">
      <h1 className="text-headline-md">{t.review}</h1>
      <Tabs
        id="review"
        label={t.reviewTabs}
        items={[
          { to: '/history', label: t.history },
          { to: '/stats', label: t.stats }
        ]}
      />
    </header>
  )
}

/** Open friend requests, for the badge on the friends tab. */
function useIncomingRequests(): number {
  const [n, setN] = useState(0)
  useEffect(() => {
    let alive = true
    friendsApi
      .list()
      .then((l) => alive && setN(l.incoming.length))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])
  return n
}

export function PeopleHeader() {
  const t = useMessages(shellText)
  const incoming = useIncomingRequests()
  return (
    <header className="space-y-4 mb-6">
      <h1 className="text-headline-md">{t.people}</h1>
      <Tabs
        id="people"
        label={t.peopleTabs}
        items={[
          { to: '/players', label: t.players },
          { to: '/friends', label: t.friends, badge: incoming }
        ]}
      />
    </header>
  )
}
