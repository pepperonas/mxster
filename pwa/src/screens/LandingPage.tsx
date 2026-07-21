/**
 * Landing Page
 * Complete marketing page for mxster game - like https://mxster.de/
 */

import { useState } from 'react'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { useSpotifyAuth } from '@/hooks'
import { songs } from '@/data/songs'
import { PasswordProtectionDialog } from '@/components/PasswordProtectionDialog'
import spotifySlots from '../../spotify.slots.json'

export function LandingPage() {
  const navigate = useAppNavigate()
  const { login, isLoggedIn } = useSpotifyAuth()
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  const handlePlayWithoutSpotify = () => {
    // Check if access already granted
    const accessGranted = localStorage.getItem('audio_access_granted')

    if (accessGranted === 'true') {
      // Already unlocked - proceed directly
      localStorage.setItem('audio_mode_preference', 'preview')
      console.log('🎵 Starting in Standard Audio Mode (128 kbps MP3, unlimited users)')
      navigate('/mode-selection')
    } else {
      // Show password dialog
      setShowPasswordDialog(true)
    }
  }

  const handleLogin = async () => {
    const storedToken = localStorage.getItem('spotify_auth_tokens')

    if (storedToken && isLoggedIn) {
      console.log('✅ Already logged in, navigating to mode selection')
      // Set Spotify mode preference
      localStorage.setItem('audio_mode_preference', 'spotify')
      navigate('/mode-selection')
    } else {
      console.log('🔑 Starting Spotify login...')
      localStorage.setItem('audio_mode_preference', 'spotify')
      await login()
    }
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const songCount = songs.length

  return (
    <div className="min-h-screen pt-28 pb-0 relative z-10">
      {/* Hero Section */}
      <section className="container mx-auto px-4 max-w-6xl mb-12">
        <div className="text-center mb-12 animate-fade-in">
          {/* Logo / Title */}
          <h1 className="text-display-sm sm:text-display-md md:text-display-lg text-emphasized text-gradient mb-4">
            mxster
          </h1>
          <p className="text-title-lg text-text-secondary mb-6">
            🎵 Deine Zeitreise durch die Musik - {songCount} Songs verfügbar
          </p>
          <p className="text-text-secondary max-w-2xl mx-auto leading-relaxed mb-8">
            Rate Songs, ordne sie chronologisch und teste dein Musikwissen.
            Das ultimative Multiplayer-Musikquiz mit Spotify-Integration.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 justify-center items-center">
            {/* Primary: Play without Spotify (Unlimited Users) */}
            <button
              onClick={handlePlayWithoutSpotify}
              className="btn btn-accent px-10 py-4 text-lg min-h-[48px] shadow-glow-accent w-full sm:w-auto group"
            >
              <span>🎮</span>
              Jetzt spielen (Gratis)
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>

            {/* Secondary: Spotify Premium */}
            <button
              onClick={handleLogin}
              className="btn btn-outline px-10 py-4 text-lg min-h-[48px] w-full sm:w-auto group"
            >
              <span>🎧</span>
              Mit Spotify Premium
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>

            {/* Info Link */}
            <button
              onClick={() => scrollToSection('audio-modes')}
              className="text-sm text-text-secondary hover:text-secondary underline min-h-[48px] inline-flex items-center justify-center"
            >
              Was ist der Unterschied?
            </button>
          </div>
        </div>
      </section>

      {/* Audio Modes Comparison */}
      <section className="container mx-auto px-4 max-w-6xl mb-12" id="audio-modes">
        <div className="card p-8 rounded-m3-xl">
          <h2 className="text-headline-lg text-emphasized text-gradient mb-6 text-center">
            🎵 Zwei Audio-Modi zur Auswahl
          </h2>

          <div className="grid md:grid-cols-2 gap-6 stagger-children">
            {/* Standard Audio Mode (Free) */}
            <div className="card card-glow p-6 rounded-m3-lg bg-accent/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">🎮</div>
                <div>
                  <h3 className="text-title-lg text-emphasized text-text-primary">Gratis-Modus</h3>
                  <p className="text-sm text-secondary">Volle Songs · 128 kbps · Unbegrenzt</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-text-secondary mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Kein Spotify-Login nötig</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Unbegrenzte Spieler</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Sofort spielbereit</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Volle Songs (128 kbps MP3)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Gute Audioqualität für Quiz-Spiele</span>
                </div>
              </div>

              {/* YDL Legal Grey Area Disclaimer */}
              <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-m3-md mb-3">
                <p className="text-xs sm:text-sm text-orange-300">
                  <strong>⚠️ Rechtlicher Hinweis:</strong><br/>
                  Die Audiodateien wurden von YouTube heruntergeladen (ydl).
                  Die Nutzung liegt in einer rechtlichen Grauzone und erfolgt auf eigene Verantwortung.
                  Nur für private, nicht-kommerzielle Zwecke.
                </p>
              </div>

              <div className="text-xs text-text-secondary border-t border-accent/20 pt-3">
                💡 Empfohlen für die meisten Spieler - perfekt für spontane Runden
              </div>
            </div>

            {/* Spotify Premium Mode */}
            <div className="card p-6 rounded-m3-lg bg-secondary/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">🎧</div>
                <div>
                  <h3 className="text-title-lg text-emphasized text-text-primary">Spotify Premium</h3>
                  <p className="text-sm text-secondary">Volle Songs · 320 kbps · Max 25 Spieler</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-text-secondary mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Volle Songs (unbegrenzte Länge)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Höchste Audioqualität (320 kbps)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>100% legal über Spotify API</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-orange-500">⚠</span>
                  <span>Spotify Premium Account nötig</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-orange-500">⚠</span>
                  <span>Nur {spotifySlots.availableSlots}/{spotifySlots.totalSlots} Slots verfügbar</span>
                </div>
              </div>

              <div className="border-t border-secondary/20 pt-3 space-y-3">
                {/* Spotify API Limitation Explanation */}
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-m3-md">
                  <p className="text-sm text-blue-300 mb-2">
                    <strong>🚧 Spotify API Hürde:</strong>
                  </p>
                  <ul className="text-xs text-blue-200 space-y-1 list-disc list-inside">
                    <li><strong>Development Mode:</strong> Max 25 Nutzer (aktuell aktiv)</li>
                    <li><strong>Extended Quota Mode:</strong> Benötigt registrierte Firma + 250.000+ Nutzer</li>
                    <li><strong>Indie-Sperre:</strong> Seit Mai 2025 keine Anträge von Einzelpersonen möglich</li>
                  </ul>
                  <p className="text-xs text-blue-200 mt-2 italic">
                    Das ist absurd: Von 25 direkt auf 250.000 - kein organisches Wachstum möglich.
                    Spotify blockiert damit kreative Indie-Projekte systematisch.
                  </p>
                </div>

                {/* Registration CTA */}
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-m3-md">
                  <p className="text-sm text-green-300 mb-2">
                    <strong>✉️ Möchtest du einen Spotify-Slot?</strong>
                  </p>
                  <p className="text-xs text-green-200 mb-3">
                    Noch {spotifySlots.availableSlots} von {spotifySlots.totalSlots} Slots frei.
                    Sende einfach die E-Mail-Adresse deines Spotify-Kontos.
                  </p>
                  <a
                    href={`mailto:${spotifySlots.contactEmail}?subject=Spotify%20Premium%20Zugang%20für%20mxster&body=Hallo%20Martin,%0D%0A%0D%0Aich%20würde%20gerne%20die%20Spotify%20Premium%20Integration%20von%20mxster%20nutzen.%0D%0A%0D%0AE-Mail-Adresse%20meines%20Spotify-Kontos:%20[HIER%20EINTRAGEN]%0D%0A%0D%0AVielen%20Dank!`}
                    className="btn btn-secondary w-full text-sm py-2 min-h-[48px]"
                  >
                    📧 Zugang anfragen
                  </a>
                </div>

                <p className="text-xs text-text-secondary">
                  💎 Für Audiophile mit Spotify Premium Account
                </p>
              </div>
            </div>
          </div>

          {/* Quality Comparison */}
          <div className="mt-6 p-4 bg-primary/30 rounded-m3-md border border-accent/20">
            <p className="text-sm text-text-secondary text-center">
              <strong className="text-text-primary">Audioqualität im Vergleich:</strong><br/>
              Gratis-Modus (128 kbps) = gut genug für Quiz-Spiele, die meisten merken keinen Unterschied ·
              Spotify Premium (320 kbps) = Studio-Qualität, nur für echte Audiophile wahrnehmbar besser
            </p>
          </div>
        </div>
      </section>

      {/* Game Modes Section */}
      <section className="container mx-auto px-4 max-w-6xl mb-12" id="game-modes">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-display-sm md:text-display-md text-emphasized text-gradient mb-4">
            Drei Spielmodi
          </h2>
          <p className="text-title-lg text-text-secondary">
            Wähle den Modus, der zu deiner Gruppe passt
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 stagger-children">
          {/* Hardcore Mode */}
          <div className="card card-glow p-8 rounded-m3-xl">
            <div className="text-6xl mb-6">🔥</div>
            <h3 className="text-headline-sm text-emphasized mb-3 text-text-primary">
              Hardcore
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Rate Titel, Künstler und Erscheinungsjahr. Sammle Punkte für jede richtige Antwort!
            </p>
            <div className="space-y-2 text-sm text-text-secondary mb-6">
              <div className="flex items-center gap-2">
                <span className="text-secondary">✓</span>
                <span>Titel richtig: +5 Punkte</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-secondary">✓</span>
                <span>Künstler richtig: +5 Punkte</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-secondary">✓</span>
                <span>Jahr exakt: +5 | ±1: +2 | ±2: +1</span>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-semibold text-secondary">
                🏆 Gewinner: Meisten Punkte (max. 15/Song)
              </p>
            </div>
          </div>

          {/* Persönliche Timeline */}
          <div className="card p-8 rounded-m3-xl">
            <div className="text-6xl mb-6">👤</div>
            <h3 className="text-headline-sm text-emphasized mb-3 text-text-primary">
              Persönliche Timeline
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Jeder Spieler baut seine eigene Timeline. Ordne die Songs chronologisch ein!
            </p>
            <div className="space-y-2 text-sm text-text-secondary mb-6">
              <div className="flex items-center gap-2">
                <span className="text-secondary">✓</span>
                <span>Eigene Timeline pro Spieler</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-secondary">✓</span>
                <span>Manuelles Platzieren</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-secondary">✓</span>
                <span>Raten optional (keine Punkte)</span>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-semibold text-secondary">
                🏆 Gewinner: 10 Karten zuerst
              </p>
            </div>
          </div>

          {/* Globale Timeline */}
          <div className="card p-8 rounded-m3-xl">
            <div className="text-6xl mb-6">🌍</div>
            <h3 className="text-headline-sm text-emphasized mb-3 text-text-primary">
              Globale Timeline
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Alle Spieler teilen eine gemeinsame Timeline. Wer zuerst 10 Karten richtig platziert, gewinnt!
            </p>
            <div className="space-y-2 text-sm text-text-secondary mb-6">
              <div className="flex items-center gap-2">
                <span className="text-secondary">✓</span>
                <span>Gemeinsame Timeline</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-secondary">✓</span>
                <span>Kooperatives Gameplay</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-secondary">✓</span>
                <span>Wettkampf um Platzierungen</span>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-semibold text-secondary">
                🏆 Gewinner: 10 Karten zuerst
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Variants Section */}
      <section className="container mx-auto px-4 max-w-6xl mb-12" id="variants">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-display-sm md:text-display-md text-emphasized text-gradient mb-4">
            Spielvarianten
          </h2>
          <p className="text-title-lg text-text-secondary">
            Komplett digital oder mit echten Karten
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 stagger-children">
          {/* Virtual Cards - NOW FIRST */}
          <div className="card card-glow p-8 rounded-m3-xl group relative">
            {/* EMPFOHLEN Badge */}
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-accent text-white text-xs font-bold rounded-full shadow-glow-accent">
                ⭐ EMPFOHLEN
              </span>
            </div>
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">📱</div>
            <h3 className="text-headline-sm text-emphasized mb-4 text-text-primary group-hover:text-gradient">
              Virtuelle Karten
            </h3>
            <p className="text-text-secondary leading-relaxed mb-6">
              <strong className="text-accent">Empfohlen für die meisten Spieler:</strong> Spiele sofort los ohne Setup. Songs werden automatisch gezogen. Perfekt für spontane Spielrunden!
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-secondary flex-shrink-0">✓</span>
                <span className="text-text-secondary">Kein Drucker oder 3D-Drucker nötig</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-secondary flex-shrink-0">✓</span>
                <span className="text-text-secondary">Sofort spielbereit - kein Setup</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-secondary flex-shrink-0">✓</span>
                <span className="text-text-secondary">Alle {songCount} Songs verfügbar</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-secondary flex-shrink-0">✓</span>
                <span className="text-text-secondary">Bot-Gegner in 3 Schwierigkeitsgraden</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-secondary flex-shrink-0">✓</span>
                <span className="text-text-secondary">Perfekt für spontane Runden</span>
              </div>
            </div>
          </div>

          {/* Physical Cards - NOW SECOND */}
          <div className="card p-8 rounded-m3-xl group">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🃏</div>
            <h3 className="text-headline-sm text-emphasized mb-4 text-text-primary group-hover:text-gradient">
              Physische Karten
            </h3>
            <p className="text-text-secondary leading-relaxed mb-6">
              Für Enthusiasten: Drucke deine eigenen Karten aus oder erstelle 3D-gedruckte Karten mit QR-Codes. Der erste Spieler ist DJ (scannt die Karten) und spielt mit.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-secondary flex-shrink-0">✓</span>
                <span className="text-text-secondary">QR-Codes mit Smartphone-Kamera scannen</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-secondary flex-shrink-0">✓</span>
                <span className="text-text-secondary">DJ-Modus: DJ scannt und spielt mit</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-secondary flex-shrink-0">✓</span>
                <span className="text-text-secondary">Haptisches Spielerlebnis</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-secondary flex-shrink-0">✓</span>
                <span className="text-text-secondary">PDF-Karten oder 3D-Druck verfügbar</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* How it works Section */}
      <section className="container mx-auto px-4 max-w-6xl mb-12" id="how-it-works">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-display-sm md:text-display-md text-emphasized text-gradient mb-4">
            So funktioniert's
          </h2>
          <p className="text-title-lg text-text-secondary">
            In 4 einfachen Schritten zum Musikexperten
          </p>
        </div>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="card p-8 rounded-m3-xl group">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-glow-sm group-hover:scale-110 transition-transform">
                1
              </div>
              <div>
                <h3 className="text-headline-sm text-emphasized mb-3 text-text-primary group-hover:text-gradient">
                  Wähle Spielmodus & Variante
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  Entscheide dich für Hardcore, Persönliche Timeline oder Globale Timeline. Wähle dann zwischen physischen Karten (mit QR-Codes) oder virtuellen Karten.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="card p-8 rounded-m3-xl group">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-glow-sm group-hover:scale-110 transition-transform">
                2
              </div>
              <div>
                <h3 className="text-headline-sm text-emphasized mb-3 text-text-primary group-hover:text-gradient">
                  Spieler hinzufügen
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  Füge mindestens 2 Spieler hinzu. Bei physischen Karten ist der erste Spieler DJ (scannt QR-Codes) und spielt mit. Bei virtuellen Karten werden Songs automatisch gezogen.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="card p-8 rounded-m3-xl group">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-glow-sm group-hover:scale-110 transition-transform">
                3
              </div>
              <div>
                <h3 className="text-headline-sm text-emphasized mb-3 text-text-primary group-hover:text-gradient">
                  Rate oder Platziere
                </h3>
                <p className="text-text-secondary leading-relaxed mb-3">
                  <strong className="text-text-primary">Hardcore:</strong> Gib Titel, Künstler und Jahr ein. Bis zu 15 Punkte pro Song möglich (5+5+5 oder 5+5+2 oder 5+5+1)!
                </p>
                <p className="text-text-secondary leading-relaxed">
                  <strong className="text-text-primary">Timeline-Modi:</strong> Platziere Songs manuell in chronologischer Reihenfolge. Fuzzy-Matching erkennt auch ungenaue Eingaben!
                </p>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="card p-8 rounded-m3-xl group">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-glow-sm group-hover:scale-110 transition-transform">
                4
              </div>
              <div>
                <h3 className="text-headline-sm text-emphasized mb-3 text-text-primary group-hover:text-gradient">
                  Gewinne & Achievements
                </h3>
                <p className="text-text-secondary leading-relaxed mb-3">
                  <strong className="text-text-primary">Hardcore:</strong> Wer nach 10 Karten die meisten Punkte hat, gewinnt! Maximum: 150 Punkte.
                </p>
                <p className="text-text-secondary leading-relaxed mb-3">
                  <strong className="text-text-primary">Timeline-Modi:</strong> Wer zuerst 10 Karten richtig platziert, ist der Gewinner!
                </p>
                <p className="text-text-secondary leading-relaxed">
                  <strong className="text-text-primary">🏆 Achievements:</strong> Schalte Erfolge frei wie Volltreffer-Serie, Marathonläufer (50 Spiele) oder Musikexperte (1000 Punkte)!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center mt-12">
          <button
            onClick={handleLogin}
            className="btn btn-accent px-12 py-5 text-xl shadow-glow-accent group"
          >
            <span>🎮</span>
            Jetzt loslegen
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 max-w-6xl mb-12" id="features">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-display-sm md:text-display-md text-emphasized text-gradient mb-4">
            Features
          </h2>
          <p className="text-title-lg text-text-secondary">
            Was mxster besonders macht
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
          {/* Feature 1 */}
          <div className="card p-8 rounded-m3-xl text-center group">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🎯</div>
            <h3 className="text-title-lg text-emphasized mb-3 text-text-primary group-hover:text-gradient">
              Tolerantes Raten
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Fuzzy Matching erkennt Tippfehler (bis zu 3), Groß-/Kleinschreibung egal, Sonderzeichen werden ignoriert.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="card p-8 rounded-m3-xl text-center group">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🎧</div>
            <h3 className="text-title-lg text-emphasized mb-3 text-text-primary group-hover:text-gradient">
              Spotify Premium
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Volle Song-Wiedergabe mit Spotify Web Playback SDK. Höre komplette Tracks, keine Previews.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="card p-8 rounded-m3-xl text-center group">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">📱</div>
            <h3 className="text-title-lg text-emphasized mb-3 text-text-primary group-hover:text-gradient">
              Progressive Web App
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Installiere die App auf deinem Smartphone für ein natives App-Erlebnis. Offline-fähig!
            </p>
          </div>

          {/* Feature 4 - Achievements */}
          <div className="card p-8 rounded-m3-xl text-center group">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🏆</div>
            <h3 className="text-title-lg text-emphasized mb-3 text-text-primary group-hover:text-gradient">
              Achievements
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Schalte 20 coole Achievements frei! Volltreffer-Serien, Marathonläufer, Musikexperte, Genre-Hopper und mehr.
            </p>
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="container mx-auto px-4 max-w-6xl mb-12" id="open-source">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-display-sm md:text-display-md text-emphasized text-gradient mb-4">
            Open Source
          </h2>
          <p className="text-title-lg text-text-secondary">
            mxster ist komplett Open Source und auf GitHub verfügbar
          </p>
        </div>

        <div className="card p-8 md:p-12 rounded-m3-xl group">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0 text-7xl group-hover:scale-110 transition-transform">🐙</div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-headline-sm text-emphasized mb-4 text-text-primary group-hover:text-gradient">
                Auf GitHub
              </h3>
              <p className="text-text-secondary leading-relaxed mb-6">
                Der komplette Quellcode ist öffentlich auf GitHub verfügbar. Schau dir den Code an, lerne daraus, oder trage selbst bei!
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="glass px-4 py-2 rounded-m3-md text-sm font-semibold border border-accent/20 text-text-secondary">⭐ Star das Projekt</span>
                <span className="glass px-4 py-2 rounded-m3-md text-sm font-semibold border border-accent/20 text-text-secondary">🔧 Fork & Contribute</span>
                <span className="glass px-4 py-2 rounded-m3-md text-sm font-semibold border border-accent/20 text-text-secondary">🐛 Issues melden</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a
              href="https://github.com/pepperonas/mxster"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-accent px-10 py-4 text-lg shadow-glow-accent inline-flex items-center gap-2 group"
            >
              <span>🐙</span>
              Zum GitHub Repository
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 stagger-children">
            <div className="glass p-4 rounded-m3-md text-center border border-accent/20">
              <div className="text-2xl font-bold text-text-primary mb-1">💬</div>
              <div className="text-xs text-text-secondary">Issues & Diskussionen</div>
            </div>
            <div className="glass p-4 rounded-m3-md text-center border border-accent/20">
              <div className="text-2xl font-bold text-text-primary mb-1">100%</div>
              <div className="text-xs text-text-secondary">Open Source</div>
            </div>
            <div className="glass p-4 rounded-m3-md text-center border border-accent/20">
              <div className="text-2xl font-bold text-text-primary mb-1">MIT</div>
              <div className="text-xs text-text-secondary">Lizenz</div>
            </div>
            <div className="glass p-4 rounded-m3-md text-center border border-accent/20">
              <div className="text-2xl font-bold text-text-primary mb-1">3</div>
              <div className="text-xs text-text-secondary">Spielmodi</div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="container mx-auto px-4 max-w-6xl mb-12" id="support">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-display-sm md:text-display-md text-emphasized mb-4 flex items-center justify-center gap-2">
            <span>☕</span>
            <span className="text-gradient">Unterstütze mxster</span>
          </h2>
          <p className="text-title-lg text-text-secondary max-w-2xl mx-auto">
            mxster ist komplett kostenlos und werbefrei. Wenn dir das Projekt gefällt und du die Weiterentwicklung unterstützen möchtest, freue ich mich über eine kleine Spende!
          </p>
        </div>

        <div className="card p-8 md:p-12 rounded-m3-xl group">
          <div className="grid md:grid-cols-3 gap-6 mb-8 stagger-children">
            <div className="text-center">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🎮</div>
              <h4 className="text-title-md text-text-primary mb-2">Neue Features</h4>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🎵</div>
              <h4 className="text-title-md text-text-primary mb-2">Mehr Songs</h4>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🚀</div>
              <h4 className="text-title-md text-text-primary mb-2">Server-Kosten</h4>
            </div>
          </div>

          <div className="text-center">
            <a
              href="https://www.paypal.com/donate?business=martin.pfeffer@celox.io&item_name=Unterst%C3%BCtzung+f%C3%BCr+mxster"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-accent px-12 py-5 text-xl shadow-glow-accent inline-flex items-center gap-2 group"
            >
              <span>💝</span>
              Via PayPal spenden
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </a>
            <p className="mt-6 text-sm text-text-secondary">
              Jeder Beitrag hilft, mxster noch besser zu machen. Vielen Dank! ❤️
            </p>
          </div>
        </div>
      </section>

      {/* Downloads Section - FOR ENTHUSIASTS */}
      <section className="container mx-auto px-4 max-w-6xl mb-12" id="downloads">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-headline-md md:text-headline-lg text-emphasized text-gradient mb-3">
            🃏 Für Enthusiasten: Physische Karten
          </h2>
          <p className="text-title-md text-text-secondary">
            Drucke deine eigenen Karten oder erstelle 3D-Modelle
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 stagger-children">
          {/* PDF Cards - Smaller */}
          <div className="card p-6 rounded-m3-lg">
            <div className="text-4xl mb-4">🖨️</div>
            <h3 className="text-title-lg text-emphasized mb-3 text-text-primary">
              PDF Druckkarten
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              Druckfertige PDFs - 4 Karten pro A4-Seite
            </p>
            <div className="space-y-2">
              <a href="https://github.com/pepperonas/mxster/releases/latest/download/mxster-cards.pdf" download className="btn btn-secondary text-sm w-full justify-between py-2 min-h-[48px]">
                📄 Farbig
                <span>↓</span>
              </a>
              <a href="https://github.com/pepperonas/mxster/releases/latest/download/mxster-cards-bw.pdf" download className="btn btn-secondary text-sm w-full justify-between py-2 min-h-[48px]">
                📄 Schwarz-Weiß
                <span>↓</span>
              </a>
              <a href="https://github.com/pepperonas/mxster/releases/latest/download/mxster-cards-duplex.pdf" download className="btn btn-secondary text-sm w-full justify-between py-2 min-h-[48px]">
                📄 Duplex Farbig
                <span>↓</span>
              </a>
              <a href="https://github.com/pepperonas/mxster/releases/latest/download/mxster-cards-bw-duplex.pdf" download className="btn btn-secondary text-sm w-full justify-between py-2 min-h-[48px]">
                📄 Duplex S/W
                <span>↓</span>
              </a>
            </div>
          </div>

          {/* 3D Models - Smaller */}
          <div className="card p-6 rounded-m3-lg">
            <div className="text-4xl mb-4">🎲</div>
            <h3 className="text-title-lg text-emphasized mb-3 text-text-primary">
              3D-Druckmodelle
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              STL/SCAD-Dateien für 3D-Druck
            </p>
            <div className="space-y-2">
              <a href="https://github.com/pepperonas/mxster/releases/latest/download/all-cards.3mf" download className="btn btn-secondary text-sm w-full justify-between py-2 min-h-[48px]">
                📦 All-Cards (3MF)
                <span>↓</span>
              </a>
              <a href="https://github.com/pepperonas/mxster/releases/latest/download/mxster-stl-models.zip" download className="btn btn-secondary text-sm w-full justify-between py-2 min-h-[48px]">
                📦 STL (ZIP)
                <span>↓</span>
              </a>
              <a href="https://github.com/pepperonas/mxster/releases/latest/download/mxster-scad-models.zip" download className="btn btn-secondary text-sm w-full justify-between py-2 min-h-[48px]">
                📦 SCAD (ZIP)
                <span>↓</span>
              </a>
              <a href="https://github.com/pepperonas/mxster/tree/main/extras/card-generator/models" target="_blank" rel="noopener noreferrer" className="btn btn-secondary text-sm w-full justify-between py-2 min-h-[48px]">
                📂 GitHub
                <span>→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-md-outline-variant/50 mt-20 bg-md-surface-container-low">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="text-center">
            <p className="text-text-secondary mb-3">
              Entwickelt mit ❤️ für Musikliebhaber
            </p>
            <p className="text-sm text-text-secondary mb-4">
              © {new Date().getFullYear()} Martin Pfeffer | <a href="https://celox.io" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-accent transition-colors hover:underline">celox.io</a>
            </p>
            <div className="flex flex-wrap gap-4 justify-center text-sm">
              <a href="https://celox.io/datenschutz" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-secondary transition-colors">
                Datenschutz
              </a>
              <span className="text-text-secondary">•</span>
              <a href="https://celox.io/impressum" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-secondary transition-colors">
                Impressum
              </a>
              <span className="text-text-secondary">•</span>
              <a href="https://github.com/pepperonas/mxster" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-secondary transition-colors">
                GitHub
              </a>
              <span className="text-text-secondary">•</span>
              <a href="https://www.linkedin.com/in/martin-pfeffer-020831134/" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-secondary transition-colors">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Password Protection Dialog */}
      {showPasswordDialog && (
        <PasswordProtectionDialog
          onSuccess={() => {
            setShowPasswordDialog(false)
            localStorage.setItem('audio_mode_preference', 'preview')
            console.log('🔓 Access granted - Starting in Standard Audio Mode')
            navigate('/mode-selection')
          }}
          onCancel={() => {
            setShowPasswordDialog(false)
            console.log('🚫 Password dialog cancelled')
          }}
        />
      )}
    </div>
  )
}
