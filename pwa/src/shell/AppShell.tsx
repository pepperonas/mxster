/**
 * App frame for the approved app: navigation bar (compact) or rail (≥ 840 px)
 * with four destinations, and a top bar on the pages below them. The running
 * game owns the whole screen.
 */
import { Outlet, NavLink, useLocation, matchPath } from 'react-router-dom'
import { m } from 'motion/react'
import { useMe } from '@/auth/AuthContext'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Avatar } from '@/components/ui/Avatar'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { prefersReducedMotion } from '@/motion/policy'
import { spring } from '@/motion/springs'

interface Destination {
  to: string
  label: string
  icon: IconName
}

export const DESTINATIONS: Destination[] = [
  { to: '/', label: 'Spielen', icon: 'play' },
  { to: '/verlauf', label: 'Verlauf', icon: 'history' },
  { to: '/erfolge', label: 'Erfolge', icon: 'trophy' },
  { to: '/profil', label: 'Profil', icon: 'person' }
]

const TOP_LEVEL = DESTINATIONS.map((d) => d.to)

export function AppShell() {
  const { pathname } = useLocation()
  const isGame = pathname === '/spiel'
  const isTopLevel = TOP_LEVEL.includes(pathname)

  if (isGame) return <Outlet />

  return (
    <div className="min-h-dvh md:pl-24">
      <NavRail />
      {isTopLevel ? <TopBar /> : null}
      <main className={`mx-auto w-full max-w-3xl px-4 sm:px-6 ${isTopLevel ? 'pb-32 md:pb-12' : 'pb-12'}`}>
        <Outlet />
      </main>
      {isTopLevel && <NavBar />}
    </div>
  )
}

function TopBar() {
  const me = useMe()
  const navigate = useAppNavigate()
  return (
    <header className="sticky top-0 z-30 bg-md-surface/90 backdrop-blur-md md:hidden" style={{ viewTransitionName: 'top-bar' }}>
      <div className="mx-auto max-w-3xl h-16 px-4 flex items-center justify-between">
        <span className="text-poster text-title-lg" style={{ fontSize: '1.6rem' }}>
          mxster
        </span>
        <button type="button" className="icon-btn m3-state-layer" onClick={() => navigate('/profil')} aria-label="Profil">
          <Avatar name={me.name} picture={me.picture} size={36} />
        </button>
      </div>
    </header>
  )
}

function isActive(to: string, pathname: string) {
  return to === '/' ? pathname === '/' : !!matchPath({ path: to, end: false }, pathname)
}

function NavItem({ dest, pathname, layout }: { dest: Destination; pathname: string; layout: 'bar' | 'rail' }) {
  const active = isActive(dest.to, pathname)
  return (
    <NavLink
      to={dest.to}
      viewTransition={!prefersReducedMotion()}
      className="group flex flex-col items-center gap-1 min-w-[64px] py-3 md:py-2 outline-none"
      aria-current={active ? 'page' : undefined}
    >
      <span className="relative grid place-items-center w-16 h-8">
        {active && (
          <m.span
            layoutId={`nav-pill-${layout}`}
            className="absolute inset-0 rounded-m3-full bg-md-secondary-container"
            transition={spring.spatialFast}
          />
        )}
        <span
          className={`relative transition-colors duration-m3-effects ${
            active ? 'text-md-on-secondary-container' : 'text-md-on-surface-variant group-hover:text-md-on-surface'
          }`}
        >
          <Icon name={dest.icon} />
        </span>
      </span>
      <span className={`text-label-md ${active ? 'text-md-on-surface' : 'text-md-on-surface-variant'}`}>{dest.label}</span>
    </NavLink>
  )
}

function NavBar() {
  const { pathname } = useLocation()
  return (
    <nav
      aria-label="Hauptnavigation"
      className="fixed inset-x-0 bottom-0 z-40 bg-md-surface-container md:hidden safe-bottom"
      style={{ viewTransitionName: 'nav-bar' }}
    >
      <div className="mx-auto max-w-md flex justify-around">
        {DESTINATIONS.map((d) => (
          <NavItem key={d.to} dest={d} pathname={pathname} layout="bar" />
        ))}
      </div>
    </nav>
  )
}

function NavRail() {
  const { pathname } = useLocation()
  return (
    <nav
      aria-label="Hauptnavigation"
      className="hidden md:flex fixed inset-y-0 left-0 z-40 w-24 flex-col items-center gap-3 pt-6 bg-md-surface"
      style={{ viewTransitionName: 'nav-rail' }}
    >
      <span className="text-poster mb-6" style={{ fontSize: '1.15rem' }}>
        mx
      </span>
      {DESTINATIONS.map((d) => (
        <NavItem key={d.to} dest={d} pathname={pathname} layout="rail" />
      ))}
    </nav>
  )
}

/** Small top bar with a back button for pages below a destination. */
export function SubPageHeader({ title, back = '/' }: { title: string; back?: string }) {
  const navigate = useAppNavigate()
  return (
    <header className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-2 sm:px-4 h-16 flex items-center gap-1 bg-md-surface/90 backdrop-blur-md">
      <button type="button" className="icon-btn m3-state-layer" onClick={() => navigate(back)} aria-label="Zurück">
        <Icon name="back" />
      </button>
      <h1 className="text-title-lg truncate">{title}</h1>
    </header>
  )
}
