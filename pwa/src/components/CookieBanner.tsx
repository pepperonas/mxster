/**
 * Storage notice — an M3 bottom sheet that springs in after a short delay and
 * leaves on a critically damped spring once acknowledged.
 */
import { useState, useEffect } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { spring } from '@/motion/springs'

const CONSENT_KEY = 'mxster-cookie-consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(CONSENT_KEY)) return
    const timer = window.setTimeout(() => setVisible(true), 1500)
    return () => window.clearTimeout(timer)
  }, [])

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <m.aside
          role="region"
          aria-label="Speicher-Hinweis"
          initial={{ y: 48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 32, opacity: 0, transition: spring.effectsDefault }}
          transition={spring.spatialDefault}
          className="fixed z-[80] bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-md mx-auto rounded-m3-xl bg-md-surface-container-high border border-md-outline-variant/60 shadow-m3-3 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        >
          <div className="flex items-start gap-4">
            <span className="flex-shrink-0 w-11 h-11 grid place-items-center rounded-m3-lg bg-md-secondary-container text-md-on-secondary-container text-xl" aria-hidden="true">
              💾
            </span>
            <div className="min-w-0">
              <h2 className="text-title-md text-text-primary">Speicher-Hinweis</h2>
              <p className="mt-1 text-body-md text-md-on-surface-variant">
                mxster speichert Spielstände, Statistiken und Einstellungen per <strong className="text-text-primary">LocalStorage</strong> nur
                auf deinem Gerät – technisch notwendig, damit dein Fortschritt nicht verloren geht.
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={accept} className="btn btn-accent">
              Verstanden
            </button>
          </div>
        </m.aside>
      )}
    </AnimatePresence>
  )
}
