/**
 * /imprint, /privacy, /terms — readable without an account (the sign-in gate
 * lets these paths through), in the app's language.
 */
import { currentIdx } from '@/navigation/backStack'
const canStepBack = () => (currentIdx() ?? 0) > 0
import { Link, useNavigate } from 'react-router-dom'
import { defineMessages, localeOf, useLang, useMessages } from '@/i18n'
import { Icon } from '@/components/ui/Icon'
import { LanguageSwitch } from '@/components/ui/LanguageSwitch'
import { LEGAL, LEGAL_UPDATED, type Block, type LegalKind } from './content'

export const LEGAL_PATHS: Record<LegalKind, string> = { imprint: '/imprint', privacy: '/privacy', terms: '/terms' }

export const legalText = defineMessages({
  de: {
    back: 'Zurück',
    updated: (date: string) => `Stand: ${date}`,
    imprint: 'Impressum',
    privacy: 'Datenschutz',
    terms: 'Nutzungsbedingungen',
    more: 'Weitere Rechtstexte'
  },
  en: {
    back: 'Back',
    updated: (date: string) => `Last updated: ${date}`,
    imprint: 'Imprint',
    privacy: 'Privacy',
    terms: 'Terms of use',
    more: 'Other legal texts'
  }
})

function Paragraph({ block }: { block: Block }) {
  if (Array.isArray(block)) {
    return (
      <ul className="list-disc pl-5 space-y-1.5 marker:text-md-primary">
        {block.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
  }
  return <p className="whitespace-pre-line">{block}</p>
}

/** Links to the three legal pages, e.g. for footers. */
export function LegalLinks({ className = '' }: { className?: string }) {
  const t = useMessages(legalText)
  return (
    <nav aria-label={t.more} className={`flex flex-wrap justify-center gap-x-4 gap-y-1 text-body-sm text-md-on-surface-variant ${className}`}>
      {(Object.keys(LEGAL_PATHS) as LegalKind[]).map((kind) => (
        <Link key={kind} to={LEGAL_PATHS[kind]} className="underline-offset-4 hover:underline min-h-[48px] inline-flex items-center">
          {t[kind]}
        </Link>
      ))}
    </nav>
  )
}

export function LegalScreen({ kind }: { kind: LegalKind }) {
  const { lang } = useLang()
  const t = useMessages(legalText)
  const navigate = useNavigate()
  const doc = LEGAL[kind][lang]
  const updated = new Intl.DateTimeFormat(localeOf(lang), { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(LEGAL_UPDATED))
  // Back where the reader came from; a page opened directly goes Home in place
  const back = () => (canStepBack() ? navigate(-1) : navigate('/', { replace: true }))

  return (
    <div className="min-h-dvh px-4 sm:px-6 pb-16">
      <header className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-2 sm:px-4 h-16 flex items-center gap-1 bg-md-surface/90 backdrop-blur-md">
        <button type="button" className="icon-btn m3-state-layer" onClick={back} aria-label={t.back}>
          <Icon name="back" />
        </button>
        <span className="text-title-md text-md-on-surface-variant flex-1">mxtape</span>
        <LanguageSwitch />
      </header>
      <main className="mx-auto max-w-2xl">
        <h1 className="text-poster text-md-on-surface mt-4 hyphens-auto break-words" style={{ fontSize: 'clamp(1.7rem, 7vw, 2.8rem)', lineHeight: 1.05 }}>
          {doc.title}
        </h1>
        <p className="meta mt-2">{t.updated(updated)}</p>
        {doc.intro && <p className="text-body-lg text-md-on-surface-variant mt-4">{doc.intro}</p>}
        <div className="mt-8 space-y-8">
          {doc.sections.map((s) => (
            <section key={s.heading} className="space-y-3 text-body-lg text-md-on-surface leading-relaxed">
              <h2 className="text-title-lg">{s.heading}</h2>
              {s.body.map((b, i) => (
                <Paragraph key={i} block={b} />
              ))}
            </section>
          ))}
        </div>
        <LegalLinks className="mt-12 pt-6 border-t border-md-outline-variant" />
      </main>
    </div>
  )
}
