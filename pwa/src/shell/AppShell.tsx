/**
 * App frame for the approved app: navigation bar (compact) or rail (≥ 768 px)
 * with five destinations (the M3 maximum), and a top bar on the pages below
 * them. The profile sits behind the avatar — top bar on phones, foot of the
 * rail on larger screens. The running game owns the whole screen.
 */
import { Outlet, NavLink, useLocation, matchPath } from 'react-router-dom'
import { m } from 'motion/react'
import { useMe } from '@/auth/AuthContext'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Avatar } from '@/components/ui/Avatar'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { prefersReducedMotion } from '@/motion/policy'
import { spring } from '@/motion/springs'
import { useMessages } from '@/i18n'
import { shellText } from '@/i18n/messages/shell'

interface Destination {
  to: string
  label: 'play' | 'history' | 'stats' | 'players' | 'achievements'
  icon: IconName
}

export const DESTINATIONS: Destination[] = [
  { to: '/', label: 'play', icon: 'play' },
  { to: '/history', label: 'history', icon: 'history' },
  { to: '/stats', label: 'stats', icon: 'insights' },
  { to: '/players', label: 'players', icon: 'groups' },
  { to: '/achievements', label: 'achievements', icon: 'trophy' }
]

// The profile is reached through the avatar but keeps the navigation around it
const TOP_LEVEL = [...DESTINATIONS.map((d) => d.to), '/profile']

export function AppShell() {
  const { pathname } = useLocation()
  const isGame = pathname === '/game'
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
  const t = useMessages(shellText)
  return (
    <header className="sticky top-0 z-30 bg-md-surface/90 backdrop-blur-md md:hidden" style={{ viewTransitionName: 'top-bar' }}>
      <div className="mx-auto max-w-3xl h-16 px-4 flex items-center justify-between">
        <span className="text-poster text-title-lg" style={{ fontSize: '1.6rem' }}>
          mxtape
        </span>
        <button type="button" className="icon-btn m3-state-layer" onClick={() => navigate('/profile')} aria-label={t.profile}>
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
  const t = useMessages(shellText)
  return (
    <NavLink
      to={dest.to}
      viewTransition={!prefersReducedMotion()}
      className="group flex flex-col items-center gap-1 min-w-0 flex-1 md:flex-none md:min-w-[64px] py-3 md:py-2 outline-none"
      aria-current={active ? 'page' : undefined}
    >
      <span className="relative grid place-items-center w-14 sm:w-16 h-8">
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
      <span className={`text-label-md ${active ? 'text-md-on-surface' : 'text-md-on-surface-variant'}`}>{t[dest.label]}</span>
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
      className="hidden md:flex fixed inset-y-0 left-0 z-40 w-24 flex-col items-center gap-3 pt-6"
      style={{ viewTransitionName: 'nav-rail' }}
    >
      <span className="text-poster mb-6" style={{ fontSize: '1.15rem' }}>
        mx
      </span>
      {DESTINATIONS.map((d) => (
        <NavItem key={d.to} dest={d} pathname={pathname} layout="rail" />
      ))}
      <ProfileButton active={pathname === '/profile'} />
    </nav>
  )
}

/** Avatar at the foot of the rail: the way to the profile on larger screens. */
function ProfileButton({ active }: { active: boolean }) {
  const me = useMe()
  const t = useMessages(shellText)
  return (
    <NavLink
      to="/profile"
      viewTransition={!prefersReducedMotion()}
      aria-label={t.profile}
      aria-current={active ? 'page' : undefined}
      className="mt-auto mb-6 grid place-items-center w-14 h-14 rounded-full m3-state-layer outline-none"
    >
      <span className={`rounded-full p-0.5 ${active ? 'ring-2 ring-md-primary' : ''}`}>
        <Avatar name={me.name} picture={me.picture} size={40} />
      </span>
    </NavLink>
  )
}

/** Small top bar with a back button for pages below a destination. */
export function SubPageHeader({ title, back = '/' }: { title: string; back?: string }) {
  const navigate = useAppNavigate()
  const t = useMessages(shellText)
  return (
    <header className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-2 sm:px-4 h-16 flex items-center gap-1 bg-md-surface/90 backdrop-blur-md">
      <button type="button" className="icon-btn m3-state-layer" onClick={() => navigate(back)} aria-label={t.back}>
        <Icon name="back" />
      </button>
      <h1 className="text-title-lg truncate">{title}</h1>
    </header>
  )
}
