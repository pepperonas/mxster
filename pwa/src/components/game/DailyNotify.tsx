/**
 * After today's round: tell chosen friends by mail. A button on the result
 * opens a dialog with the friends who accept such mails (preselected: who has
 * not played today yet); the server sends the mails, once a day, never
 * handing out addresses (api/daily.py notify).
 */
import { useEffect, useState } from 'react'
import { api, ApiError } from '@/api/client'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { useUI } from '@/contexts'
import { getLang, useMessages } from '@/i18n'
import { dailyText } from '@/i18n/messages/daily'

export interface NotifyFriend {
  id: number
  name: string
  picture: string
  played: boolean
}

/** The button; disabled once sent today. */
export function DailyNotifyButton({ day, streak }: { day: string; streak: number }) {
  const t = useMessages(dailyText)
  const { showModal, closeModal } = useUI()
  const [sent, setSent] = useState(false)
  useEffect(() => {
    let alive = true
    api<{ sent: boolean }>(`/api/daily/${day}/notify`)
      .then((r) => alive && setSent(r.sent))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [day])
  return (
    <button
      type="button"
      className="btn btn-tonal m3-state-layer w-full"
      disabled={sent}
      data-daily-notify
      onClick={() =>
        showModal(t.notifyTitle, <DailyNotifyDialog day={day} streak={streak} onSent={() => setSent(true)} onClose={() => void closeModal()} />)
      }
    >
      <Icon name={sent ? 'check' : 'mail'} />
      {sent ? t.notified : t.notifyButton}
    </button>
  )
}

/** Who should hear about it: preselected are friends who have not played today. */
export function preselect(friends: NotifyFriend[]): number[] {
  return friends.filter((f) => !f.played).map((f) => f.id)
}

export function DailyNotifyDialog({ day, streak, onSent, onClose }: { day: string; streak: number; onSent: () => void; onClose: () => void }) {
  const t = useMessages(dailyText)
  const { addToast } = useUI()
  const [friends, setFriends] = useState<NotifyFriend[] | null>(null)
  const [chosen, setChosen] = useState<number[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    api<{ friends: NotifyFriend[] }>(`/api/daily/${day}/notify`)
      .then((r) => {
        if (!alive) return
        setFriends(r.friends)
        setChosen(preselect(r.friends))
      })
      .catch(() => alive && setFriends([]))
    return () => {
      alive = false
    }
  }, [day])

  const toggle = (id: number) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))

  async function send() {
    setBusy(true)
    try {
      const r = await api<{ sent: number }>(`/api/daily/${day}/notify`, { method: 'POST', json: { ids: chosen, lang: getLang() } })
      addToast(t.notifySent(r.sent), 'success')
      onSent()
      onClose()
    } catch (e) {
      if (e instanceof ApiError && e.code === 'already_sent') onSent()
      addToast(t.notifyFailed, 'warning')
      setBusy(false)
    }
  }

  if (friends === null) return <p className="meta">{t.notifyLoading}</p>
  if (friends.length === 0)
    return (
      <div className="space-y-4">
        <p className="text-body-lg">{t.notifyNoFriends}</p>
        <button type="button" className="btn btn-tonal m3-state-layer w-full" onClick={onClose}>
          {t.notifyLater}
        </button>
      </div>
    )

  return (
    <div className="space-y-4" data-notify-dialog>
      <p className="text-body-lg">{t.notifyIntro(streak)}</p>
      <div className="flex gap-2">
        <button type="button" className="chip m3-state-layer" onClick={() => setChosen(friends.map((f) => f.id))}>
          {t.notifyAll}
        </button>
        <button type="button" className="chip m3-state-layer" onClick={() => setChosen([])}>
          {t.notifyNone}
        </button>
      </div>
      <ul className="space-y-1 max-h-[45vh] overflow-y-auto -mx-2 px-2">
        {friends.map((f) => (
          <li key={f.id}>
            <label className="flex items-center gap-3 min-h-[56px] px-2 rounded-m3-lg cursor-pointer m3-state-layer">
              <input
                type="checkbox"
                className="w-5 h-5 accent-[rgb(var(--md-sys-color-primary))]"
                checked={chosen.includes(f.id)}
                onChange={() => toggle(f.id)}
              />
              <Avatar name={f.name} picture={f.picture} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block text-body-lg truncate">{f.name}</span>
                {f.played && <span className="block text-body-sm text-md-on-surface-variant">{t.notifyPlayed}</span>}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <p className="meta">{t.notifyOnce}</p>
      <div className="flex gap-3">
        <button type="button" className="btn btn-text m3-state-layer flex-1" onClick={onClose}>
          {t.notifyLater}
        </button>
        <button type="button" className="btn btn-brand m3-state-layer flex-1" disabled={busy || chosen.length === 0} onClick={() => void send()}>
          <Icon name="mail" />
          {t.notifySend(chosen.length)}
        </button>
      </div>
    </div>
  )
}
