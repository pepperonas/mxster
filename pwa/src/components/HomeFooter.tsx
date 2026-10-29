/**
 * Footer of the home page: three ways to say thanks — the code on GitHub, a
 * donation by PayPal, a review on Google Maps — then the legal pages, the
 * version and who made it.
 *
 * Each tile has its own small motion on hover, keyboard focus or tap, drawn
 * from what it links to: a commit graph that grows on the GitHub tile, a heart
 * that fills up and beats on the donation tile, five stars that light up one
 * by one on the review tile. Pure CSS (motion.css, „Home footer“); with reduced
 * motion the tiles show their end state without moving.
 */
import type { ReactNode } from 'react'
import { LegalLinks } from '@/legal/LegalScreen'
import { VERSION } from '@/screens/ProfileScreen'
import { useMessages } from '@/i18n'
import { homeText } from '@/i18n/messages/home'

export const REPO_URL = 'https://github.com/pepperonas/mxtape'
export const DONATE_URL = 'https://www.paypal.com/donate/?business=martin.pfeffer@celox.io&currency_code=EUR&item_name=mxtape'
export const REVIEW_URL = 'https://g.page/r/CXgdRV3QysvxEBM/review'

function Tile({ href, kind, title, text, art }: { href: string; kind: 'code' | 'give' | 'rate'; title: string; text: string; art: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mx-thanks group relative flex items-center gap-4 min-h-[72px] px-4 py-3 rounded-m3-xl bg-md-surface-container-low m3-state-layer outline-none overflow-hidden"
      data-thanks={kind}
    >
      <span className="mx-thanks-art shrink-0 grid place-items-center w-14 h-12" aria-hidden="true">
        {art}
      </span>
      <span className="min-w-0">
        <span className="block text-title-sm text-md-on-surface">{title}</span>
        <span className="block text-body-sm text-md-on-surface-variant">{text}</span>
      </span>
      <svg className="mx-thanks-out ml-auto shrink-0 text-md-on-surface-variant" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3zM5 5h6v2H7v10h10v-4h2v6H5V5z" fill="currentColor" />
      </svg>
    </a>
  )
}

/** GitHub mark and a small commit graph beside it: the branch draws itself, three commits pop up. */
function CodeArt() {
  return (
    <svg viewBox="0 0 56 48" width="56" height="48" className="overflow-visible">
      <path
        fill="currentColor"
        className="mx-code-mark text-md-on-surface"
        d="M12 8.6a10.4 10.4 0 0 0-3.29 20.27c.52.1.71-.23.71-.5v-1.77c-2.9.63-3.51-1.4-3.51-1.4-.47-1.2-1.15-1.52-1.15-1.52-.95-.65.07-.64.07-.64 1.05.08 1.6 1.08 1.6 1.08.93 1.6 2.44 1.14 3.04.87.09-.68.36-1.14.66-1.4-2.31-.26-4.75-1.16-4.75-5.15 0-1.14.41-2.07 1.07-2.8-.1-.26-.47-1.32.1-2.75 0 0 .88-.28 2.87 1.07a9.9 9.9 0 0 1 5.22 0c1.99-1.35 2.86-1.07 2.86-1.07.57 1.43.21 2.49.1 2.75.67.73 1.07 1.66 1.07 2.8 0 4-2.44 4.88-4.76 5.14.37.32.71.96.71 1.93v2.86c0 .28.19.6.72.5A10.4 10.4 0 0 0 12 8.6z"
      />
      <g className="mx-code-graph text-md-primary">
        <path className="mx-code-branch" d="M30 40 V10 M30 30 C30 24 44 26 44 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" pathLength="1" />
        <circle className="mx-code-dot" style={{ ['--i' as string]: 0 }} cx="30" cy="38" r="3.2" fill="currentColor" />
        <circle className="mx-code-dot" style={{ ['--i' as string]: 1 }} cx="30" cy="24" r="3.2" fill="currentColor" />
        <circle className="mx-code-dot" style={{ ['--i' as string]: 2 }} cx="44" cy="17" r="3.2" fill="currentColor" />
      </g>
    </svg>
  )
}

/** A heart outline that fills from below like a glass, then beats once. */
function GiveArt() {
  const heart = 'M24 41.5l-2.9-2.64C10.8 29.5 4 23.34 4 15.75 4 9.59 8.84 4.75 15 4.75c3.48 0 6.82 1.62 9 4.18 2.18-2.56 5.52-4.18 9-4.18 6.16 0 11 4.84 11 11 0 7.59-6.8 13.75-17.1 23.11L24 41.5z'
  return (
    <svg viewBox="0 0 48 46" width="44" height="42" className="mx-give-heart overflow-visible">
      {/* one clip id per page is enough: the footer exists once */}
      <defs>
        <clipPath id="mx-give-clip">
          <path d={heart} />
        </clipPath>
      </defs>
      <g clipPath="url(#mx-give-clip)">
        {/* the liquid: a wavy surface (twice the heart's width, sliding sideways) over a solid body */}
        <g className="mx-give-liquid">
          <path className="mx-give-wave" d="M-48 4 q6 -4 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 V60 H-48 z" fill="rgb(var(--mx-brand))" />
        </g>
      </g>
      <path d={heart} fill="none" stroke="currentColor" strokeWidth="2.4" className="text-md-on-surface" />
    </svg>
  )
}

/** Five stars that light up one after another. */
function RateArt() {
  const star = 'M5 0.6l1.47 2.98 3.29.48-2.38 2.32.56 3.28L5 8.12 2.06 9.66l.56-3.28L.24 4.06l3.29-.48z'
  return (
    <svg viewBox="-1 -10 58 30" width="58" height="30" className="overflow-visible">
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(${i * 11.4} 0)`}>
          <path className="mx-rate-star" style={{ ['--i' as string]: i }} d={star} fill="currentColor" stroke="currentColor" strokeWidth="0.6" strokeLinejoin="round" />
        </g>
      ))}
    </svg>
  )
}

export function HomeFooter() {
  const t = useMessages(homeText)
  return (
    <footer className="pt-6 space-y-5" data-home-footer>
      <h2 className="sr-only">{t.footerTitle}</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile href={REPO_URL} kind="code" title={t.footerCode} text={t.footerCodeText} art={<CodeArt />} />
        <Tile href={DONATE_URL} kind="give" title={t.footerGive} text={t.footerGiveText} art={<GiveArt />} />
        <Tile href={REVIEW_URL} kind="rate" title={t.footerRate} text={t.footerRateText} art={<RateArt />} />
      </div>
      <div className="text-center space-y-1">
        <LegalLinks />
        <p className="text-body-sm text-md-on-surface-variant">
          mxtape {VERSION} · © {new Date().getFullYear()}{' '}
          <a href="https://celox.io" target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
            celox.io
          </a>
        </p>
      </div>
    </footer>
  )
}
