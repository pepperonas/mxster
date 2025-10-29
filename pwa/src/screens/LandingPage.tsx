/**
 * Landing Page
 * Marketing page with game features, modes, and downloads
 */

import { useNavigate } from 'react-router-dom'
import { useSpotifyAuth } from '@/hooks'
import { songs } from '@/data/songs'

export function LandingPage() {
  const navigate = useNavigate()
  const { login, isLoggedIn } = useSpotifyAuth()

  const handleLogin = async () => {
    if (isLoggedIn) {
      navigate('/mode-selection')
    } else {
      await login()
    }
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-600 bg-[length:400%_400%] animate-gradient" />
        </div>

        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto px-6 text-center space-y-8">
          {/* Logo / Title */}
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-6xl md:text-7xl font-extrabold text-gradient">
              mxster
            </h1>
            <p className="text-2xl md:text-3xl text-gray-400 font-medium">
              🎵 Deine Zeitreise durch die Musik
            </p>
          </div>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Rate Songs, ordne sie chronologisch und teste dein Musikwissen.
            Das ultimative Multiplayer-Musikquiz mit Spotify-Integration.
          </p>

          {/* Song Count Badge */}
          <div className="flex justify-center pt-4">
            <div className="bg-gray-900/80 backdrop-blur-sm px-8 py-4 rounded-2xl shadow-glow-md border-2 border-purple-600/30">
              <div className="text-5xl font-black text-gradient mb-2">{songs.length}</div>
              <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Songs verfügbar
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <button
              onClick={handleLogin}
              className="px-10 py-4 text-lg bg-purple-600 hover:bg-purple-700 rounded-lg shadow-glow-accent transition-all w-full sm:w-auto group font-bold"
            >
              <span>🎧</span> Mit Spotify starten{' '}
              <span className="transition-transform group-hover:translate-x-1 inline-block">→</span>
            </button>
            <button
              onClick={() => scrollToSection('game-modes')}
              className="px-10 py-4 text-lg border-2 border-gray-700 hover:border-purple-600 rounded-lg transition-colors w-full sm:w-auto font-bold"
            >
              Spielmodi ansehen
            </button>
          </div>

          {/* Key Features Pills */}
          <div className="flex flex-wrap gap-3 justify-center pt-12">
            {['🎮 3 Spielmodi', '🎵 Spotify Premium', '📱 Physisch & Virtuell', '🏆 Punktesystem'].map(
              (feature) => (
                <span
                  key={feature}
                  className="bg-gray-900/80 backdrop-blur-sm px-6 py-3 rounded-full text-sm font-semibold border border-gray-800"
                >
                  {feature}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* Game Modes Section */}
      <section id="game-modes" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            Drei Spielmodi
          </h2>
          <p className="text-xl text-gray-400">
            Wähle den Modus, der zu deiner Gruppe passt
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Game Mode 1: Ratespiel */}
          <div className="bg-gray-900/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-gray-800 hover:border-purple-600 hover:shadow-glow-md transition-all group cursor-pointer">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold mb-3 group-hover:text-gradient">
              Ratespiel
            </h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              Rate Titel, Künstler und Erscheinungsjahr. Sammle Punkte für jede richtige Antwort!
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-purple-500">✓</span> Titel richtig: +1 Punkt
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-500">✓</span> Künstler richtig: +1 Punkt
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-500">✓</span> Jahr richtig: +1 Punkt
              </div>
              <div className="flex items-center gap-2 font-bold text-white pt-2">
                <span className="text-purple-500">🏆</span> Gewinner: Meiste Punkte
              </div>
            </div>
          </div>

          {/* Game Mode 2: Timeline Persönlich */}
          <div className="bg-gray-900/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-gray-800 hover:border-purple-600 hover:shadow-glow-md transition-all group cursor-pointer">
            <div className="text-5xl mb-4">👤</div>
            <h3 className="text-2xl font-bold mb-3 group-hover:text-gradient">
              Timeline (Persönlich)
            </h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              Jeder Spieler baut seine eigene Timeline. Ordne die Songs chronologisch ein!
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-purple-500">✓</span> Eigene Timeline pro Spieler
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-500">✓</span> Manuelles Platzieren
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-500">✓</span> Raten optional
              </div>
              <div className="flex items-center gap-2 font-bold text-white pt-2">
                <span className="text-purple-500">🏆</span> Gewinner: 10 Karten zuerst
              </div>
            </div>
          </div>

          {/* Game Mode 3: Timeline Global */}
          <div className="bg-gray-900/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-gray-800 hover:border-purple-600 hover:shadow-glow-md transition-all group cursor-pointer">
            <div className="text-5xl mb-4">🌍</div>
            <h3 className="text-2xl font-bold mb-3 group-hover:text-gradient">
              Timeline (Global)
            </h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              Alle Spieler teilen eine gemeinsame Timeline. Wer zuerst 10 Karten richtig platziert, gewinnt!
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-purple-500">✓</span> Gemeinsame Timeline
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-500">✓</span> Kooperatives Gameplay
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-500">✓</span> Wettkampf um Platzierungen
              </div>
              <div className="flex items-center gap-2 font-bold text-white pt-2">
                <span className="text-purple-500">🏆</span> Gewinner: 10 Karten zuerst
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Play Section */}
      <section id="how-to-play" className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            Wie funktioniert's?
          </h2>
          <p className="text-xl text-gray-400">
            In 4 einfachen Schritten zum Musikexperten
          </p>
        </div>

        <div className="space-y-8">
          {[
            {
              step: 1,
              title: 'Wähle Spielmodus & Variante',
              text: 'Entscheide dich für Ratespiel, Timeline Persönlich oder Timeline Global. Wähle dann zwischen physischen Karten (mit QR-Codes) oder virtuellen Karten.'
            },
            {
              step: 2,
              title: 'Spieler hinzufügen',
              text: 'Füge mindestens 2 Spieler hinzu. Bei physischen Karten wird automatisch ein DJ bestimmt, der die QR-Codes scannt.'
            },
            {
              step: 3,
              title: 'Rate oder Platziere',
              text: 'Ratespiel: Gib Titel, Künstler und Jahr ein. Timeline-Modi: Platziere Songs manuell in chronologischer Reihenfolge.'
            },
            {
              step: 4,
              title: 'Gewinne das Spiel',
              text: 'Ratespiel: Meiste Punkte nach 10 Karten. Timeline-Modi: Wer zuerst 10 Karten richtig platziert!'
            }
          ].map(({ step, title, text }) => (
            <div
              key={step}
              className="bg-gray-900/80 backdrop-blur-sm p-8 rounded-2xl flex items-start gap-6 hover:shadow-glow-md transition-all"
            >
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl font-bold shadow-glow-sm">
                {step}
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">{title}</h3>
                <p className="text-gray-400 leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Start Button */}
        <div className="text-center mt-16">
          <button
            onClick={handleLogin}
            className="px-12 py-4 text-xl bg-purple-600 hover:bg-purple-700 rounded-lg shadow-glow-accent transition-all group font-bold"
          >
            <span>🎮</span> Jetzt loslegen{' '}
            <span className="transition-transform group-hover:translate-x-1 inline-block">→</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-800 text-center text-gray-500">
        <p className="mb-2">Entwickelt mit ❤️ für Musikliebhaber</p>
        <p className="mb-6 text-sm">
          © {new Date().getFullYear()} Martin Pfeffer -{' '}
          <a
            href="https://celox.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-purple-500 transition-colors"
          >
            celox.io
          </a>
        </p>
        <div className="flex flex-wrap gap-6 justify-center text-sm">
          <a
            href="https://github.com/pepperonas/mxster"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-purple-500 transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://celox.io/datenschutz"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-purple-500 transition-colors"
          >
            Datenschutz
          </a>
          <a
            href="https://celox.io/impressum"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-purple-500 transition-colors"
          >
            Impressum
          </a>
        </div>
      </footer>
    </div>
  )
}
