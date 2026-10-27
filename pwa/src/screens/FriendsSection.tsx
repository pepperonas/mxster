/**
 * Freunde — in the player management. Find people with an account by name or
 * e-mail, send a request, accept the ones that came in. Friends can be invited
 * straight into a room from the lobby.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { useUI } from '@/contexts'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { friendsApi, type FriendLists, type Person, type Relation } from '@/online/friendsApi'
import { spring } from '@/motion/springs'

const SEARCH_DELAY_MS = 300

export function FriendsSection() {
  const { showModal, addToast } = useUI()
  const [lists, setLists] = useState<FriendLists | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<Person & { relation: Relation }> | null>(null)
  const [searching, setSearching] = useState(false)
  const latestQuery = useRef('')

  const load = useCallback(() => {
    friendsApi
      .list()
      .then(setLists)
      .catch(() => setLists({ friends: [], incoming: [], outgoing: [] }))
  }, [])
  useEffect(load, [load])

  // Search as you type, debounced; ignore answers to older queries
  useEffect(() => {
    const q = query.trim()
    latestQuery.current = q
    if (q.length < 2) {
      setResults(null)
      return
    }
    setSearching(true)
    const id = window.setTimeout(() => {
      friendsApi
        .search(q)
        .then((r) => latestQuery.current === q && setResults(r.results))
        .catch(() => latestQuery.current === q && setResults([]))
        .finally(() => latestQuery.current === q && setSearching(false))
    }, SEARCH_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [query])

  const act = async (fn: () => Promise<unknown>, done?: string) => {
    try {
      await fn()
      if (done) addToast(done, 'success')
      load()
      if (latestQuery.current.length >= 2) {
        const r = await friendsApi.search(latestQuery.current)
        setResults(r.results)
      }
    } catch {
      addToast('Das hat nicht geklappt. Bitte nochmal versuchen.', 'error')
    }
  }

  const askRemove = (p: Person) =>
    showModal(`${p.firstName} entfernen?`, <p className="text-body-lg">Ihr seid danach keine Freunde mehr. Eure gemeinsamen Runden bleiben im Verlauf.</p>, [
      { text: 'Behalten' },
      { text: 'Entfernen', variant: 'danger', onClick: () => void act(() => friendsApi.remove(p.id)) }
    ])

  return (
    <section aria-labelledby="friends-h" className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="friends-h" className="text-title-lg">
          Freunde
        </h2>
        {lists && lists.incoming.length > 0 && (
          <span className="rounded-m3-full bg-md-primary text-md-on-primary px-2.5 py-0.5 text-label-md tabular" aria-label={`${lists.incoming.length} neue Anfragen`}>
            {lists.incoming.length}
          </span>
        )}
      </div>

      <div className="relative">
        <label htmlFor="friend-search" className="sr-only">
          Person suchen
        </label>
        <input
          id="friend-search"
          className="field pr-12"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name oder E-Mail suchen"
          autoComplete="off"
          type="search"
        />
        {searching && <span className="m3-loading-arc absolute right-4 top-1/2 -translate-y-1/2" aria-hidden />}
      </div>
      <p className="text-body-sm text-md-on-surface-variant -mt-2">Gefunden werden nur Leute mit freigeschaltetem Konto, per Name oder genauer E-Mail-Adresse.</p>

      <AnimatePresence initial={false}>
        {results && (
          <m.ul
            key="results"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: spring.effectsFast }}
            transition={spring.spatialDefault}
            className="space-y-2"
            aria-label="Suchergebnisse"
          >
            {results.length === 0 ? (
              <li className="meta px-1">Niemand gefunden.</li>
            ) : (
              results.map((p) => (
                <li key={p.id} className="row">
                  <Avatar name={p.name} picture={p.picture || undefined} size={40} />
                  <span className="flex-1 min-w-0 text-title-md truncate">{p.name}</span>
                  <RelationButton
                    relation={p.relation}
                    onRequest={() => void act(() => friendsApi.request(p.id), `Anfrage an ${p.firstName} geschickt`)}
                    onAccept={() => void act(() => friendsApi.accept(p.id), `${p.firstName} ist jetzt dein Freund`)}
                  />
                </li>
              ))
            )}
          </m.ul>
        )}
      </AnimatePresence>

      {lists && lists.incoming.length > 0 && (
        <div className="space-y-2" aria-label="Anfragen an dich">
          <p className="text-label-lg text-md-on-surface-variant">Anfragen an dich</p>
          {lists.incoming.map((p) => (
            <div key={p.id} className="row">
              <Avatar name={p.name} picture={p.picture || undefined} size={40} />
              <span className="flex-1 min-w-0 text-title-md truncate">{p.name}</span>
              <button type="button" className="btn btn-brand m3-state-layer" onClick={() => void act(() => friendsApi.accept(p.id), `${p.firstName} ist jetzt dein Freund`)}>
                Annehmen
              </button>
              <button type="button" className="icon-btn m3-state-layer text-md-on-surface-variant" aria-label={`Anfrage von ${p.firstName} ablehnen`} onClick={() => void act(() => friendsApi.remove(p.id))}>
                <Icon name="close" />
              </button>
            </div>
          ))}
        </div>
      )}

      {lists && (lists.friends.length > 0 || lists.outgoing.length > 0) && (
        <ul className="space-y-2" aria-label="Deine Freunde">
          {lists.friends.map((p) => (
            <li key={p.id} className="row">
              <Avatar name={p.name} picture={p.picture || undefined} size={40} />
              <span className="flex-1 min-w-0 text-title-md truncate">{p.name}</span>
              <button type="button" className="icon-btn m3-state-layer text-md-on-surface-variant" aria-label={`${p.firstName} als Freund entfernen`} onClick={() => askRemove(p)}>
                <Icon name="delete" />
              </button>
            </li>
          ))}
          {lists.outgoing.map((p) => (
            <li key={p.id} className="row">
              <Avatar name={p.name} picture={p.picture || undefined} size={40} />
              <span className="flex-1 min-w-0">
                <span className="block text-title-md truncate">{p.name}</span>
                <span className="block meta">Anfrage gesendet</span>
              </span>
              <button type="button" className="btn btn-text m3-state-layer" onClick={() => void act(() => friendsApi.remove(p.id))}>
                Zurückziehen
              </button>
            </li>
          ))}
        </ul>
      )}
      {lists && lists.friends.length === 0 && lists.outgoing.length === 0 && lists.incoming.length === 0 && !results && (
        <p className="meta">Noch keine Freunde. Such nach Leuten, mit denen du spielst – dann kannst du sie direkt in einen Raum einladen.</p>
      )}
    </section>
  )
}

function RelationButton({ relation, onRequest, onAccept }: { relation: Relation; onRequest: () => void; onAccept: () => void }) {
  if (relation === 'friend')
    return (
      <span className="flex items-center gap-1 text-label-lg text-md-on-surface-variant">
        <Icon name="check" size={18} />
        Freund
      </span>
    )
  if (relation === 'outgoing') return <span className="text-label-lg text-md-on-surface-variant">Angefragt</span>
  if (relation === 'incoming')
    return (
      <button type="button" className="btn btn-brand m3-state-layer" onClick={onAccept}>
        Annehmen
      </button>
    )
  return (
    <button type="button" className="btn btn-tonal m3-state-layer" onClick={onRequest}>
      <Icon name="add" size={18} />
      Hinzufügen
    </button>
  )
}
