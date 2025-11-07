/**
 * Cookie Consent Banner
 * GDPR-compliant cookie notification with accept/decline options
 */

import { useState, useEffect } from 'react'

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('mxster-cookie-consent')
    if (!cookieConsent) {
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('mxster-cookie-consent', 'accepted')
    setIsVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem('mxster-cookie-consent', 'declined')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className={`cookie-banner ${isVisible ? 'show' : ''}`}>
      {/* Decorative Corners */}
      <div className="cookie-corner cookie-corner-tl"></div>
      <div className="cookie-corner cookie-corner-tr"></div>
      <div className="cookie-corner cookie-corner-bl"></div>
      <div className="cookie-corner cookie-corner-br"></div>

      {/* Banner Content */}
      <div className="cookie-header">
        <div className="cookie-icon">
          <span className="cookie-emoji">🍪</span>
        </div>
        <h2 className="cookie-title">Cookie Hinweis</h2>
      </div>

      <p className="cookie-text">
        Wir verwenden Cookies und LocalStorage, um deine Spielstände zu speichern und die
        Funktionalität unserer Website zu gewährleisten. Durch die weitere Nutzung stimmst
        du der Verwendung von Cookies zu.
      </p>

      <div className="cookie-buttons">
        <button className="cookie-btn cookie-btn-accept" onClick={handleAccept}>
          ✓ Akzeptieren
        </button>
        <button className="cookie-btn cookie-btn-decline" onClick={handleDecline}>
          ✕ Ablehnen
        </button>
      </div>
    </div>
  )
}
