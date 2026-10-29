/**
 * App frame for the approved app. Five destinations (the M3 maximum):
 * Spielen · Rückblick (rounds | stats) · Songs · Erfolge · Leute (players |
 * friends). Phones: navigation bar at the bottom, a top bar with the wordmark
 * and the gear to the settings. From 768 px a rail on the left; from 1280 px
 * the rail expands (labels beside the icons) and carries the settings, the
 * admin entry and the avatar at its foot. The running game owns the whole screen.
 */
import { useEffect, useState } from 'react'
import { useGoBack, useStep } from '@/navigation/useGoBack'
import { tabStep } from '@/navigation/backStack'
// Link, not NavLink: NavLink sets aria-current from its own address and would
// drop it on a destination's second tab ("Rückblick" links to /history, active on /stats)
import { Outlet, Link as NavLink, useLocation, matchPath } from 'react-router-dom'
import { m } from 'motion/react'
import type { MouseEvent } from 'react'
import { api } from '@/api/client'
import { useMe } from '@/auth/AuthContext'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Avatar } from '@/components/ui/Avatar'
import { AchievementScoreSync } from '@/components/AchievementScoreSync'
import { prefersReducedMotion } from '@/motion/policy'
import { spring } from '@/motion/springs'
import { useMessages } from '@/i18n'
import { shellText } from '@/i18n/messages/shell'

export interface Destination {
  /** Where a tap goes. */
  to: string
  /** Pages that belong to it (its tabs); pages below them count too. */
  paths: string[]
  label: 'play' | 'review' | 'songs' | 'achievements' | 'people'
  icon: IconName
}

export const DESTINATIONS: Destination[] = [
  { to: '/', paths: ['/'], label: 'play', icon: 'play' },
  { to: '/history', paths: ['/history', '/stats'], label: 'review', icon: 'history' },
  { to: '/songs', paths: ['/songs'], label: 'songs', icon: 'library' },
  { to: '/achievements', paths: ['/achievements'], label: 'achievements', icon: 'trophy' },
  { to: '/players', paths: ['/players', '/friends'], label: 'people', icon: 'groups' }
]

export const SETTINGS_PATH = '/settings'

/** Pages with the navigation around them: every destination's tabs, and the settings. */
export const TOP_LEVEL = [...DESTINATIONS.flatMap((d) => d.paths), SETTINGS_PATH]

export function isActive(dest: Pick<Destination, 'paths'>, pathname: string) {
  return dest.paths.some((p) => (p === '/' ? pathname === '/' : !!matchPath({ path: p, end: false }, pathname)))
}

export function AppShell() {
  const { pathname } = useLocation()
  const isGame = pathname === '/game'
  const isTopLevel = TOP_LEVEL.includes(pathname)

  if (isGame)
    return (
      <>
        <AchievementScoreSync />
        <Outlet />
      </>
    )

  return (
    <div className="min-h-dvh md:pl-24 xl:pl-64">
      <AchievementScoreSync />
      <NavRail />
      {isTopLevel ? <TopBar /> : null}
      <main className={`mx-auto w-full max-w-3xl px-4 sm:px-6 ${isTopLevel ? 'pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pb-2' : 'pb-12'}`}>
        <Outlet />
      </main>
      {isTopLevel && <NavBar />}
    </div>
  )
}

/** Phones: the wordmark, and the gear — one obvious way to the settings (the admin page is reached from there). */
function TopBar() {
  const { pathname } = useLocation()
  const t = useMessages(shellText)
  const onSettings = useTabClick(SETTINGS_PATH)
  const here = pathname === SETTINGS_PATH
  return (
    <header className="sticky top-0 z-30 bg-md-surface/90 backdrop-blur-md md:hidden" style={{ viewTransitionName: 'top-bar' }}>
      <div className="mx-auto max-w-3xl h-16 px-4 flex items-center justify-between">
        <span className="text-poster text-title-lg" style={{ fontSize: '1.6rem' }}>
          mxtape
        </span>
        <NavLink
          to={SETTINGS_PATH}
          onClick={onSettings}
          viewTransition={!prefersReducedMotion()}
          className={`icon-btn m3-state-layer ${here ? 'bg-md-secondary-container text-md-on-secondary-container' : ''}`}
          aria-label={t.settings}
          aria-current={here ? 'page' : undefined}
          data-settings-link
        >
          <Icon name="settings" />
        </NavLink>
      </div>
    </header>
  )
}

/**
 * A plain click on a destination goes through `tabStep` (no stacked pages);
 * modifier clicks (new tab) keep the link's own behaviour.
 */
function useTabClick(to: string) {
  const { pathname } = useLocation()
  const run = useStep()
  return (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    if (to === pathname) return
    run(tabStep(to, pathname, TOP_LEVEL))
  }
}

function NavItem({ dest, pathname, layout }: { dest: Destination; pathname: string; layout: 'bar' | 'rail' }) {
  const active = isActive(dest, pathname)
  const t = useMessages(shellText)
  const onClick = useTabClick(dest.to)
  const rail = layout === 'rail'
  return (
    <NavLink
      to={dest.to}
      onClick={onClick}
      viewTransition={!prefersReducedMotion()}
      className={`group flex flex-col items-center gap-1 min-w-0 flex-1 py-3 outline-none ${
        rail ? 'md:flex-none md:min-w-[64px] md:py-2 xl:flex-row xl:gap-0 xl:w-full xl:py-0' : ''
      }`}
      aria-current={active ? 'page' : undefined}
      data-nav-item={dest.label}
    >
      <span className={`relative grid place-items-center w-14 sm:w-16 h-8 ${rail ? 'xl:w-full xl:h-14 xl:flex xl:items-center xl:gap-3 xl:px-4' : ''}`}>
        {active && (
          <m.span
            layoutId={`nav-pill-${layout}`}
            className="absolute inset-0 rounded-m3-full bg-md-secondary-container"
            transition={spring.spatialFast}
          />
        )}
        {/* No colour fade: icon and label switch with the indicator, not after it */}
        <span className={`relative ${active ? 'text-md-on-secondary-container' : 'text-md-on-surface-variant group-hover:text-md-on-surface'}`}>
          <Icon name={dest.icon} />
        </span>
        {rail && (
          <span className={`relative hidden xl:inline text-label-lg ${active ? 'text-md-on-secondary-container' : 'text-md-on-surface-variant'}`}>
            {t[dest.label]}
          </span>
        )}
      </span>
      <span className={`text-label-md ${rail ? 'xl:hidden' : ''} ${active ? 'text-md-on-surface' : 'text-md-on-surface-variant'}`}>
        {t[dest.label]}
      </span>
    </NavLink>
  )
}

function NavBar() {
  const { pathname } = useLocation()
  const t = useMessages(shellText)
  return (
    <nav
      aria-label={t.mainNav}
      className="fixed inset-x-0 bottom-0 z-40 bg-md-surface-container md:hidden safe-bottom"
      style={{ viewTransitionName: 'nav-bar' }}
    >
      <div className="mx-auto max-w-lg flex justify-around px-1">
        {DESTINATIONS.map((d) => (
          <NavItem key={d.to} dest={d} pathname={pathname} layout="bar" />
        ))}
      </div>
    </nav>
  )
}

function NavRail() {
  const { pathname } = useLocation()
  const t = useMessages(shellText)
  return (
    <nav
      aria-label={t.mainNav}
      className="hidden md:flex fixed inset-y-0 left-0 z-40 w-24 xl:w-64 flex-col items-center xl:items-stretch gap-3 xl:gap-1 pt-6 xl:px-3"
      style={{ viewTransitionName: 'nav-rail' }}
    >
      <span className="text-poster mb-6 xl:px-4" style={{ fontSize: '1.15rem' }}>
        <span className="xl:hidden">mx</span>
        <span className="hidden xl:inline" style={{ fontSize: '1.5rem' }}>
          mxtape
        </span>
      </span>
      {DESTINATIONS.map((d) => (
        <NavItem key={d.to} dest={d} pathname={pathname} layout="rail" />
      ))}
      <RailFoot pathname={pathname} />
    </nav>
  )
}

/** Open sign-up requests, for the admin's badge (null while unknown or not the admin). */
function usePendingRequests(enabled: boolean): number | null {
  const [n, setN] = useState<number | null>(null)
  useEffect(() => {
    if (!enabled) return
    api<{ counts: Record<string, number> }>('/api/admin/users?status=pending')
      .then((r) => setN(r.counts.pending ?? 0))
      .catch(() => setN(null))
  }, [enabled])
  return n
}

/** Foot of the rail: settings, the admin entry (admin only) and the avatar. */
function RailFoot({ pathname }: { pathname: string }) {
  const me = useMe()
  const t = useMessages(shellText)
  const onSettings = useTabClick(SETTINGS_PATH)
  const onAdmin = useTabClick('/admin')
  const pending = usePendingRequests(Boolean(me.isAdmin))
  const here = pathname === SETTINGS_PATH
  const onAdminPage = pathname === '/admin'
  const row = 'flex items-center gap-3 rounded-m3-full m3-state-layer outline-none w-14 h-14 justify-center xl:w-full xl:justify-start xl:px-4'
  return (
    <div className="mt-auto mb-6 flex flex-col items-center xl:items-stretch gap-1">
      {me.isAdmin && (
        <NavLink to="/admin" onClick={onAdmin} viewTransition={!prefersReducedMotion()} className={`${row} relative ${onAdminPage ? 'bg-md-secondary-container text-md-on-secondary-container' : 'text-md-on-surface-variant'}`} aria-label={t.admin} aria-current={onAdminPage ? 'page' : undefined} data-admin-link>
          <Icon name="shield" />
          <span className="hidden xl:inline text-label-lg">{t.admin}</span>
          {!!pending && (
            <span className="absolute top-2 left-8 xl:static xl:ml-auto grid place-items-center min-w-5 h-5 px-1 rounded-full bg-md-error text-md-on-error text-label-sm tabular" aria-label={t.pendingBadge(pending)}>
              {pending}
            </span>
          )}
        </NavLink>
      )}
      <NavLink
        to={SETTINGS_PATH}
        onClick={onSettings}
        viewTransition={!prefersReducedMotion()}
        className={`${row} ${here ? 'bg-md-secondary-container text-md-on-secondary-container' : 'text-md-on-surface-variant'}`}
        aria-label={t.settings}
        aria-current={here ? 'page' : undefined}
        data-settings-link
      >
        <Icon name="settings" />
        <span className="hidden xl:inline text-label-lg">{t.settings}</span>
      </NavLink>
      <NavLink
        to={SETTINGS_PATH}
        onClick={onSettings}
        viewTransition={!prefersReducedMotion()}
        tabIndex={-1}
        aria-hidden="true"
        className="hidden xl:flex items-center gap-3 mt-2 px-3 py-2 rounded-m3-full m3-state-layer"
      >
        <Avatar name={me.name} picture={me.picture} size={36} />
        <span className="min-w-0 truncate text-body-md">{me.name}</span>
      </NavLink>
    </div>
  )
}

/**
 * Small top bar with a back button for pages below a destination.
 * `inRail`: the page also has its own entry in the side rail (the admin page) —
 * from tablet width on, where the rail shows, it is a destination there and
 * gets no back arrow; on phones it is reached from the settings and keeps one.
 */
export function SubPageHeader({ title, back = '/', inRail = false }: { title: string; back?: string; inRail?: boolean }) {
  const goBack = useGoBack()
  const t = useMessages(shellText)
  return (
    <header className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-2 sm:px-4 h-16 flex items-center gap-1 bg-md-surface/90 backdrop-blur-md">
      <button type="button" className={`icon-btn m3-state-layer ${inRail ? 'md:hidden' : ''}`} onClick={() => goBack(back)} aria-label={t.back} data-back>
        <Icon name="back" />
      </button>
      <h1 className={`text-title-lg truncate ${inRail ? 'md:px-2' : ''}`}>{title}</h1>
    </header>
  )
}
