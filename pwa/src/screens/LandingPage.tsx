/**
 * Landing Page
 * Complete marketing page for mxster game - like https://mxster.de/
 */

import { useNavigate } from 'react-router-dom'
import { useSpotifyAuth } from '@/hooks'
import { songs } from '@/data/songs'

export function LandingPage() {
  const navigate = useNavigate()
  const { login, isLoggedIn } = useSpotifyAuth()

  const handleLogin = async () => {
    const storedToken = localStorage.getItem('spotify_auth_tokens')

    if (storedToken && isLoggedIn) {
      console.log('✅ Already logged in, navigating to mode selection')
      navigate('/mode-selection')
    } else {
      console.log('🔑 Starting Spotify login...')
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
          <h1 className="text-5xl md:text-6xl font-bold text-gradient mb-4">
            mxster
          </h1>
          <p className="text-xl text-text-secondary mb-6">
            🎵 Deine Zeitreise durch die Musik - {songCount} Songs verfügbar
          </p>
          <p className="text-text-secondary max-w-2xl mx-auto leading-relaxed mb-8">
            Rate Songs, ordne sie chronologisch und teste dein Musikwissen.
            Das ultimative Multiplayer-Musikquiz mit Spotify-Integration.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleLogin}
              className="btn btn-accent px-10 py-4 text-lg shadow-glow-accent w-full sm:w-auto group"
            >
              <span>🎧</span>
              Mit Spotify starten
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>
            <button
              onClick={() => scrollToSection('game-modes')}
              className="btn btn-secondary px-10 py-4 text-lg w-full sm:w-auto"
            >
              📖 Mehr erfahren
            </button>
          </div>
        </div>
      </section>

      {/* Game Modes Section */}
      <section className="container mx-auto px-4 max-w-6xl mb-12" id="game-modes">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-5xl md:text-6xl font-bold text-gradient mb-4">
            Drei Spielmodi
          </h2>
          <p className="text-xl text-text-secondary">
            Wähle den Modus, der zu deiner Gruppe passt
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Ratespiel */}
          <div className="glass p-8 rounded-2xl border-2 border-accent/30 hover:border-accent transition-all group hover:shadow-glow-accent cursor-pointer">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🎯</div>
            <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-gradient">
              Ratespiel
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Rate Titel, Künstler und Erscheinungsjahr. Sammle Punkte für jede richtige Antwort!
            </p>
            <div className="space-y-2 text-sm text-text-secondary mb-6">
              <div className="flex items-center gap-2">
                <span className="text-secondary">✓</span>
                <span>Titel richtig: +1 Punkt</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-secondary">✓</span>
                <span>Künstler richtig: +1 Punkt</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-secondary">✓</span>
                <span>Jahr richtig: +1 Punkt</span>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-semibold text-secondary">
                🏆 Gewinner: Meisten Punkte
              </p>
            </div>
          </div>

          {/* Persönliche Timeline */}
          <div className="glass p-8 rounded-2xl border-2 border-accent/30 hover:border-accent transition-all group hover:shadow-glow-accent cursor-pointer">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">👤</div>
            <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-gradient">
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
          <div className="glass p-8 rounded-2xl border-2 border-accent/30 hover:border-accent transition-all group hover:shadow-glow-accent cursor-pointer">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🌍</div>
            <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-gradient">
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
          <h2 className="text-5xl md:text-6xl font-bold text-gradient mb-4">
            Spielvarianten
          </h2>
          <p className="text-xl text-text-secondary">
            Mit echten Karten oder komplett digital
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Physical Cards */}
          <div className="glass p-8 rounded-2xl border-2 border-accent/30 hover:border-accent hover:shadow-glow-accent transition-all group">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🃏</div>
            <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-gradient">
              Physische Karten
            </h3>
            <p className="text-text-secondary leading-relaxed mb-6">
              Drucke deine eigenen Karten aus oder erstelle 3D-gedruckte Karten mit QR-Codes.
              Der erste Spieler ist DJ (scannt die Karten) und spielt mit.
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

          {/* Virtual Cards */}
          <div className="glass p-8 rounded-2xl border-2 border-accent/30 hover:border-accent hover:shadow-glow-accent transition-all group">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">📱</div>
            <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-gradient">
              Virtuelle Karten
            </h3>
            <p className="text-text-secondary leading-relaxed mb-6">
              Spiele komplett digital ohne physische Karten. Songs werden zufällig aus der Datenbank gezogen.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-secondary flex-shrink-0">✓</span>
                <span className="text-text-secondary">Kein Drucker oder 3D-Drucker nötig</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-secondary flex-shrink-0">✓</span>
                <span className="text-text-secondary">Sofort loslegen</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-secondary flex-shrink-0">✓</span>
                <span className="text-text-secondary">Perfekt zum Testen</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Downloads Section */}
      <section className="container mx-auto px-4 max-w-6xl mb-12" id="downloads">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-5xl md:text-6xl font-bold text-gradient mb-4">
            Downloads
          </h2>
          <p className="text-xl text-text-secondary">
            Drucke deine eigenen Karten oder erstelle 3D-Modelle
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* PDF Cards */}
          <div className="glass p-8 rounded-2xl border-2 border-accent/30 hover:border-accent transition-colors group">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🖨️</div>
            <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-gradient">
              PDF Druckkarten
            </h3>
            <p className="text-text-secondary leading-relaxed mb-6">
              Lade druckfertige PDF-Dateien herunter. 4 Karten pro A4-Seite in verschiedenen Varianten.
            </p>
            <div className="space-y-3 mb-6">
              <a href="/mxster-cards.pdf" download className="btn btn-secondary w-full justify-between">
                📄 Standard (Farbig)
                <span>↓</span>
              </a>
              <a href="/mxster-cards-bw.pdf" download className="btn btn-secondary w-full justify-between">
                📄 Schwarz-Weiß
                <span>↓</span>
              </a>
              <a href="/mxster-cards-duplex.pdf" download className="btn btn-secondary w-full justify-between">
                📄 Duplex (Farbig)
                <span>↓</span>
              </a>
              <a href="/mxster-cards-bw-duplex.pdf" download className="btn btn-secondary w-full justify-between">
                📄 Duplex (Schwarz-Weiß)
                <span>↓</span>
              </a>
            </div>
            <div className="glass p-4 rounded-lg border border-accent/20">
              <p className="text-xs text-text-secondary">
                💡 <strong>Tipp:</strong> Duplex-Modus für beidseitigen Druck verwenden. Standard-Modus für einfaches Falten und Kleben.
              </p>
            </div>
          </div>

          {/* 3D Models */}
          <div className="glass p-8 rounded-2xl border-2 border-accent/30 hover:border-accent transition-colors group">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🎲</div>
            <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-gradient">
              3D-Druckmodelle
            </h3>
            <p className="text-text-secondary leading-relaxed mb-6">
              Lade STL-Dateien für hochwertige 3D-gedruckte Karten herunter. Dual-sided Design mit QR-Code.
            </p>
            <div className="space-y-3 mb-6">
              <a href="/models/all-cards.3mf" download className="btn btn-secondary w-full justify-between">
                📦 All-Cards (3MF)
                <span>↓</span>
              </a>
              <a href="/mxster-stl-models.zip" download className="btn btn-secondary w-full justify-between">
                📦 STL Modelle (ZIP)
                <span>↓</span>
              </a>
              <a href="/mxster-scad-models.zip" download className="btn btn-secondary w-full justify-between">
                📦 SCAD Modelle (ZIP)
                <span>↓</span>
              </a>
              <a href="https://github.com/pepperonas/mxster/tree/main/card-generator/models" target="_blank" rel="noopener noreferrer" className="btn btn-secondary w-full justify-between">
                📂 Einzelne Modelle
                <span>→</span>
              </a>
            </div>
            <div className="glass p-4 rounded-lg border border-accent/20 space-y-1 text-xs text-text-secondary">
              <p className="font-semibold text-white mb-2">⚙️ Druckeinstellungen:</p>
              <p>• Layer Height: 0.1-0.15mm</p>
              <p>• Infill: 100%</p>
              <p>• Material: PLA oder PETG</p>
              <p>• Support: Nicht nötig</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="container mx-auto px-4 max-w-6xl mb-12" id="how-it-works">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-5xl md:text-6xl font-bold text-gradient mb-4">
            So funktioniert's
          </h2>
          <p className="text-xl text-text-secondary">
            In 4 einfachen Schritten zum Musikexperten
          </p>
        </div>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="glass p-8 rounded-2xl border-2 border-accent/30 hover:border-accent transition-colors group">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-glow-sm group-hover:scale-110 transition-transform">
                1
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-gradient">
                  Wähle Spielmodus & Variante
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  Entscheide dich für Ratespiel, Persönliche Timeline oder Globale Timeline. Wähle dann zwischen physischen Karten (mit QR-Codes) oder virtuellen Karten.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="glass p-8 rounded-2xl border-2 border-accent/30 hover:border-accent transition-colors group">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-glow-sm group-hover:scale-110 transition-transform">
                2
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-gradient">
                  Spieler hinzufügen
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  Füge mindestens 2 Spieler hinzu. Bei physischen Karten ist der erste Spieler DJ (scannt QR-Codes) und spielt mit. Bei virtuellen Karten werden Songs automatisch gezogen.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="glass p-8 rounded-2xl border-2 border-accent/30 hover:border-accent transition-colors group">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-glow-sm group-hover:scale-110 transition-transform">
                3
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-gradient">
                  Rate oder Platziere
                </h3>
                <p className="text-text-secondary leading-relaxed mb-3">
                  <strong className="text-white">Ratespiel:</strong> Gib Titel, Künstler und Jahr ein. Sammle Punkte für jede richtige Antwort!
                </p>
                <p className="text-text-secondary leading-relaxed">
                  <strong className="text-white">Timeline-Modi:</strong> Platziere Songs manuell in chronologischer Reihenfolge. Fuzzy-Matching erkennt auch ungenaue Eingaben!
                </p>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="glass p-8 rounded-2xl border-2 border-accent/30 hover:border-accent transition-colors group">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-glow-sm group-hover:scale-110 transition-transform">
                4
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-gradient">
                  Gewinne das Spiel
                </h3>
                <p className="text-text-secondary leading-relaxed mb-3">
                  <strong className="text-white">Ratespiel:</strong> Wer nach 10 Karten die meisten Punkte hat, gewinnt!
                </p>
                <p className="text-text-secondary leading-relaxed">
                  <strong className="text-white">Timeline-Modi:</strong> Wer zuerst 10 Karten richtig platziert, ist der Gewinner!
                  Die Punkteübersicht zeigt live Updates nach jeder Runde.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center mt-12">
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
          <h2 className="text-5xl md:text-6xl font-bold text-gradient mb-4">
            Features
          </h2>
          <p className="text-xl text-text-secondary">
            Was mxster besonders macht
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="glass p-8 rounded-2xl border-2 border-accent/30 hover:border-accent hover:shadow-glow-accent transition-all text-center group">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🎯</div>
            <h3 className="text-xl font-bold mb-3 text-white group-hover:text-gradient">
              Tolerantes Raten
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Fuzzy Matching erkennt Tippfehler (bis zu 3), Groß-/Kleinschreibung egal, Sonderzeichen werden ignoriert. Jahr muss exakt stimmen.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass p-8 rounded-2xl border-2 border-accent/30 hover:border-accent hover:shadow-glow-accent transition-all text-center group">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🎧</div>
            <h3 className="text-xl font-bold mb-3 text-white group-hover:text-gradient">
              Spotify Premium
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Volle Song-Wiedergabe mit Spotify Web Playback SDK. Höre komplette Tracks, keine 30-Sekunden-Previews. Echter Musikgenuss.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass p-8 rounded-2xl border-2 border-accent/30 hover:border-accent hover:shadow-glow-accent transition-all text-center group">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">📱</div>
            <h3 className="text-xl font-bold mb-3 text-white group-hover:text-gradient">
              Progressive Web App
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Installiere die App auf deinem Smartphone für ein natives App-Erlebnis. Offline-Funktionalität und schnelle Ladezeiten inklusive.
            </p>
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="container mx-auto px-4 max-w-6xl mb-12" id="open-source">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-5xl md:text-6xl font-bold text-gradient mb-4">
            Open Source
          </h2>
          <p className="text-xl text-text-secondary">
            mxster ist komplett Open Source und auf GitHub verfügbar
          </p>
        </div>

        <div className="glass p-8 md:p-12 rounded-2xl border-2 border-accent/30 hover:border-accent transition-colors group">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0 text-7xl group-hover:scale-110 transition-transform">🐙</div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-gradient">
                Auf GitHub
              </h3>
              <p className="text-text-secondary leading-relaxed mb-6">
                Der komplette Quellcode ist öffentlich auf GitHub verfügbar. Schau dir den Code an, lerne daraus, oder trage selbst bei!
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="glass px-4 py-2 rounded-lg text-sm font-semibold border border-accent/20 text-text-secondary">⭐ Star das Projekt</span>
                <span className="glass px-4 py-2 rounded-lg text-sm font-semibold border border-accent/20 text-text-secondary">🔧 Fork & Contribute</span>
                <span className="glass px-4 py-2 rounded-lg text-sm font-semibold border border-accent/20 text-text-secondary">🐛 Issues melden</span>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            <div className="glass p-4 rounded-lg text-center border border-accent/20">
              <div className="text-2xl font-bold text-white mb-1">💬</div>
              <div className="text-xs text-text-secondary">Issues & Diskussionen</div>
            </div>
            <div className="glass p-4 rounded-lg text-center border border-accent/20">
              <div className="text-2xl font-bold text-white mb-1">100%</div>
              <div className="text-xs text-text-secondary">Open Source</div>
            </div>
            <div className="glass p-4 rounded-lg text-center border border-accent/20">
              <div className="text-2xl font-bold text-white mb-1">MIT</div>
              <div className="text-xs text-text-secondary">Lizenz</div>
            </div>
            <div className="glass p-4 rounded-lg text-center border border-accent/20">
              <div className="text-2xl font-bold text-white mb-1">3</div>
              <div className="text-xs text-text-secondary">Spielmodi</div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="container mx-auto px-4 max-w-6xl mb-12" id="support">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-5xl md:text-6xl font-bold mb-4 flex items-center justify-center gap-2">
            <span>☕</span>
            <span className="text-gradient">Unterstütze mxster</span>
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            mxster ist komplett kostenlos und werbefrei. Wenn dir das Projekt gefällt und du die Weiterentwicklung unterstützen möchtest, freue ich mich über eine kleine Spende!
          </p>
        </div>

        <div className="glass p-8 md:p-12 rounded-2xl border-2 border-accent/30 hover:border-accent transition-colors group">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🎮</div>
              <h4 className="font-bold text-white mb-2">Neue Features</h4>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🎵</div>
              <h4 className="font-bold text-white mb-2">Mehr Songs</h4>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🚀</div>
              <h4 className="font-bold text-white mb-2">Server-Kosten</h4>
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

      {/* Footer */}
      <footer className="border-t-2 border-accent/30 mt-20" style={{ backgroundColor: '#262634' }}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="text-center">
            <p className="text-text-secondary mb-3">
              Entwickelt mit ❤️ für Musikliebhaber
            </p>
            <p className="text-sm text-text-secondary mb-4">
              © 2025 Martin Pfeffer - <a href="https://celox.io" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-accent transition-colors hover:underline">celox.io</a>
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
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
