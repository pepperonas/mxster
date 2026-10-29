/**
 * /about — product page and help in one. Readable without an account (the
 * sign-in gate lets it through), in the app's language, with the app's record,
 * type and colours. A small playable timeline (no music) shows the core rule.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, m } from 'motion/react'
import { Vinyl } from '@/components/ui/Vinyl'
import { Icon, type IconName } from '@/components/ui/Icon'
import { LanguageSwitch } from '@/components/ui/LanguageSwitch'
import { HomeFooter } from '@/components/HomeFooter'
import { useAuth } from '@/auth/AuthContext'
import { useAbout } from '@/i18n/messages/about'
import { allSongs } from '@/data/catalogue'
import { spring } from '@/motion/springs'
import { prefersReducedMotion } from '@/motion/policy'
import { haptic } from '@/utils/haptics'
import { judge, pickRound, type DemoResult, type DemoRound } from './aboutDemo'
import type { Song } from '@/types'

const CONTACT = 'martin.pfeffer@celox.io'

/** Count of songs and decades in the bundled catalogue (exotics included: they are in the game). */
function useCatalogueFacts() {
  return useMemo(() => {
    const songs = allSongs()
    const decades = new Set(songs.map((s) => Math.floor(s.year / 10)))
    return { songs: songs.length, decades: decades.size, from: Math.min(...decades) * 10 }
  }, [])
}

function useCta() {
  const { state } = useAuth()
  const t = useAbout()
  if (state.kind === 'signed-in') return state.me.status === 'approved' ? t.toGame : t.toWaiting
  return t.signIn
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
}

export function AboutScreen() {
  const t = useAbout()
  const cta = useCta()

  useEffect(() => {
    const before = document.title
    document.title = t.title
    return () => {
      document.title = before
    }
  }, [t.title])

  // A deep link (/about#help) lands on its section once the page is laid out
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }))
  }, [])

  return (
    <div className="min-h-dvh" data-about>
      <TopBar cta={cta} />
      <main>
        <Hero cta={cta} />
        <Facts />
        <Steps />
        <Demo />
        <Modes />
        <Ways />
        <Extras />
        <Help />
        <Closing cta={cta} />
      </main>
      <div className="px-4 sm:px-6 pb-8 mx-auto max-w-6xl">
        <HomeFooter />
      </div>
    </div>
  )
}

function TopBar({ cta }: { cta: string }) {
  const t = useAbout()
  const links: [string, string][] = [
    ['how', t.navHow],
    ['modes', t.navModes],
    ['help', t.navHelp]
  ]
  return (
    <header className="sticky top-0 z-30 bg-md-surface/85 backdrop-blur-md" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="mx-auto max-w-6xl h-16 px-3 sm:px-6 flex items-center gap-2">
        <Link to="/" className="text-poster text-md-on-surface text-[1.6rem] leading-none px-2 py-2 rounded-m3-md m3-state-layer" aria-label={t.home}>
          mxtape
        </Link>
        <nav aria-label={t.sections} className="hidden md:flex items-center gap-1 ml-4">
          {links.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault()
                scrollTo(id)
              }}
              className="px-3 min-h-[48px] inline-flex items-center rounded-m3-full text-label-lg text-md-on-surface-variant hover:text-md-on-surface m3-state-layer"
            >
              {label}
            </a>
          ))}
        </nav>
        <span className="flex-1" />
        <LanguageSwitch />
        <Link to="/" className="btn btn-brand m3-state-layer whitespace-nowrap" data-about-cta="top">
          {cta}
        </Link>
      </div>
    </header>
  )
}

function Section({ id, kicker, title, children }: { id?: string; kicker: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-20 px-4 sm:px-6 py-12 sm:py-16 mx-auto max-w-6xl`} aria-labelledby={id ? `${id}-title` : undefined}>
      <p className="text-label-lg text-md-primary uppercase tracking-[0.12em]">{kicker}</p>
      <h2 id={id ? `${id}-title` : undefined} className="text-poster text-md-on-surface mt-2 mb-8 sm:mb-10 hyphens-auto break-words" style={{ fontSize: 'clamp(1.6rem, 7vw, 3.2rem)', lineHeight: 1.02 }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

/* ------------------------------------------------------------------ hero */

function Hero({ cta }: { cta: string }) {
  const t = useAbout()
  return (
    <section className="relative overflow-hidden px-4 sm:px-6 pt-4 sm:pt-14 pb-10 mx-auto max-w-6xl grid lg:grid-cols-[1.15fr_1fr] items-center gap-8 lg:gap-4">
      <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring.spatialDefault, delay: 0.1 }} className="relative z-[1] order-2 lg:order-1">
        <p className="chip w-fit" data-selected="true">
          <Icon name="note" size={18} />
          {t.kicker}
        </p>
        <h1 className="text-poster text-md-on-surface mt-5 whitespace-pre-line hyphens-auto" style={{ fontSize: 'clamp(2.6rem, 9vw, 4.4rem)', lineHeight: 0.98 }}>
          {t.heroTitle}
        </h1>
        <p className="text-body-lg text-md-on-surface-variant mt-6 max-w-[46ch]">{t.heroLead}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/" className="btn btn-lg btn-brand m3-state-layer" data-about-cta="hero">
            <Icon name="play" />
            {cta}
          </Link>
          <button type="button" className="btn btn-lg btn-tonal m3-state-layer" onClick={() => scrollTo('demo')}>
            <Icon name="dice" />
            {t.tryIt}
          </button>
        </div>
      </m.div>
      <HeroArt />
    </section>
  )
}

/** The record turning, with three year cards floating around it (one still a question). */
function HeroArt() {
  const cards: { y: string; cls: string; tone: string }[] = [
    { y: '1977', cls: 'left-[2%] top-[14%] -rotate-[9deg]', tone: 'bg-md-surface-container-high text-md-on-surface' },
    { y: '1994', cls: 'right-[0%] top-[46%] rotate-[7deg]', tone: 'bg-md-tertiary-container text-md-on-tertiary-container' },
    { y: '?', cls: 'left-[10%] bottom-[4%] rotate-[4deg]', tone: 'bg-md-primary-container text-md-on-primary-container' }
  ]
  return (
    <m.div
      className="relative order-1 lg:order-2 mx-auto w-full max-w-[250px] sm:max-w-[400px] lg:max-w-[460px] aspect-square"
      initial={{ opacity: 0, x: 80, rotate: -30 }}
      animate={{ opacity: 1, x: 0, rotate: 0 }}
      transition={spring.spatialSlow}
      aria-hidden="true"
    >
      <div className="absolute inset-[6%]">
        <Vinyl size="100%" spinning />
      </div>
      {cards.map((c, i) => (
        <span
          key={c.y}
          className={`about-float absolute ${c.cls} ${c.tone} num-poster rounded-m3-lg shadow-lg px-4 py-3 text-[clamp(1.4rem,5vw,2.2rem)] leading-none`}
          style={{ ['--i' as string]: i }}
        >
          {c.y}
        </span>
      ))}
    </m.div>
  )
}

function Facts() {
  const t = useAbout()
  const { songs, decades, from } = useCatalogueFacts()
  const items = t.stats(songs, decades, from)
  return (
    <div className="px-4 sm:px-6 mx-auto max-w-6xl">
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-3" data-about-facts>
        {items.map((it) => (
          <div key={it.l} className="rounded-m3-xl bg-md-surface-container-low px-5 py-4">
            <dt className="sr-only">{it.l}</dt>
            <dd>
              <span className="num-poster block text-md-primary text-[clamp(2rem,7vw,2.8rem)] leading-none">{it.n}</span>
              <span className="block text-body-md text-md-on-surface-variant mt-2">{it.l}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/* ------------------------------------------------------------------ steps */

function Steps() {
  const t = useAbout()
  return (
    <Section id="how" kicker={t.howKicker} title={t.howTitle}>
      <ol className="grid md:grid-cols-3 gap-4">
        {t.steps.map((s, i) => (
          <li key={s.t} className="relative rounded-m3-xl bg-md-surface-container-low p-6 overflow-hidden">
            <span className="num-poster absolute -right-2 -top-4 text-[6rem] leading-none text-md-primary/10 select-none" aria-hidden="true">
              {i + 1}
            </span>
            <StepArt step={i} />
            <h3 className="text-title-lg text-md-on-surface mt-5">
              <span className="sr-only">{i + 1}. </span>
              {s.t}
            </h3>
            <p className="text-body-md text-md-on-surface-variant mt-2">{s.p}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}

/** A small picture per step: the record, a timeline with a gap, the revealed year. */
function StepArt({ step }: { step: number }) {
  if (step === 0) {
    return (
      <span className="block h-16" aria-hidden="true">
        <Vinyl size={64} spinning />
      </span>
    )
  }
  if (step === 1) {
    return (
      <span className="flex items-center gap-1.5 h-16" aria-hidden="true" data-step-art="timeline">
        <span className="num-poster rounded-m3-sm bg-md-surface-container-high text-md-on-surface px-2 py-1.5 text-[1rem]">1969</span>
        <span className="about-float num-poster rounded-m3-sm border-2 border-dashed border-md-primary text-md-primary px-3 py-1 text-[1rem]">?</span>
        <span className="num-poster rounded-m3-sm bg-md-surface-container-high text-md-on-surface px-2 py-1.5 text-[1rem]">1991</span>
      </span>
    )
  }
  return (
    <span className="flex items-center h-16" aria-hidden="true" data-step-art="reveal">
      <span className="inline-flex items-center gap-2 rounded-m3-md bg-md-success-container text-md-on-success-container px-3 py-2">
        <span className="num-poster text-[1.4rem] leading-none">1985</span>
        <Icon name="check" size={22} />
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------ demo */

function Demo() {
  const t = useAbout()
  const recent = useRef(new Set<string>())
  const draw = () => {
    const r = pickRound(allSongs(), Math.random, recent.current)
    if (r) [r.card, ...r.timeline].forEach((s) => recent.current.add(s.id))
    if (recent.current.size > 60) recent.current = new Set([...recent.current].slice(-20))
    return r
  }
  const [round, setRound] = useState<DemoRound | null>(draw)
  const [result, setResult] = useState<(DemoResult & { chosen: number }) | null>(null)
  const [score, setScore] = useState({ right: 0, played: 0 })
  const feedback = useRef<HTMLParagraphElement>(null)

  if (!round) return null

  const where = (gap: number, list: Song[]) =>
    gap <= 0 ? t.demoFirst : gap >= list.length ? t.demoLast : t.demoBetween(list[gap - 1].year, list[gap].year)

  const choose = (gap: number) => {
    const r = judge(round, gap)
    setResult({ ...r, chosen: gap })
    setScore((s) => ({ right: s.right + (r.right ? 1 : 0), played: s.played + 1 }))
    haptic(r.right ? 'success' : 'miss')
    requestAnimationFrame(() => feedback.current?.focus())
  }
  const next = () => {
    setResult(null)
    setRound(draw())
  }

  const list = result ? result.settled : round.timeline

  return (
    <Section id="demo" kicker={t.demoKicker} title={t.demoTitle}>
      <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-8 items-start">
        <div>
          <p className="text-body-lg text-md-on-surface-variant max-w-[44ch]">{t.demoLead}</p>
          {score.played > 0 && (
            <p className="mt-4 text-title-md text-md-on-surface" aria-live="polite" data-demo-score>
              {t.demoScore(score.right, score.played)}
            </p>
          )}
        </div>

        <div className="rounded-m3-xxl bg-md-surface-container p-4 sm:p-6" data-demo>
          {!result && (
            <m.div
              key={round.card.id}
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="flex items-center gap-4 rounded-m3-lg bg-md-primary-container text-md-on-primary-container px-4 py-3 mb-4 ring-2 ring-md-primary/40"
              data-demo-card
            >
              <span className="relative shrink-0 w-12 h-12" aria-hidden="true">
                <Vinyl size={48} spinning />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-label-md opacity-80">{t.demoCard}</span>
                <span className="block text-title-md truncate">{round.card.title}</span>
                <span className="block text-body-md truncate opacity-90">{round.card.artist}</span>
              </span>
              <span className="num-poster text-[2rem] leading-none" aria-hidden="true">?</span>
            </m.div>
          )}

          <ol className="space-y-2">
            {!result && <GapButton label={t.demoPlace(where(0, list))} onClick={() => choose(0)} />}
            {list.map((s, i) => (
              <m.li key={s.id} layout={!prefersReducedMotion()} transition={spring.spatialDefault} className="list-none space-y-2">
                <DemoCard song={s} state={result && s.id === round.card.id ? (result.right ? 'right' : 'wrong') : 'plain'} />
                {!result && <GapButton label={t.demoPlace(where(i + 1, list))} onClick={() => choose(i + 1)} />}
              </m.li>
            ))}
          </ol>

          <AnimatePresence>
            {result && (
              <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 flex flex-wrap items-center gap-3">
                <p
                  ref={feedback}
                  tabIndex={-1}
                  role="status"
                  className={`flex-1 min-w-[14rem] text-title-md outline-none ${result.right ? 'text-md-success' : 'text-md-error'}`}
                  data-demo-result={result.right ? 'right' : 'wrong'}
                >
                  {result.right ? t.demoRight(round.card.year) : t.demoWrong(round.card.year, where(result.gap, round.timeline))}
                </p>
                <button type="button" className="btn btn-filled m3-state-layer" onClick={next}>
                  <Icon name="replay" />
                  {t.demoNext}
                </button>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Section>
  )
}

function GapButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="about-gap group w-full min-h-[48px] flex items-center gap-3 px-4 rounded-m3-lg border-2 border-dashed border-md-outline-variant text-label-lg text-md-on-surface-variant hover:border-md-primary hover:text-md-primary focus-visible:border-md-primary focus-visible:text-md-primary m3-state-layer"
      data-demo-gap
    >
      <Icon name="add" size={20} />
      <span className="text-left">{label}</span>
    </button>
  )
}

function DemoCard({ song, state }: { song: Song; state: 'plain' | 'right' | 'wrong' }) {
  const tone =
    state === 'right'
      ? 'bg-md-success-container text-md-on-success-container'
      : state === 'wrong'
        ? 'bg-md-error-container text-md-on-error-container'
        : 'bg-md-surface-container-high text-md-on-surface'
  return (
    <div className={`flex items-center gap-4 rounded-m3-lg px-4 py-3 ${tone}`} data-demo-row={state}>
      <span className={`num-poster w-[3.6ch] shrink-0 text-[1.6rem] leading-none ${state === 'plain' ? 'text-md-primary' : ''}`}>{song.year}</span>
      <span className="min-w-0">
        <span className="block text-title-sm truncate">{song.title}</span>
        <span className={`block text-body-sm truncate ${state === 'plain' ? 'text-md-on-surface-variant' : 'opacity-90'}`}>{song.artist}</span>
      </span>
      {state !== 'plain' && <Icon name={state === 'right' ? 'check' : 'close'} className="ml-auto shrink-0" />}
    </div>
  )
}

/* ------------------------------------------------------------------ modes, ways, extras */

function FeatureCard({ icon, title, text, big }: { icon: string; title: string; text: string; big?: boolean }) {
  return (
    <li className={`rounded-m3-xl bg-md-surface-container-low ${big ? 'p-6' : 'p-5'} list-none`}>
      <span className={`grid place-items-center rounded-m3-full bg-md-secondary-container text-md-on-secondary-container ${big ? 'w-12 h-12' : 'w-10 h-10'}`}>
        <Icon name={icon as IconName} size={big ? 24 : 22} />
      </span>
      <h3 className={`${big ? 'text-title-lg mt-5' : 'text-title-md mt-4'} text-md-on-surface`}>{title}</h3>
      <p className="text-body-md text-md-on-surface-variant mt-2">{text}</p>
    </li>
  )
}

function Modes() {
  const t = useAbout()
  return (
    <Section id="modes" kicker={t.modesKicker} title={t.modesTitle}>
      <ul className="grid md:grid-cols-3 gap-4">
        {t.modes.map((x) => (
          <FeatureCard key={x.t} icon={x.icon} title={x.t} text={x.p} big />
        ))}
      </ul>
      <p className="text-body-md text-md-on-surface-variant mt-6 max-w-[60ch]">{t.modesNote}</p>
    </Section>
  )
}

function Ways() {
  const t = useAbout()
  return (
    <Section id="together" kicker={t.waysKicker} title={t.waysTitle}>
      <ul className="grid sm:grid-cols-2 gap-4">
        {t.ways.map((x) => (
          <FeatureCard key={x.t} icon={x.icon} title={x.t} text={x.p} big />
        ))}
      </ul>
    </Section>
  )
}

function Extras() {
  const t = useAbout()
  return (
    <Section id="extras" kicker={t.extrasKicker} title={t.extrasTitle}>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {t.extras.map((x) => (
          <FeatureCard key={x.t} icon={x.icon} title={x.t} text={x.p} />
        ))}
      </ul>
    </Section>
  )
}

/* ------------------------------------------------------------------ help */

function Help() {
  const t = useAbout()
  return (
    <Section id="help" kicker={t.helpKicker} title={t.helpTitle}>
      <div className="space-y-2" data-about-faq>
        {t.faq.map((f) => (
          <details key={f.q} className="about-faq group rounded-m3-lg bg-md-surface-container-low open:bg-md-surface-container">
            <summary className="flex items-center gap-4 min-h-[56px] px-5 py-3 cursor-pointer list-none text-title-md text-md-on-surface m3-state-layer rounded-m3-lg">
              <span className="flex-1">{f.q}</span>
              <span className="about-faq-chev shrink-0 text-md-on-surface-variant" aria-hidden="true">
                <Icon name="chevron" />
              </span>
            </summary>
            <div className="px-5 pb-5 space-y-3 text-body-lg text-md-on-surface-variant max-w-[68ch]">
              {f.a.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </details>
        ))}
      </div>
      <p className="mt-8 text-body-lg text-md-on-surface-variant">
        {t.helpMore}{' '}
        <a href={`mailto:${CONTACT}?subject=mxtape`} className="text-md-primary underline underline-offset-4 inline-flex items-center min-h-[48px]">
          {t.helpMail}
        </a>
      </p>
    </Section>
  )
}

/* ------------------------------------------------------------------ closing */

function Closing({ cta }: { cta: string }) {
  const t = useAbout()
  return (
    <section className="px-4 sm:px-6 py-10 mx-auto max-w-6xl">
      <div className="relative overflow-hidden rounded-m3-xxl bg-md-primary-container text-md-on-primary-container px-6 sm:px-10 py-10 sm:py-14">
        <div className="absolute -right-24 -bottom-24 sm:-right-16 sm:-bottom-32 opacity-90 pointer-events-none" aria-hidden="true">
          <Vinyl size="min(70vw, 340px)" spinning />
        </div>
        <div className="relative max-w-[30ch]">
          <h2 className="text-poster hyphens-auto" style={{ fontSize: 'clamp(1.9rem, 6vw, 3rem)', lineHeight: 1.02 }}>
            {t.ctaTitle}
          </h2>
          <p className="text-body-lg mt-3 opacity-90">{t.ctaLead}</p>
          <Link to="/" className="btn btn-lg btn-brand m3-state-layer mt-7" data-about-cta="closing">
            <Icon name="play" />
            {cta}
          </Link>
        </div>
      </div>
      <p className="text-body-sm text-md-on-surface-variant mt-4 text-center">{t.allSongsNote}</p>
    </section>
  )
}
