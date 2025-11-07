/**
 * Cookie Consent Banner - 8-Bit Pixel Style
 * GDPR-compliant localStorage notification with accept option
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
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('mxster-cookie-consent', 'accepted')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className={`cookie-banner-8bit ${isVisible ? 'show' : ''}`}>
      {/* 8-Bit Pixel Border */}
      <div className="pixel-border-top"></div>
      <div className="pixel-border-right"></div>
      <div className="pixel-border-bottom"></div>
      <div className="pixel-border-left"></div>

      {/* Pixel Corners */}
      <div className="pixel-corner pixel-corner-tl"></div>
      <div className="pixel-corner pixel-corner-tr"></div>
      <div className="pixel-corner pixel-corner-bl"></div>
      <div className="pixel-corner pixel-corner-br"></div>

      {/* Banner Content */}
      <div className="cookie-content-8bit">
        <div className="cookie-icon-8bit">
          <span className="pixel-emoji">💾</span>
        </div>
        <h2 className="cookie-title-8bit">Speicher-Hinweis</h2>

        <p className="cookie-text-8bit">
          Diese App nutzt <strong>LocalStorage</strong>, um deine Spielstände lokal auf deinem Gerät zu speichern.
          Es werden keine Daten an externe Server gesendet. Die Speicherung ist technisch notwendig,
          damit dein Fortschritt nicht verloren geht.
        </p>

        <div className="cookie-info-box">
          <span className="info-icon">ℹ️</span>
          <span className="info-text">Ohne Speicherung funktioniert die App nicht vollständig.</span>
        </div>

        <button className="cookie-btn-8bit cookie-btn-accept-8bit" onClick={handleAccept}>
          <span className="btn-icon">✓</span>
          <span className="btn-text">Verstanden</span>
        </button>
      </div>
    </div>
  )
}
