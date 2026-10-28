/**
 * "Stimmt was nicht?" under a revealed song: the player picks what is wrong
 * (year, version, sound, cover) and it lands in the admin's list. Only for
 * approved accounts — guests in a room have no account to report from.
 */
import { useState } from 'react'
import { api } from '@/api/client'
import { useAuthMaybe } from '@/auth/AuthContext'
import { useUI } from '@/contexts'
import { useMessages } from '@/i18n'
import { gameText } from '@/i18n/messages/game'
import { apiErrorText } from '@/i18n/messages/errors'
import { Icon } from '@/components/ui/Icon'
import type { Song } from '@/types'

export const REPORT_REASONS = ['year', 'version', 'audio', 'cover', 'other'] as const

export function ReportSongButton({ song }: { song: Song }) {
  const auth = useAuthMaybe()
  const { showModal } = useUI()
  const t = useMessages(gameText)
  if (auth?.state.kind !== 'signed-in' || auth.state.me.status !== 'approved') return null
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 min-h-[40px] -ml-1 px-1 text-label-md text-md-on-surface-variant hover:text-md-on-surface"
      onClick={() => showModal(t.reportTitle, <ReportForm song={song} />, [], {})}
    >
      <Icon name="flag" size={16} />
      {t.reportOpen}
    </button>
  )
}

export function ReportForm({ song }: { song: Song }) {
  const t = useMessages(gameText)
  const { closeModal, addToast } = useUI()
  const [reason, setReason] = useState<string>('year')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  async function send() {
    setBusy(true)
    try {
      await api(`/api/songs/${encodeURIComponent(song.id)}/report`, { method: 'POST', json: { reason, note } })
      await closeModal()
      addToast(t.reportThanks, 'success')
    } catch (e) {
      addToast(apiErrorText(e), 'error')
      setBusy(false)
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        void send()
      }}
    >
      <p className="text-body-md">{t.reportIntro(song.title, song.artist)}</p>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">{t.reportTitle}</legend>
        {REPORT_REASONS.map((r) => (
          <label key={r} className="chip cursor-pointer" data-selected={reason === r}>
            <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="sr-only" />
            {reason === r && <Icon name="check" size={18} />}
            {t[`reason_${r}`]}
          </label>
        ))}
      </fieldset>
      <label className="block">
        <span className="text-label-lg">{t.reportNote}</span>
        <input
          className="field mt-1 w-full"
          value={note}
          maxLength={300}
          placeholder={t.reportNoteHint}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-text m3-state-layer" onClick={() => void closeModal()}>
          {t.reportCancel}
        </button>
        <button type="submit" className="btn btn-filled m3-state-layer" disabled={busy}>
          <Icon name="flag" size={20} />
          {t.reportSend}
        </button>
      </div>
    </form>
  )
}
