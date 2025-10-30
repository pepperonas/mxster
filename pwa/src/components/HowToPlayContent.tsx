/**
 * How To Play Content Component
 * Comprehensive guide for all game modes with expandable sections
 */

import { useState } from 'react'

interface AccordionSection {
  id: string
  icon: string
  title: string
  content: JSX.Element
}

export function HowToPlayContent() {
  const [openSections, setOpenSections] = useState<string[]>(['guess']) // Open first section by default

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const sections: AccordionSection[] = [
    {
      id: 'guess',
      icon: '🎯',
      title: 'Ratespiel',
      content: (
        <div className="space-y-4">
          <p className="text-text-secondary">
            <strong className="text-gradient">Ziel:</strong> Sammle die meisten Punkte durch richtiges Raten!
          </p>

          <div className="space-y-3">
            <div className="glass p-3 rounded-lg border border-accent/20">
              <h4 className="font-semibold text-secondary mb-2">📝 Spielablauf:</h4>
              <ol className="space-y-2 text-sm text-text-secondary">
                <li className="flex gap-2">
                  <span className="text-accent font-bold">1.</span>
                  <span>DJ scannt QR-Code oder virtueller Modus zieht Song</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">2.</span>
                  <span>Song wird abgespielt - aufmerksam zuhören!</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">3.</span>
                  <span>Spieler gibt Titel, Künstler und Jahr ein</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">4.</span>
                  <span>System prüft Antworten mit Fuzzy Matching</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">5.</span>
                  <span>Punkte werden vergeben und Karte automatisch platziert</span>
                </li>
              </ol>
            </div>

            <div className="glass p-3 rounded-lg border border-accent/20">
              <h4 className="font-semibold text-secondary mb-2">⭐ Punktevergabe:</h4>
              <ul className="space-y-1 text-sm text-text-secondary">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Titel richtig: <strong className="text-gradient">+1 Punkt</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Künstler richtig: <strong className="text-gradient">+1 Punkt</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Jahr richtig (±2 Jahre Toleranz): <strong className="text-gradient">+1 Punkt</strong></span>
                </li>
              </ul>
            </div>

            <div className="glass p-3 rounded-lg border border-accent/20">
              <h4 className="font-semibold text-secondary mb-2">🏆 Gewinner:</h4>
              <p className="text-sm text-text-secondary">
                Spieler mit den <strong className="text-gradient">meisten Punkten</strong> nach 10 Karten gewinnt!
              </p>
            </div>

            <div className="bg-accent/10 p-3 rounded-lg border border-accent/30">
              <h4 className="font-semibold text-accent mb-2">💡 Tipp:</h4>
              <p className="text-sm text-text-secondary">
                Fuzzy Matching akzeptiert auch Tippfehler! "Fleetwood Mac" wird als "Fleetwood Mack" erkannt.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'timeline_personal',
      icon: '👤',
      title: 'Timeline Personal',
      content: (
        <div className="space-y-4">
          <p className="text-text-secondary">
            <strong className="text-gradient">Ziel:</strong> Baue deine eigene Timeline mit 10 Karten auf!
          </p>

          <div className="space-y-3">
            <div className="glass p-3 rounded-lg border border-accent/20">
              <h4 className="font-semibold text-secondary mb-2">📝 Spielablauf:</h4>
              <ol className="space-y-2 text-sm text-text-secondary">
                <li className="flex gap-2">
                  <span className="text-accent font-bold">1.</span>
                  <span>Jeder Spieler baut seine <strong>eigene separate Timeline</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">2.</span>
                  <span>DJ scannt QR-Code oder virtueller Modus zieht Song</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">3.</span>
                  <span>Optional: Spieler kann zum Spaß raten (keine Punkte)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">4.</span>
                  <span>Karte wird automatisch chronologisch eingefügt</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">5.</span>
                  <span>Timeline wechselt zum nächsten Spieler</span>
                </li>
              </ol>
            </div>

            <div className="glass p-3 rounded-lg border border-accent/20">
              <h4 className="font-semibold text-secondary mb-2">🎯 Besonderheiten:</h4>
              <ul className="space-y-1 text-sm text-text-secondary">
                <li className="flex items-center gap-2">
                  <span className="text-accent">•</span>
                  <span>Kein Punktesystem - nur Kartenzählung</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">•</span>
                  <span>Jeder Spieler sieht nur seine eigene Timeline</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">•</span>
                  <span>Automatische chronologische Sortierung</span>
                </li>
              </ul>
            </div>

            <div className="glass p-3 rounded-lg border border-accent/20">
              <h4 className="font-semibold text-secondary mb-2">🏆 Gewinner:</h4>
              <p className="text-sm text-text-secondary">
                <strong className="text-gradient">Erster Spieler</strong>, der 10 Karten in seiner Timeline hat!
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'timeline_global',
      icon: '🌍',
      title: 'Timeline Global',
      content: (
        <div className="space-y-4">
          <p className="text-text-secondary">
            <strong className="text-gradient">Ziel:</strong> Gemeinsam eine Timeline aufbauen - Wer erreicht zuerst 10 Karten?
          </p>

          <div className="space-y-3">
            <div className="glass p-3 rounded-lg border border-accent/20">
              <h4 className="font-semibold text-secondary mb-2">📝 Spielablauf:</h4>
              <ol className="space-y-2 text-sm text-text-secondary">
                <li className="flex gap-2">
                  <span className="text-accent font-bold">1.</span>
                  <span><strong>ALLE Spieler teilen EINE gemeinsame Timeline</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">2.</span>
                  <span>DJ scannt QR-Code oder virtueller Modus zieht Song</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">3.</span>
                  <span>Optional: Spieler kann zum Spaß raten (keine Punkte)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">4.</span>
                  <span>Karte wird in die globale Timeline eingefügt</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">5.</span>
                  <span>Timeline bleibt gleich - alle sehen die selbe Timeline</span>
                </li>
              </ol>
            </div>

            <div className="glass p-3 rounded-lg border border-accent/20">
              <h4 className="font-semibold text-secondary mb-2">🎯 Besonderheiten:</h4>
              <ul className="space-y-1 text-sm text-text-secondary">
                <li className="flex items-center gap-2">
                  <span className="text-accent">•</span>
                  <span>Kein Punktesystem - nur Kartenzählung pro Spieler</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">•</span>
                  <span>Timeline ändert sich NICHT beim Spielerwechsel</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">•</span>
                  <span>Kooperatives Timeline-Building</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">•</span>
                  <span>Spieler-Badges zeigen, wer welche Karte platziert hat</span>
                </li>
              </ul>
            </div>

            <div className="glass p-3 rounded-lg border border-accent/20">
              <h4 className="font-semibold text-secondary mb-2">🏆 Gewinner:</h4>
              <p className="text-sm text-text-secondary">
                <strong className="text-gradient">Erster Spieler</strong>, der insgesamt 10 Karten platziert hat!
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'tips',
      icon: '💡',
      title: 'Allgemeine Tipps & Infos',
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="glass p-3 rounded-lg border border-accent/20">
              <h4 className="font-semibold text-secondary mb-2">🎮 Spielvarianten:</h4>
              <div className="space-y-2 text-sm text-text-secondary">
                <div>
                  <strong className="text-gradient">📷 Physischer Modus:</strong>
                  <p className="ml-4 mt-1">Scanne QR-Codes von gedruckten oder 3D-gedruckten Karten. Ein Spieler übernimmt die Rolle des DJs.</p>
                </div>
                <div>
                  <strong className="text-gradient">🎲 Virtueller Modus:</strong>
                  <p className="ml-4 mt-1">Keine Karten nötig! Songs werden zufällig aus der Datenbank gezogen. Kein DJ erforderlich.</p>
                </div>
              </div>
            </div>

            <div className="glass p-3 rounded-lg border border-accent/20">
              <h4 className="font-semibold text-secondary mb-2">🎵 Spotify Integration:</h4>
              <ul className="space-y-1 text-sm text-text-secondary">
                <li className="flex items-center gap-2">
                  <span className="text-accent">•</span>
                  <span><strong className="text-gradient">Premium erforderlich:</strong> Volle Song-Wiedergabe nur mit Spotify Premium</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">•</span>
                  <span><strong className="text-gradient">Web Playback SDK:</strong> Erstellt virtuelles Gerät in deinem Account</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">•</span>
                  <span><strong className="text-gradient">Fallback:</strong> 30-Sekunden-Previews ohne Premium</span>
                </li>
              </ul>
            </div>

            <div className="glass p-3 rounded-lg border border-accent/20">
              <h4 className="font-semibold text-secondary mb-2">💾 Spielstand-Speicherung:</h4>
              <ul className="space-y-1 text-sm text-text-secondary">
                <li className="flex items-center gap-2">
                  <span className="text-accent">•</span>
                  <span>Automatische Speicherung nach jeder Aktion</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">•</span>
                  <span>Kein Fortschritt geht verloren, selbst bei Page Refresh</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">•</span>
                  <span>Export/Import Funktion für Backups</span>
                </li>
              </ul>
            </div>

            <div className="glass p-3 rounded-lg border border-accent/20">
              <h4 className="font-semibold text-secondary mb-2">⌨️ Tastatur-Shortcuts:</h4>
              <ul className="space-y-1 text-sm text-text-secondary">
                <li className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-primary rounded border border-accent/30 text-xs">Enter</kbd>
                  <span>Dialog schließen / Weiter</span>
                </li>
                <li className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-primary rounded border border-accent/30 text-xs">Esc</kbd>
                  <span>Dialog schließen / Abbrechen</span>
                </li>
              </ul>
            </div>

            <div className="bg-accent/10 p-3 rounded-lg border border-accent/30">
              <h4 className="font-semibold text-accent mb-2">💡 Pro-Tipps:</h4>
              <ul className="space-y-1 text-sm text-text-secondary">
                <li className="flex items-center gap-2">
                  <span className="text-accent">1.</span>
                  <span>Nutze die "Zufällige Startposition" Einstellung für mehr Abwechslung</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">2.</span>
                  <span>Achte auf die Partikel-Animation - sie reagiert auf die Musik!</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">3.</span>
                  <span>Im Ratespiel: Auch Teilpunkte zählen - rate immer!</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">4.</span>
                  <span>Installiere mxster als PWA für das beste Spielerlebnis</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
      {sections.map((section) => {
        const isOpen = openSections.includes(section.id)

        return (
          <div
            key={section.id}
            className="glass rounded-xl border-2 border-accent/30 overflow-hidden"
          >
            {/* Accordion Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{section.icon}</span>
                <h3 className="text-lg font-bold text-gradient">{section.title}</h3>
              </div>
              <svg
                className={`w-5 h-5 text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Accordion Content */}
            {isOpen && (
              <div className="p-4 pt-0 border-t-2 border-accent/20">
                {section.content}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
