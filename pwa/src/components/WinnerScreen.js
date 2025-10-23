/**
 * Winner Screen Component
 *
 * Celebrates the winner with confetti effect and podium
 */

export function renderWinnerScreen(players) {
  // Sort players by tokens (descending)
  const sortedPlayers = [...players].sort((a, b) => (b.tokens || 0) - (a.tokens || 0))
  const winner = sortedPlayers[0]
  const secondPlace = sortedPlayers[1]
  const thirdPlace = sortedPlayers[2]

  return `
    <div class="min-h-screen bg-background relative overflow-hidden">
      <!-- Animated Background -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute inset-0 bg-gradient-to-br from-secondary via-accent to-secondary bg-[length:400%_400%] animate-float"></div>
      </div>

      <!-- Confetti Animation (CSS only) -->
      <div class="absolute inset-0 pointer-events-none">
        ${Array.from({ length: 50 }).map((_, i) => `
          <div
            class="absolute w-2 h-2 bg-gradient-to-br ${
              i % 3 === 0 ? 'from-secondary to-accent' :
              i % 3 === 1 ? 'from-accent to-secondary' :
              'from-secondary to-secondary'
            } rounded-full animate-float opacity-60"
            style="
              left: ${Math.random() * 100}%;
              top: -20px;
              animation-delay: ${Math.random() * 3}s;
              animation-duration: ${3 + Math.random() * 2}s;
            "
          ></div>
        `).join('')}
      </div>

      <!-- Content -->
      <div class="relative max-w-5xl mx-auto px-6 py-12 md:py-20">
        <div class="text-center space-y-8 animate-fade-in">
          <!-- Trophy Animation -->
          <div class="text-8xl md:text-9xl animate-float mb-8">
            🏆
          </div>

          <!-- Winner Announcement -->
          <div class="space-y-4">
            <h1 class="text-5xl md:text-7xl font-extrabold text-gradient animate-slide-up">
              ${winner.name}
            </h1>
            <p class="text-2xl md:text-3xl text-text-secondary font-medium">
              ist der Gewinner!
            </p>
          </div>

          <!-- Winner Stats -->
          <div class="glass p-8 rounded-2xl max-w-md mx-auto shadow-glow-lg">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-text-secondary">Token:</span>
                <span class="text-3xl font-bold text-gradient">${winner.tokens || 0}🪙</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-text-secondary">Karten gespielt:</span>
                <span class="text-2xl font-semibold text-text-primary">${winner.cards || 0}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-text-secondary">Erfolgsquote:</span>
                <span class="text-2xl font-semibold text-text-primary">
                  ${calculateSuccessRate(winner)}%
                </span>
              </div>
            </div>
          </div>

          <!-- Podium -->
          <div class="pt-12">
            <h2 class="text-2xl font-bold mb-8 text-text-primary">
              🏅 Podium
            </h2>

            <div class="flex items-end justify-center gap-4 max-w-3xl mx-auto">
              <!-- 2nd Place -->
              ${secondPlace ? `
                <div class="flex-1 max-w-xs">
                  <div class="glass p-6 rounded-t-2xl text-center bg-gradient-to-b from-gray-400/20 to-gray-500/20 border-2 border-gray-400/30">
                    <div class="text-5xl mb-3">🥈</div>
                    <div class="font-bold text-xl text-text-primary mb-2">${secondPlace.name}</div>
                    <div class="text-2xl font-bold text-gradient">${secondPlace.tokens || 0}🪙</div>
                  </div>
                  <div class="h-32 bg-gradient-to-b from-gray-400/20 to-gray-500/30 rounded-b-xl border-2 border-t-0 border-gray-400/30"></div>
                </div>
              ` : ''}

              <!-- 1st Place -->
              <div class="flex-1 max-w-xs -mt-8">
                <div class="glass p-8 rounded-t-2xl text-center bg-gradient-to-b from-accent/30 to-secondary/30 border-2 border-accent shadow-glow-accent">
                  <div class="text-6xl mb-4 animate-float">🥇</div>
                  <div class="font-bold text-2xl text-text-primary mb-3">${winner.name}</div>
                  <div class="text-3xl font-bold text-gradient">${winner.tokens || 0}🪙</div>
                </div>
                <div class="h-48 bg-gradient-to-b from-accent/30 to-secondary/40 rounded-b-xl border-2 border-t-0 border-accent shadow-glow-accent"></div>
              </div>

              <!-- 3rd Place -->
              ${thirdPlace ? `
                <div class="flex-1 max-w-xs">
                  <div class="glass p-6 rounded-t-2xl text-center bg-gradient-to-b from-amber-700/20 to-amber-800/20 border-2 border-amber-700/30">
                    <div class="text-5xl mb-3">🥉</div>
                    <div class="font-bold text-xl text-text-primary mb-2">${thirdPlace.name}</div>
                    <div class="text-2xl font-bold text-gradient">${thirdPlace.tokens || 0}🪙</div>
                  </div>
                  <div class="h-24 bg-gradient-to-b from-amber-700/20 to-amber-800/30 rounded-b-xl border-2 border-t-0 border-amber-700/30"></div>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- All Players -->
          ${sortedPlayers.length > 3 ? `
            <div class="pt-12">
              <h2 class="text-2xl font-bold mb-6 text-text-primary">
                📊 Alle Spieler
              </h2>

              <div class="space-y-3 max-w-2xl mx-auto">
                ${sortedPlayers.slice(3).map((player, index) => `
                  <div class="glass p-4 rounded-xl flex items-center justify-between hover:shadow-glow-sm transition-all">
                    <div class="flex items-center gap-4">
                      <div class="text-xl font-bold text-text-secondary">
                        #${index + 4}
                      </div>
                      <div class="font-semibold text-text-primary">
                        ${player.name}
                      </div>
                    </div>
                    <div class="text-xl font-bold text-gradient">
                      ${player.tokens || 0}🪙
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center pt-12">
            <button
              class="btn btn-accent px-10 py-4 text-lg w-full sm:w-auto group"
              onclick="window.game.startNewGame()"
            >
              <span>🎮</span>
              Neues Spiel
              <span class="transition-transform group-hover:translate-x-1">→</span>
            </button>

            <button
              class="btn-outline btn px-10 py-4 text-lg w-full sm:w-auto"
              onclick="window.game.showStatistics()"
            >
              <span>📊</span>
              Statistiken
            </button>

            <button
              class="btn-outline btn px-10 py-4 text-lg w-full sm:w-auto"
              onclick="window.game.backToSetup()"
            >
              <span>←</span>
              Zurück
            </button>
          </div>

          <!-- Fun Facts -->
          <div class="pt-12">
            <div class="glass p-6 rounded-xl max-w-md mx-auto">
              <h3 class="font-bold text-lg mb-3 text-text-primary">
                🎯 Fun Facts
              </h3>
              <div class="space-y-2 text-text-secondary text-sm">
                ${generateFunFacts(sortedPlayers)}
              </div>
            </div>
          </div>

          <!-- Share Section -->
          <div class="pt-8">
            <p class="text-text-secondary mb-4">
              Teile dein Ergebnis:
            </p>
            <div class="flex gap-3 justify-center flex-wrap">
              <button
                class="glass px-6 py-3 rounded-lg hover:shadow-glow-sm transition-all"
                onclick="window.game.shareResults('twitter')"
              >
                <span>🐦</span> Twitter
              </button>
              <button
                class="glass px-6 py-3 rounded-lg hover:shadow-glow-sm transition-all"
                onclick="window.game.shareResults('whatsapp')"
              >
                <span>💬</span> WhatsApp
              </button>
              <button
                class="glass px-6 py-3 rounded-lg hover:shadow-glow-sm transition-all"
                onclick="window.game.shareResults('copy')"
              >
                <span>📋</span> Kopieren
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * Calculate success rate for player
 */
function calculateSuccessRate(player) {
  const cards = player.cards || 0
  const tokens = player.tokens || 0

  if (cards === 0) return 0

  // Estimate success: if average tokens per card >= 1, that's ~75% success
  const avgTokensPerCard = tokens / cards
  const successRate = Math.min(100, Math.round(avgTokensPerCard * 50))

  return successRate
}

/**
 * Generate fun facts about the game
 */
function generateFunFacts(players) {
  const totalTokens = players.reduce((sum, p) => sum + (p.tokens || 0), 0)
  const totalCards = players.reduce((sum, p) => sum + (p.cards || 0), 0)
  const avgTokens = players.length > 0 ? (totalTokens / players.length).toFixed(1) : 0

  // Find player with most cards
  const mostCardsPlayer = [...players].sort((a, b) => (b.cards || 0) - (a.cards || 0))[0]

  const facts = [
    `Insgesamt ${totalTokens}🪙 Token verdient`,
    `${totalCards} Songs wurden gespielt`,
    `Durchschnitt: ${avgTokens}🪙 Token pro Spieler`,
    `${mostCardsPlayer.name} hat die meisten Karten gespielt (${mostCardsPlayer.cards || 0})`
  ]

  return facts.map(fact => `
    <div class="flex items-start gap-2">
      <span class="text-accent">•</span>
      <span>${fact}</span>
    </div>
  `).join('')
}
