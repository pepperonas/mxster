/**
 * Profil — account, appearance, game options, saved players, data, admin.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth, useMe } from '@/auth/AuthContext'
import { useAchievements, useGameHistory, useSettings, useUI } from '@/contexts'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { Avatar } from '@/components/ui/Avatar'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Switch } from '@/components/ui/Switch'
import { toggleThemeWithReveal } from '@/utils/themeReveal'
import { api } from '@/api/client'
import { LegalLinks } from './LegalLinks'

const VERSION = '0.7.1'

export function ProfileScreen() {
  const me = useMe()
  const { logout } = useAuth()
  const navigate = useAppNavigate()
  const { settings, updateSettings } = useSettings()
  const { exportAll } = useGameHistory()
  const { exportAchievements } = useAchievements()
  const { showModal, addToast } = useUI()
  const themeBtn = useRef<HTMLSpanElement>(null)
  const pending = usePendingCount(me.isAdmin)

  const dark = settings.theme === 'dark'
  const toggleTheme = () => {
    const next = dark ? 'light' : 'dark'
    toggleThemeWithReveal(next, () => updateSettings({ theme: next }), themeBtn.current)
  }

  const download = () => {
    const blob = new Blob(
      [JSON.stringify({ exportedAt: new Date().toISOString(), account: me.email, settings, history: JSON.parse(exportAll()), achievements: JSON.parse(exportAchievements()) }, null, 2)],
      { type: 'application/json' }
    )
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `mxster-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const askWipe = () =>
    showModal(
      'Alle Spieldaten löschen?',
      <p className="text-body-lg">Verlauf, Erfolge und Einstellungen dieses Kontos werden endgültig gelöscht. Dein Zugang bleibt bestehen.</p>,
      [
        { text: 'Abbrechen' },
        {
          text: 'Endgültig löschen',
          variant: 'danger',
          onClick: async () => {
            try {
              await api('/api/data', { method: 'DELETE' })
              window.location.reload()
            } catch {
              addToast('Löschen hat nicht geklappt. Bitte versuch es noch einmal.', 'error')
            }
          }
        }
      ]
    )

  return (
    <div className="pt-4 md:pt-10 space-y-6">
      <section className="flex items-center gap-4">
        <Avatar name={me.name} picture={me.picture} size={64} />
        <div className="min-w-0">
          <h1 className="text-headline-sm truncate">{me.name || 'Dein Konto'}</h1>
          <p className="meta truncate">{me.email}</p>
        </div>
      </section>

      {me.isAdmin && (
        <button type="button" className="row m3-state-layer !bg-md-primary-container !text-md-on-primary-container" onClick={() => navigate('/admin')}>
          <Icon name="shield" />
          <span className="flex-1">
            <span className="block text-title-md">Zugänge verwalten</span>
            <span className="block text-body-sm opacity-90">
              {pending === null ? 'Wird geladen …' : pending === 0 ? 'Niemand wartet' : pending === 1 ? '1 Person wartet auf Freischaltung' : `${pending} Personen warten auf Freischaltung`}
            </span>
          </span>
          {!!pending && (
            <span className="grid place-items-center min-w-7 h-7 px-2 rounded-full bg-md-error text-md-on-error text-label-lg tabular">{pending}</span>
          )}
          <Icon name="chevron" />
        </button>
      )}

      <Group title="Darstellung">
        <Item icon={dark ? 'moon' : 'sun'} title="Dunkles Design" text={dark ? 'An' : 'Aus'}>
          <span ref={themeBtn}>
            <Switch checked={dark} onChange={toggleTheme} ariaLabel="Dunkles Design" />
          </span>
        </Item>
      </Group>

      <Group title="Spiel">
        <Item icon="dice" title="Zufällige Startstelle" text="Songs starten irgendwo mittendrin statt am Anfang.">
          <Switch checked={settings.randomStartPosition} onChange={(v) => updateSettings({ randomStartPosition: v })} ariaLabel="Zufällige Startstelle" />
        </Item>
        <Item icon="eye" title="Jahre verdecken" text="Die Jahre auf den Zeitleisten werden unscharf angezeigt.">
          <Switch checked={settings.hideYearsInTimeline} onChange={(v) => updateSettings({ hideYearsInTimeline: v })} ariaLabel="Jahre verdecken" />
        </Item>
      </Group>

      <Group title="Mitspieler">
        <ActionRow icon="groups" title="Spieler verwalten" text="Schnellauswahl, Umbenennen, Zusammenführen und Zahlen je Person." onClick={() => navigate('/spieler')} />
      </Group>

      <Group title="Daten">
        <ActionRow icon="download" title="Daten herunterladen" text="Verlauf, Erfolge und Einstellungen als Datei." onClick={download} />
        <ActionRow icon="delete" title="Alle Spieldaten löschen" text="Setzt Verlauf, Erfolge und Einstellungen zurück." onClick={askWipe} danger />
      </Group>

      <button type="button" className="btn btn-tonal m3-state-layer w-full" onClick={() => void logout()}>
        <Icon name="logout" size={20} />
        Abmelden
      </button>

      <div className="text-center space-y-1 pt-2">
        <p className="meta">mxster {VERSION}</p>
        <LegalLinks />
      </div>
    </div>
  )
}

function usePendingCount(enabled: boolean) {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    if (!enabled) return
    api<{ counts: Record<string, number> }>('/api/admin/users?status=pending')
      .then((r) => setCount(r.counts.pending ?? 0))
      .catch(() => setCount(0))
  }, [enabled])
  return count
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className="text-title-sm text-md-primary px-1 mb-2">{title}</h2>
      <div className="surface overflow-hidden divide-y divide-md-outline-variant/40">{children}</div>
    </section>
  )
}

function Item({ icon, title, text, children }: { icon: IconName; title: string; text: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 min-h-[72px]">
      <Icon name={icon} className="text-md-on-surface-variant shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-body-lg">{title}</p>
        <p className="meta">{text}</p>
      </div>
      {children}
    </div>
  )
}

function ActionRow({ icon, title, text, onClick, danger }: { icon: IconName; title: string; text: string; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`w-full text-left flex items-center gap-4 px-4 py-3 min-h-[72px] m3-state-layer ${danger ? 'text-md-error' : ''}`}>
      <Icon name={icon} className={danger ? '' : 'text-md-on-surface-variant'} />
      <span className="flex-1 min-w-0">
        <span className="block text-body-lg">{title}</span>
        <span className={`block text-body-md ${danger ? 'opacity-80' : 'text-md-on-surface-variant'}`}>{text}</span>
      </span>
    </button>
  )
}
