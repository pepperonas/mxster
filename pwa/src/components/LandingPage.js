/**
 * Landing Page Component
 *
 * Modern landing page with Celox-style design
 * Shows game features, game modes, how to play, and downloads
 */

export function renderLandingPage(onLoginClick) {
  return `
    <div class="min-h-screen bg-background">
      <!-- Hero Section -->
      <div class="relative overflow-hidden">
        <!-- Animated Background Pattern -->
        <div class="absolute inset-0 opacity-20">
          <div class="absolute inset-0 bg-gradient-to-br from-secondary via-accent to-secondary bg-[length:400%_400%] animate-float"></div>
        </div>

        <!-- Hero Content -->
        <div class="relative max-w-7xl mx-auto px-6 py-20 md:py-32">
          <div class="text-center space-y-8 animate-fade-in">
            <!-- Logo / Title -->
            <div class="space-y-4">
              <h1 class="text-6xl md:text-7xl font-extrabold text-gradient animate-slide-up">
                mxster
              </h1>
              <p class="text-2xl md:text-3xl text-text-secondary font-medium">
                🎵 Music Timeline Game
              </p>
            </div>

            <!-- Subtitle -->
            <p class="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Rate Songs, ordne sie chronologisch und teste dein Musikwissen.
              Der ultimative Multiplayer-Musikquiz mit Spotify-Integration.
            </p>

            <!-- CTA Buttons -->
            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <button
                class="btn btn-accent px-10 py-4 text-lg shadow-glow-accent w-full sm:w-auto group"
                onclick="this.dispatchEvent(new Event('login', { bubbles: true }))"
              >
                <span>🎧</span>
                Mit Spotify starten
                <span class="transition-transform group-hover:translate-x-1">→</span>
              </button>
              <button
                class="btn-outline btn px-10 py-4 text-lg w-full sm:w-auto"
                onclick="document.getElementById('game-modes').scrollIntoView({ behavior: 'smooth' })"
              >
                Spielmodi ansehen
              </button>
            </div>

            <!-- Key Features Pills -->
            <div class="flex flex-wrap gap-3 justify-center pt-12">
              <span class="glass px-6 py-3 rounded-full text-sm font-semibold text-text-primary shadow-glow-sm">
                🎮 3 Spielmodi
              </span>
              <span class="glass px-6 py-3 rounded-full text-sm font-semibold text-text-primary shadow-glow-sm">
                🎵 Spotify Premium
              </span>
              <span class="glass px-6 py-3 rounded-full text-sm font-semibold text-text-primary shadow-glow-sm">
                📱 Physisch & Virtuell
              </span>
              <span class="glass px-6 py-3 rounded-full text-sm font-semibold text-text-primary shadow-glow-sm">
                🏆 Punktesystem
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Game Modes Section -->
      <div class="max-w-7xl mx-auto px-6 py-20" id="game-modes">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold text-gradient mb-4">
            Drei Spielmodi
          </h2>
          <p class="text-xl text-text-secondary">
            Wähle den Modus, der zu deiner Gruppe passt
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <!-- Game Mode 1: Ratespiel -->
          <div class="card group hover:shadow-glow-md cursor-pointer">
            <div class="text-5xl mb-4">🎯</div>
            <h3 class="text-2xl font-bold mb-3 text-text-primary group-hover:text-gradient">
              Ratespiel
            </h3>
            <p class="text-text-secondary leading-relaxed mb-4">
              Rate Titel, Künstler und Erscheinungsjahr. Sammle Punkte für jede richtige Antwort!
            </p>
            <div class="space-y-2 text-sm text-text-secondary">
              <div class="flex items-center gap-2">
                <span class="text-accent">✓</span> Titel richtig: +1 Punkt
              </div>
              <div class="flex items-center gap-2">
                <span class="text-accent">✓</span> Künstler richtig: +1 Punkt
              </div>
              <div class="flex items-center gap-2">
                <span class="text-accent">✓</span> Jahr richtig (exakt): +1 Punkt
              </div>
              <div class="flex items-center gap-2 font-bold text-text-primary pt-2">
                <span class="text-accent">🏆</span> Gewinner: Meiste Punkte
              </div>
            </div>
          </div>

          <!-- Game Mode 2: Timeline Persönlich -->
          <div class="card group hover:shadow-glow-md cursor-pointer">
            <div class="text-5xl mb-4">👤</div>
            <h3 class="text-2xl font-bold mb-3 text-text-primary group-hover:text-gradient">
              Timeline (Persönlich)
            </h3>
            <p class="text-text-secondary leading-relaxed mb-4">
              Jeder Spieler baut seine eigene Timeline. Ordne die Songs chronologisch ein!
            </p>
            <div class="space-y-2 text-sm text-text-secondary">
              <div class="flex items-center gap-2">
                <span class="text-accent">✓</span> Eigene Timeline pro Spieler
              </div>
              <div class="flex items-center gap-2">
                <span class="text-accent">✓</span> Manuelles Platzieren
              </div>
              <div class="flex items-center gap-2">
                <span class="text-accent">✓</span> Raten optional (keine Punkte)
              </div>
              <div class="flex items-center gap-2 font-bold text-text-primary pt-2">
                <span class="text-accent">🏆</span> Gewinner: 10 Karten zuerst
              </div>
            </div>
          </div>

          <!-- Game Mode 3: Timeline Global -->
          <div class="card group hover:shadow-glow-md cursor-pointer">
            <div class="text-5xl mb-4">🌍</div>
            <h3 class="text-2xl font-bold mb-3 text-text-primary group-hover:text-gradient">
              Timeline (Global)
            </h3>
            <p class="text-text-secondary leading-relaxed mb-4">
              Alle Spieler teilen eine gemeinsame Timeline. Wer zuerst 10 Karten richtig platziert, gewinnt!
            </p>
            <div class="space-y-2 text-sm text-text-secondary">
              <div class="flex items-center gap-2">
                <span class="text-accent">✓</span> Gemeinsame Timeline
              </div>
              <div class="flex items-center gap-2">
                <span class="text-accent">✓</span> Kooperatives Gameplay
              </div>
              <div class="flex items-center gap-2">
                <span class="text-accent">✓</span> Wettkampf um Platzierungen
              </div>
              <div class="flex items-center gap-2 font-bold text-text-primary pt-2">
                <span class="text-accent">🏆</span> Gewinner: 10 Karten zuerst
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Variants Section: Physical vs Virtual -->
      <div class="max-w-5xl mx-auto px-6 py-20" id="variants">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold text-gradient mb-4">
            Zwei Spielvarianten
          </h2>
          <p class="text-xl text-text-secondary">
            Mit echten Karten oder komplett digital
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-8">
          <!-- Physical Cards -->
          <div class="glass p-8 rounded-2xl hover:shadow-glow-md transition-all">
            <div class="text-5xl mb-4">🃏</div>
            <h3 class="text-2xl font-bold mb-4 text-text-primary">
              Physische Karten
            </h3>
            <p class="text-text-secondary leading-relaxed mb-6">
              Drucke deine eigenen Karten aus oder erstelle 3D-gedruckte Karten mit QR-Codes.
              Ein Spieler wird DJ und scannt die Karten.
            </p>
            <div class="space-y-3 text-sm">
              <div class="flex items-start gap-3">
                <span class="text-accent flex-shrink-0">✓</span>
                <span class="text-text-secondary">QR-Codes mit Smartphone-Kamera scannen</span>
              </div>
              <div class="flex items-start gap-3">
                <span class="text-accent flex-shrink-0">✓</span>
                <span class="text-text-secondary">DJ-Modus: Einer scannt, alle raten</span>
              </div>
              <div class="flex items-start gap-3">
                <span class="text-accent flex-shrink-0">✓</span>
                <span class="text-text-secondary">Haptisches Spielerlebnis</span>
              </div>
              <div class="flex items-start gap-3">
                <span class="text-accent flex-shrink-0">✓</span>
                <span class="text-text-secondary">PDF-Karten oder 3D-Druck verfügbar</span>
              </div>
            </div>
          </div>

          <!-- Virtual Cards -->
          <div class="glass p-8 rounded-2xl hover:shadow-glow-md transition-all">
            <div class="text-5xl mb-4">📱</div>
            <h3 class="text-2xl font-bold mb-4 text-text-primary">
              Virtuelle Karten
            </h3>
            <p class="text-text-secondary leading-relaxed mb-6">
              Spiele komplett digital ohne physische Karten. Songs werden zufällig aus der Datenbank gezogen.
            </p>
            <div class="space-y-3 text-sm">
              <div class="flex items-start gap-3">
                <span class="text-accent flex-shrink-0">✓</span>
                <span class="text-text-secondary">Kein Drucker oder 3D-Drucker nötig</span>
              </div>
              <div class="flex items-start gap-3">
                <span class="text-accent flex-shrink-0">✓</span>
                <span class="text-text-secondary">Sofort loslegen</span>
              </div>
              <div class="flex items-start gap-3">
                <span class="text-accent flex-shrink-0">✓</span>
                <span class="text-text-secondary">Perfekt zum Testen</span>
              </div>
              <div class="flex items-start gap-3">
                <span class="text-accent flex-shrink-0">✓</span>
                <span class="text-text-secondary">Unbegrenzte Songs verfügbar</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Download Section -->
      <div class="max-w-7xl mx-auto px-6 py-20 bg-gradient-to-b from-transparent via-primary/20 to-transparent" id="downloads">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold text-gradient mb-4">
            Downloads
          </h2>
          <p class="text-xl text-text-secondary">
            Drucke deine eigenen Karten oder erstelle 3D-Modelle
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <!-- PDF Downloads -->
          <div class="card">
            <div class="text-5xl mb-4">🖨️</div>
            <h3 class="text-2xl font-bold mb-4 text-text-primary">
              PDF Druckkarten
            </h3>
            <p class="text-text-secondary leading-relaxed mb-6">
              Lade druckfertige PDF-Dateien herunter. 4 Karten pro A4-Seite in verschiedenen Varianten.
            </p>

            <div class="space-y-3">
              <a href="https://github.com/pepperonas/mxster/releases/download/v0.0.1-beta/mxster-cards.pdf" target="_blank" rel="noopener noreferrer" class="btn btn-accent w-full flex items-center justify-between group">
                <span>📄 Standard (Farbig)</span>
                <span class="transition-transform group-hover:translate-x-1">↓</span>
              </a>
              <a href="https://github.com/pepperonas/mxster/releases/download/v0.0.1-beta/mxster-cards-bw.pdf" target="_blank" rel="noopener noreferrer" class="btn btn-outline w-full flex items-center justify-between group">
                <span>📄 Schwarz-Weiß</span>
                <span class="transition-transform group-hover:translate-x-1">↓</span>
              </a>
              <a href="https://github.com/pepperonas/mxster/releases/download/v0.0.1-beta/mxster-cards-duplex.pdf" target="_blank" rel="noopener noreferrer" class="btn btn-outline w-full flex items-center justify-between group">
                <span>📄 Duplex (Farbig)</span>
                <span class="transition-transform group-hover:translate-x-1">↓</span>
              </a>
              <a href="https://github.com/pepperonas/mxster/releases/download/v0.0.1-beta/mxster-cards-bw-duplex.pdf" target="_blank" rel="noopener noreferrer" class="btn btn-outline w-full flex items-center justify-between group">
                <span>📄 Duplex (Schwarz-Weiß)</span>
                <span class="transition-transform group-hover:translate-x-1">↓</span>
              </a>
            </div>

            <div class="mt-6 p-4 bg-primary/30 rounded-lg">
              <p class="text-sm text-text-secondary">
                <strong>💡 Tipp:</strong> Duplex-Modus für beidseitigen Druck verwenden.
                Standard-Modus für einfaches Falten und Kleben.
              </p>
            </div>
          </div>

          <!-- 3D Models Downloads -->
          <div class="card">
            <div class="text-5xl mb-4">🎲</div>
            <h3 class="text-2xl font-bold mb-4 text-text-primary">
              3D-Druckmodelle
            </h3>
            <p class="text-text-secondary leading-relaxed mb-6">
              Lade STL-Dateien für hochwertige 3D-gedruckte Karten herunter. Dual-sided Design mit QR-Code.
            </p>

            <div class="space-y-3">
              <a href="https://github.com/pepperonas/mxster/releases/download/v0.0.1-beta/all-cards.3mf" target="_blank" rel="noopener noreferrer" class="btn btn-accent w-full flex items-center justify-between group">
                <span>📦 All-Cards (3MF)</span>
                <span class="transition-transform group-hover:translate-x-1">↓</span>
              </a>
              <a href="https://github.com/pepperonas/mxster/releases/download/v0.0.1-beta/mxster-stl-models.zip" target="_blank" rel="noopener noreferrer" class="btn btn-outline w-full flex items-center justify-between group">
                <span>📦 STL Modelle (ZIP)</span>
                <span class="transition-transform group-hover:translate-x-1">↓</span>
              </a>
              <a href="https://github.com/pepperonas/mxster/releases/download/v0.0.1-beta/mxster-scad-models.zip" target="_blank" rel="noopener noreferrer" class="btn btn-outline w-full flex items-center justify-between group">
                <span>📦 SCAD Modelle (ZIP)</span>
                <span class="transition-transform group-hover:translate-x-1">↓</span>
              </a>
              <a href="https://github.com/pepperonas/mxster/tree/main/card-generator/models" target="_blank" rel="noopener noreferrer" class="btn btn-outline w-full flex items-center justify-between group">
                <span>📂 Einzelne Modelle</span>
                <span class="transition-transform group-hover:translate-x-1">→</span>
              </a>
            </div>

            <div class="mt-6 p-4 bg-primary/30 rounded-lg space-y-2">
              <p class="text-sm text-text-secondary">
                <strong>⚙️ Druckeinstellungen:</strong>
              </p>
              <ul class="text-xs text-text-secondary space-y-1 ml-4">
                <li>• Layer Height: 0.1-0.15mm</li>
                <li>• Infill: 100%</li>
                <li>• Material: PLA oder PETG</li>
                <li>• Support: Nicht nötig</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- How to Play Section -->
      <div class="max-w-5xl mx-auto px-6 py-20" id="how-to-play">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold text-gradient mb-4">
            Wie funktioniert's?
          </h2>
          <p class="text-xl text-text-secondary">
            In 4 einfachen Schritten zum Musikexperten
          </p>
        </div>

        <!-- Steps -->
        <div class="space-y-8">
          <!-- Step 1 -->
          <div class="glass p-8 rounded-2xl flex items-start gap-6 hover:shadow-glow-md transition-all">
            <div class="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-2xl font-bold shadow-glow-sm">
              1
            </div>
            <div>
              <h3 class="text-2xl font-bold mb-2 text-text-primary">Wähle Spielmodus & Variante</h3>
              <p class="text-text-secondary leading-relaxed">
                Entscheide dich für Ratespiel, Timeline Persönlich oder Timeline Global.
                Wähle dann zwischen physischen Karten (mit QR-Codes) oder virtuellen Karten.
              </p>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="glass p-8 rounded-2xl flex items-start gap-6 hover:shadow-glow-md transition-all">
            <div class="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-2xl font-bold shadow-glow-sm">
              2
            </div>
            <div>
              <h3 class="text-2xl font-bold mb-2 text-text-primary">Spieler hinzufügen</h3>
              <p class="text-text-secondary leading-relaxed">
                Füge mindestens 2 Spieler hinzu. Bei physischen Karten wird automatisch ein DJ bestimmt,
                der die QR-Codes scannt. Bei virtuellen Karten werden Songs automatisch gezogen.
              </p>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="glass p-8 rounded-2xl flex items-start gap-6 hover:shadow-glow-md transition-all">
            <div class="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-2xl font-bold shadow-glow-sm">
              3
            </div>
            <div>
              <h3 class="text-2xl font-bold mb-2 text-text-primary">Rate oder Platziere</h3>
              <p class="text-text-secondary leading-relaxed">
                <strong>Ratespiel:</strong> Gib Titel, Künstler und Jahr ein. Sammle Punkte für jede richtige Antwort!<br>
                <strong>Timeline-Modi:</strong> Platziere Songs manuell in chronologischer Reihenfolge.
                Fuzzy-Matching erkennt auch ungenaue Eingaben!
              </p>
            </div>
          </div>

          <!-- Step 4 -->
          <div class="glass p-8 rounded-2xl flex items-start gap-6 hover:shadow-glow-md transition-all">
            <div class="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-2xl font-bold shadow-glow-sm">
              4
            </div>
            <div>
              <h3 class="text-2xl font-bold mb-2 text-text-primary">Gewinne das Spiel</h3>
              <p class="text-text-secondary leading-relaxed">
                <strong>Ratespiel:</strong> Wer nach 10 Karten die meisten Punkte hat, gewinnt!<br>
                <strong>Timeline-Modi:</strong> Wer zuerst 10 Karten richtig platziert, ist der Gewinner!<br>
                Die Punkteübersicht zeigt live Updates nach jeder Runde.
              </p>
            </div>
          </div>
        </div>

        <!-- Start Button -->
        <div class="text-center mt-16">
          <button
            class="btn btn-accent px-12 py-4 text-xl shadow-glow-accent group"
            onclick="this.dispatchEvent(new Event('login', { bubbles: true }))"
          >
            <span>🎮</span>
            Jetzt loslegen
            <span class="transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>

      <!-- Features Section -->
      <div class="max-w-7xl mx-auto px-6 py-20" id="features">
        <div class="grid md:grid-cols-3 gap-8">
          <!-- Feature 1: Fuzzy Matching -->
          <div class="card group hover:shadow-glow-md cursor-pointer">
            <div class="text-5xl mb-4">🎯</div>
            <h3 class="text-2xl font-bold mb-3 text-text-primary group-hover:text-gradient">
              Tolerantes Raten
            </h3>
            <p class="text-text-secondary leading-relaxed">
              Fuzzy Matching erkennt Tippfehler (bis zu 3), Groß-/Kleinschreibung egal,
              Sonderzeichen werden ignoriert. Jahr muss exakt stimmen.
            </p>
          </div>

          <!-- Feature 2: Spotify Integration -->
          <div class="card group hover:shadow-glow-md cursor-pointer">
            <div class="text-5xl mb-4">🎧</div>
            <h3 class="text-2xl font-bold mb-3 text-text-primary group-hover:text-gradient">
              Spotify Premium
            </h3>
            <p class="text-text-secondary leading-relaxed">
              Volle Song-Wiedergabe mit Spotify Web Playback SDK. Höre komplette Tracks,
              keine 30-Sekunden-Previews. Echter Musikgenuss.
            </p>
          </div>

          <!-- Feature 3: PWA -->
          <div class="card group hover:shadow-glow-md cursor-pointer">
            <div class="text-5xl mb-4">📱</div>
            <h3 class="text-2xl font-bold mb-3 text-text-primary group-hover:text-gradient">
              Progressive Web App
            </h3>
            <p class="text-text-secondary leading-relaxed">
              Installiere die App auf deinem Smartphone für ein natives App-Erlebnis.
              Offline-Funktionalität und schnelle Ladezeiten inklusive.
            </p>
          </div>
        </div>
      </div>

      <!-- Open Source Section -->
      <div class="max-w-7xl mx-auto px-6 py-20" id="open-source">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold text-gradient mb-4">
            Open Source
          </h2>
          <p class="text-xl text-text-secondary">
            mxster ist komplett Open Source und auf GitHub verfügbar
          </p>
        </div>

        <div class="max-w-4xl mx-auto">
          <div class="glass p-10 rounded-3xl hover:shadow-glow-md transition-all">
            <div class="flex flex-col md:flex-row items-center gap-8">
              <!-- GitHub Icon -->
              <div class="flex-shrink-0">
                <div class="w-24 h-24 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-5xl shadow-glow-sm">
                  🐙
                </div>
              </div>

              <!-- Content -->
              <div class="flex-1 text-center md:text-left">
                <h3 class="text-3xl font-bold mb-3 text-text-primary">
                  Auf GitHub
                </h3>
                <p class="text-text-secondary leading-relaxed mb-6">
                  Der komplette Quellcode ist öffentlich auf GitHub verfügbar.
                  Schau dir den Code an, lerne daraus, oder trage selbst bei!
                </p>

                <div class="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-text-secondary mb-6">
                  <div class="flex items-center gap-2">
                    <span class="text-accent">⭐</span>
                    <span>Star das Projekt</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-accent">🔧</span>
                    <span>Fork & Contribute</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-accent">🐛</span>
                    <span>Issues melden</span>
                  </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-4">
                  <a
                    href="https://github.com/pepperonas/mxster"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn btn-accent px-8 py-3 group inline-flex items-center justify-center gap-2"
                  >
                    <span>🐙</span>
                    <span>Zum GitHub Repository</span>
                    <span class="transition-transform group-hover:translate-x-1">→</span>
                  </a>
                  <a
                    href="https://github.com/pepperonas/mxster/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn btn-outline px-8 py-3 inline-flex items-center justify-center gap-2"
                  >
                    <span>💬</span>
                    <span>Issues & Diskussionen</span>
                  </a>
                </div>
              </div>
            </div>

            <!-- GitHub Stats (optional) -->
            <div class="mt-8 pt-8 border-t border-white/10">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div class="text-2xl font-bold text-gradient mb-1">100%</div>
                  <div class="text-sm text-text-secondary">Open Source</div>
                </div>
                <div>
                  <div class="text-2xl font-bold text-gradient mb-1">MIT</div>
                  <div class="text-sm text-text-secondary">Lizenz</div>
                </div>
                <div>
                  <div class="text-2xl font-bold text-gradient mb-1">3</div>
                  <div class="text-sm text-text-secondary">Spielmodi</div>
                </div>
                <div>
                  <div class="text-2xl font-bold text-gradient mb-1">∞</div>
                  <div class="text-sm text-text-secondary">Songs möglich</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Support Section -->
      <div class="max-w-5xl mx-auto px-6 py-20" id="support">
        <div class="glass p-12 rounded-3xl text-center hover:shadow-glow-md transition-all">
          <div class="text-6xl mb-6">☕</div>
          <h2 class="text-4xl md:text-5xl font-bold text-gradient mb-6">
            Unterstütze mxster
          </h2>
          <p class="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed mb-8">
            mxster ist komplett kostenlos und werbefrei. Wenn dir das Projekt gefällt
            und du die Weiterentwicklung unterstützen möchtest, freue ich mich über eine kleine Spende!
          </p>

          <div class="max-w-xl mx-auto mb-8">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-text-secondary mb-6">
              <div class="flex flex-col items-center gap-2">
                <span class="text-2xl">🎮</span>
                <span>Neue Features</span>
              </div>
              <div class="flex flex-col items-center gap-2">
                <span class="text-2xl">🎵</span>
                <span>Mehr Songs</span>
              </div>
              <div class="flex flex-col items-center gap-2">
                <span class="text-2xl">🚀</span>
                <span>Server-Kosten</span>
              </div>
            </div>
          </div>

          <form action="https://www.paypal.com/donate" method="post" target="_blank" class="inline-block">
            <input type="hidden" name="business" value="martin.pfeffer@celox.io" />
            <input type="hidden" name="no_recurring" value="0" />
            <input type="hidden" name="item_name" value="Unterstützung für mxster - Music Timeline Game" />
            <input type="hidden" name="currency_code" value="EUR" />
            <button type="submit" class="btn btn-accent px-12 py-4 text-xl shadow-glow-accent group">
              <span>💝</span>
              Via PayPal spenden
              <span class="transition-transform group-hover:translate-x-1">→</span>
            </button>
          </form>

          <p class="text-sm text-text-secondary mt-6">
            Jeder Beitrag hilft, mxster noch besser zu machen. Vielen Dank! ❤️
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="max-w-7xl mx-auto px-6 py-12 border-t border-white/10 text-center text-text-secondary">
        <p class="mb-2">
          Entwickelt mit ❤️ für Musikliebhaber
        </p>
        <p class="mb-6 text-sm">
          © ${new Date().getFullYear()} Martin Pfeffer
        </p>
        <div class="flex flex-wrap gap-6 justify-center text-sm">
          <a href="https://celox.io/datenschutz" target="_blank" class="hover:text-secondary transition-colors">
            Datenschutz
          </a>
          <a href="https://celox.io/impressum" target="_blank" class="hover:text-secondary transition-colors">
            Impressum
          </a>
          <a href="https://github.com/pepperonas" target="_blank" class="hover:text-secondary transition-colors">
            GitHub
          </a>
        </div>
      </div>
    </div>
  `
}

/**
 * Attach event listeners for landing page
 */
export function attachLandingPageListeners(onLoginClick) {
  // Login button click handler
  document.addEventListener('login', (e) => {
    e.preventDefault()
    onLoginClick()
  })
}
