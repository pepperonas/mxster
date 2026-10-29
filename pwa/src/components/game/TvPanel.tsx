/**
 * "Fernseher verbinden" in a running round: the address to open on the TV
 * (mxtape.celox.io/tv, typeable with a remote), the room code, a QR code for
 * tablets and laptops, and whether a screen is connected. Rendered inline
 * under the header — it reads the room live, which a modal (rendered outside
 * the round) could not.
 */
import { m } from 'motion/react'
import { Icon } from '@/components/ui/Icon'
import { QrCode } from '@/components/ui/QrCode'
import { useMessages } from '@/i18n'
import { roomsText } from '@/i18n/messages/rooms'
import { spring } from '@/motion/springs'

export const formatRoomCode = (code: string) => `${code.slice(0, 4)}-${code.slice(4)}`
/** The address a TV opens; short enough to type with a remote. */
export const tvAddress = () => `${window.location.host}/tv`
export const screenLink = (code: string) => `${window.location.origin}/r/${code}?screen=1`

interface TvPanelProps {
  code: string | null
  /** Name of the connected screen, if one is. */
  screen?: string
  busy?: boolean
  failed?: boolean
  onDisconnect?: () => void
  onClose: () => void
}

export function TvPanel({ code, screen, busy, failed, onDisconnect, onClose }: TvPanelProps) {
  const t = useMessages(roomsText)
  return (
    <m.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: spring.effectsFast }}
      transition={spring.spatialDefault}
      className="surface p-5 sm:p-6"
      aria-label={t.tvTitle}
      data-tv-panel
    >
      <div className="flex items-start gap-3">
        <span className="grid place-items-center w-10 h-10 shrink-0 rounded-m3-full bg-md-secondary-container text-md-on-secondary-container" aria-hidden="true">
          <Icon name="tv" size={22} />
        </span>
        <h2 className="text-title-lg text-md-on-surface flex-1 pt-1.5">{t.tvTitle}</h2>
        <button type="button" className="icon-btn m3-state-layer -mr-2 -mt-1" onClick={onClose} aria-label={t.tvClose}>
          <Icon name="close" />
        </button>
      </div>

      {failed ? (
        <p className="mt-4 text-body-md text-md-error" role="alert">
          {t.tvFailed}
        </p>
      ) : !code || busy ? (
        <p className="mt-4 text-body-md text-md-on-surface-variant" role="status">
          {t.tvPreparing}
        </p>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="min-w-0 space-y-2">
            <p className="text-body-md text-md-on-surface-variant">
              {t.tvStepOpen} <span className="text-md-on-surface font-medium whitespace-nowrap">{tvAddress()}</span> {t.tvStepCode}
            </p>
            <p className="text-poster text-md-on-surface tabular" style={{ fontSize: 'clamp(2rem, 9vw, 2.8rem)' }} data-tv-code>
              {formatRoomCode(code)}
            </p>
            <p
              className={`flex items-center gap-2 text-body-md ${screen ? 'text-md-success' : 'text-md-on-surface-variant'}`}
              role="status"
              data-tv-status={screen ? 'connected' : 'waiting'}
            >
              <Icon name={screen ? 'check' : 'hourglass'} size={18} />
              {screen ? t.tvConnected(screen) : t.tvWaiting}
            </p>
          </div>
          <div className="justify-self-center text-center space-y-2">
            <QrCode value={screenLink(code)} size={132} label={t.tvScan} />
            <p className="text-body-sm text-md-on-surface-variant max-w-[11rem]">{t.tvScan}</p>
          </div>
        </div>
      )}

      {onDisconnect && code && !busy && (
        <div className="mt-4 flex justify-end">
          <button type="button" className="btn btn-text m3-state-layer" onClick={onDisconnect} data-tv-disconnect>
            {t.tvDisconnect}
          </button>
        </div>
      )}
    </m.section>
  )
}
