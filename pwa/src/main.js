import './styles/tailwind.css'
import './styles/beatAnimations.css'
import QrScanner from 'qr-scanner'
import { Howl } from 'howler'
import { songs } from './data/songs.js'
import { GameState } from './utils/gameState.js'
import gameHistory from './utils/gameHistory.js'
import spotifyAuth from './utils/spotifyAuth.js'
import spotifyPlayer from './utils/spotifyPlayer.js'
import { getIconHTML } from './utils/icons.js'
import { checkSongGuess } from './utils/textMatcher.js'
import { renderLandingPage, attachLandingPageListeners } from './components/LandingPage.js'
import { renderStatistics } from './components/Statistics.js'
import { renderWinnerScreen } from './components/WinnerScreen.js'
import { GAME_MODES, GAME_MODE_INFO, GAME_VARIANTS, GAME_VARIANT_INFO } from './utils/gameModes.js'
import beatAnimator from './services/SpotifyBeatAnimator.js'
import beatSyncConfig from './services/BeatSyncConfig.js'
import beatSyncSettings from './components/BeatSyncSettings.js'
import { applyBeatAnimation } from './utils/animationEffects.js'

class MxsterGame {
  constructor() {
    this.currentDJ = 0  // Aktueller DJ (scannt die Karte)
    this.currentPlayer = 0  // Aktueller Spieler (platziert die Karte)
    this.players = []
    this.currentSong = null
    this.lastScannedCode = null
    this.qrScanner = null  // QR Scanner instance
    this.gameState = new GameState()
    this.spotifyReady = false
    this.waitingForGuess = false  // Wartet auf Song/Artist Guess
    this.gameMode = null  // Selected game mode (GUESS, TIMELINE_PERSONAL, TIMELINE_GLOBAL)
    this.gameVariant = null  // Selected game variant (PHYSICAL or VIRTUAL)
    this.globalTimeline = []  // Shared timeline for TIMELINE_GLOBAL mode
    this.playedSongs = []  // Track already played songs in current game

    // Beat Sync properties
    this.beatSyncEnabled = false
    this.beatSyncConfig = beatSyncConfig
    this.currentTrackId = null

    // Headphone button long press detection
    this.headphonePressStart = null
    this.headphonePressTimer = null

    this.init()
  }

  async init() {
    if (window.location.pathname === '/callback') {
      await this.handleSpotifyCallback()
      return
    }

    // Initialize Beat Sync Config
    beatSyncConfig.load()

    // Make globally accessible
    window.beatSyncSettings = beatSyncSettings
    window.beatAnimator = beatAnimator

    // Prüfe ob bereits eingeloggt (inkl. automatischem Token-Refresh)
    const isLoggedIn = await spotifyAuth.loadFromStorage()
    if (isLoggedIn) {
      console.log('✅ Bereits bei Spotify eingeloggt (Token gültig)')
      await this.initializeSpotifyPlayer()
      this.initializeBeatSync()
      // Starte periodischen Token-Check
      spotifyAuth.startRefreshCheck()
      this.proceedToGame()
    } else {
      console.log('🔐 Nicht eingeloggt oder Token abgelaufen')
      this.renderLoginScreen()
    }
  }

  async handleSpotifyCallback() {
    const app = document.getElementById('app')
    app.innerHTML = `
      <div class="start-screen container-padding">
        <div class="card">
          <h2>🔐 Authentifizierung</h2>
          <p>Verbinde mit Spotify...</p>
          <div class="animate-pulse" style="margin-top: 20px; text-align: center;">⏳</div>
        </div>
      </div>
    `

    const accessToken = await spotifyAuth.handleCallback()

    if (accessToken) {
      console.log('✅ Spotify Login erfolgreich')
      await this.initializeSpotifyPlayer()
      // Starte periodischen Token-Check
      spotifyAuth.startRefreshCheck()
      window.history.pushState({}, '', '/')
      this.proceedToGame()
    } else {
      console.error('❌ Spotify Login fehlgeschlagen')
      app.innerHTML = `
        <div class="start-screen container-padding">
          <div class="card">
            <h2>❌ Login fehlgeschlagen</h2>
            <p>Die Verbindung zu Spotify konnte nicht hergestellt werden.</p>
            <button class="btn btn-accent" onclick="game.renderLoginScreen()" style="width: 100%; margin-top: 20px;">
              ${getIconHTML('close')} Zurück
            </button>
          </div>
        </div>
      `
    }
  }

  async initializeSpotifyPlayer() {
    try {
      const accessToken = spotifyAuth.getAccessToken()
      await spotifyPlayer.initialize(accessToken)
      this.spotifyReady = true
      console.log('✅ Spotify Player bereit')
    } catch (error) {
      console.error('❌ Spotify Player Fehler:', error)
      this.showModal(
        'Spotify Player Fehler',
        `<p>Der Spotify Player konnte nicht initialisiert werden.</p>
         <p style="color: var(--accent); margin-top: 16px;"><strong>Hinweis:</strong> Du benötigst einen Spotify Premium Account!</p>
         <p style="margin-top: 16px; color: var(--text-secondary);">${error.message}</p>`,
        [
          { text: 'Neu versuchen', onclick: 'game.renderLoginScreen()', className: 'btn-accent' }
        ]
      )
      spotifyAuth.logout()
    }
  }

  proceedToGame() {
    const savedGame = this.gameState.load()
    if (savedGame && savedGame.players && savedGame.players.length > 0) {
      this.showRestoreDialog(savedGame)
    } else {
      this.renderModeSelection()
    }
  }

  renderLoginScreen() {
    const app = document.getElementById('app')
    app.innerHTML = renderLandingPage(() => this.spotifyLogin())
    attachLandingPageListeners(() => this.spotifyLogin())
  }

  async spotifyLogin() {
    await spotifyAuth.login()
  }

  showRestoreDialog(savedGame) {
    const lastPlayed = new Date(savedGame.timestamp).toLocaleString('de-DE')
    this.showModal(
      'Gespeichertes Spiel gefunden',
      `<p><strong>Letztes Spiel vom:</strong> ${lastPlayed}</p>
       <p style="margin-top: 12px;"><strong>Spieler:</strong> ${savedGame.players.map(p => p.name).join(', ')}</p>
       <div class="card" style="background: var(--primary); margin-top: 20px; padding: 16px;">
         <p style="margin: 0;"><strong>Fortschritt:</strong></p>
         ${savedGame.players.map(p => `<p style="margin: 8px 0 0 0;">• ${p.name}: ${p.cards}/10 Karten</p>`).join('')}
       </div>`,
      [
        { text: `${getIconHTML('check')} Spiel fortsetzen`, onclick: 'game.restoreGame()', className: 'btn-accent' },
        { text: `${getIconHTML('plus')} Neues Spiel`, onclick: 'game.startNewGame()', className: 'btn-outline' }
      ],
      { required: true }
    )
  }

  restoreGame() {
    const saved = this.gameState.load()
    this.players = saved.players
    this.currentPlayer = saved.currentPlayer || 0
    this.currentDJ = saved.currentDJ || 0
    this.currentSong = saved.currentSong || null
    this.gameMode = saved.gameMode || GAME_MODES.GUESS
    this.gameVariant = saved.gameVariant || GAME_VARIANTS.PHYSICAL
    this.globalTimeline = saved.globalTimeline || []  // Lade globale Timeline
    this.playedSongs = saved.playedSongs || []  // Lade gespielte Songs
    console.log('✅ Spiel wiederhergestellt:', GAME_MODE_INFO[this.gameMode].name, '/', GAME_VARIANT_INFO[this.gameVariant].name)
    console.log(`   Bereits gespielte Songs: ${this.playedSongs.length}`)
    this.closeModal()
    this.renderGameScreen()
  }

  saveGame() {
    this.gameState.save({
      players: this.players,
      currentPlayer: this.currentPlayer,
      currentDJ: this.currentDJ,
      currentSong: this.currentSong,
      gameMode: this.gameMode,
      gameVariant: this.gameVariant,
      globalTimeline: this.globalTimeline,  // Speichere globale Timeline
      playedSongs: this.playedSongs,  // Speichere gespielte Songs
      timestamp: Date.now()
    })
  }

  renderModeSelection() {
    const app = document.getElementById('app')
    app.innerHTML = `
      <div class="start-screen container-padding">
        <h1 style="text-align: center; margin-bottom: 20px;">🎵 mxster</h1>
        <p style="text-align: center; color: var(--text-secondary); margin-bottom: 40px;">
          Wähle deinen Spielmodus
        </p>

        <div style="display: grid; gap: 20px; max-width: 800px; margin: 0 auto;">
          ${Object.values(GAME_MODES).map(mode => {
            const info = GAME_MODE_INFO[mode]
            return `
              <div class="card" style="cursor: pointer; transition: all 0.2s;"
                   onclick="game.selectMode('${mode}')"
                   onmouseenter="this.style.transform='scale(1.02)'; this.style.borderColor='var(--accent)'"
                   onmouseleave="this.style.transform='scale(1)'; this.style.borderColor='var(--border)'">
                <div style="display: flex; align-items: center; gap: 20px;">
                  <div style="font-size: 48px;">${info.icon}</div>
                  <div style="flex: 1;">
                    <h3 style="margin: 0 0 8px 0;">${info.name}</h3>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">
                      ${info.description}
                    </p>
                  </div>
                  <div style="color: var(--accent);">
                    ${getIconHTML('chevronRight')}
                  </div>
                </div>
              </div>
            `
          }).join('')}
        </div>

        <button class="btn btn-outline btn-mobile-full"
                onclick="game.renderLoginScreen()"
                style="width: 100%; margin-top: 24px;">
          ${getIconHTML('home')} Zurück zur Startseite
        </button>
      </div>
    `
  }

  selectMode(mode) {
    this.gameMode = mode
    console.log('✅ Spielmodus gewählt:', GAME_MODE_INFO[mode].name)
    this.renderVariantSelection()
  }

  renderVariantSelection() {
    const app = document.getElementById('app')
    const modeInfo = GAME_MODE_INFO[this.gameMode]

    app.innerHTML = `
      <div class="start-screen container-padding">
        <h1 style="text-align: center; margin-bottom: 20px;">🎵 mxster</h1>
        <p style="text-align: center; color: var(--text-secondary); margin-bottom: 40px;">
          ${modeInfo.icon} ${modeInfo.name}
        </p>

        <div style="display: grid; gap: 20px; max-width: 800px; margin: 0 auto;">
          ${Object.values(GAME_VARIANTS).map(variant => {
            const info = GAME_VARIANT_INFO[variant]
            return `
              <div class="card" style="cursor: pointer; transition: all 0.2s;"
                   onclick="game.selectVariant('${variant}')"
                   onmouseenter="this.style.transform='scale(1.02)'; this.style.borderColor='var(--accent)'"
                   onmouseleave="this.style.transform='scale(1)'; this.style.borderColor='var(--border)'">
                <div style="display: flex; align-items: center; gap: 20px;">
                  <div style="font-size: 48px;">${info.icon}</div>
                  <div style="flex: 1;">
                    <h3 style="margin: 0 0 8px 0;">${info.name}</h3>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">
                      ${info.description}
                    </p>
                  </div>
                  <div style="color: var(--accent);">
                    ${getIconHTML('chevronRight')}
                  </div>
                </div>
              </div>
            `
          }).join('')}
        </div>

        <button class="btn btn-outline btn-mobile-full"
                onclick="game.renderModeSelection()"
                style="width: 100%; margin-top: 24px;">
          ${getIconHTML('arrowLeft')} Zurück zur Modus-Auswahl
        </button>
      </div>
    `
  }

  selectVariant(variant) {
    this.gameVariant = variant
    console.log('✅ Spielvariante gewählt:', GAME_VARIANT_INFO[variant].name)
    this.renderStartScreen()
  }

  renderStartScreen() {
    const app = document.getElementById('app')
    app.innerHTML = `
      <div class="start-screen container-padding">
        <h1 style="text-align: center; margin-bottom: 40px;">🎵 mxster</h1>

        <div class="card">
          <div class="modal-header">
            <h2>${getIconHTML('users')} Spieler hinzufügen</h2>
          </div>
          <div class="modal-body">
            <div class="guess-inputs">
              <input type="text" id="player-name" class="input" placeholder="Spielername eingeben"
                     onkeypress="if(event.key==='Enter') game.addPlayer()">
              <button class="btn btn-accent" onclick="game.addPlayer()">
                ${getIconHTML('plus')} Hinzufügen
              </button>
            </div>
            <div id="player-list" style="margin-top: 20px;"></div>
          </div>
        </div>

        <button class="btn btn-accent btn-mobile-full"
                onclick="game.startGame()"
                style="width: 100%; margin-top: 24px; font-size: 18px; padding: 16px;"
                ${this.players.length < 2 ? 'disabled' : ''}>
          ${getIconHTML('music')} Spiel starten (${this.players.length} Spieler)
        </button>

        <div class="card" style="margin-top: 24px;">
          <div class="modal-header">
            <h3>${getIconHTML('save')} Spielhistorie verwalten</h3>
          </div>
          <div class="modal-body">
            <div class="guess-actions">
              <button class="btn btn-outline btn-mobile-full" onclick="game.exportGame()" style="flex: 1;">
                ${getIconHTML('download')} Exportieren
              </button>
              <button class="btn btn-outline btn-mobile-full" onclick="document.getElementById('import-file').click()" style="flex: 1;">
                ${getIconHTML('upload')} Importieren
              </button>
              <input type="file" id="import-file" accept=".json" style="display: none;"
                     onchange="game.importGame(event)">
            </div>
            <p style="margin-top: 16px; font-size: 14px; color: var(--text-secondary);">
              Sichere Spielhistorie als JSON-Datei oder lade gespeicherte Historie.
            </p>
          </div>
        </div>

        <button class="btn btn-outline btn-mobile-full"
                onclick="game.renderVariantSelection()"
                style="width: 100%; margin-top: 24px;">
          ${getIconHTML('arrowLeft')} Zurück zur Varianten-Auswahl
        </button>
      </div>
    `
    this.updatePlayerList()
  }

  addPlayer() {
    const input = document.getElementById('player-name')
    const name = input.value.trim()
    if (name) {
      // Spieler
      this.players.push({
        name,
        timeline: [],  // Karten in der Timeline
        cards: 0,      // Anzahl korrekt platzierter Karten
        score: 0       // Punkte (für Guess-Modus)
      })
      input.value = ''
      this.updatePlayerList()
      this.renderStartScreen()  // Re-render to update button state

      // Fokus auf Input-Feld setzen nach Re-Rendering
      setTimeout(() => {
        const newInput = document.getElementById('player-name')
        if (newInput) newInput.focus()
      }, 0)
    }
  }

  updatePlayerList() {
    const list = document.getElementById('player-list')
    if (!list) return

    if (this.players.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Noch keine Spieler hinzugefügt</p>'
      return
    }

    list.innerHTML = this.players.map((p, i) =>
      `<div class="player-row">
        <div>
          <strong>${i + 1}. ${p.name}</strong>
        </div>
        <button class="btn btn-danger" onclick="game.removePlayer(${i})"
                style="padding: 8px 12px; min-height: auto;">
          ${getIconHTML('trash')}
        </button>
      </div>`
    ).join('')
  }

  removePlayer(index) {
    this.players.splice(index, 1)
    this.renderStartScreen()
  }

  startGame() {
    if (this.players.length < 2) {
      this.showToast('Mindestens 2 Spieler benötigt!', 'warning')
      return
    }

    // Reset played songs list for new game
    this.playedSongs = []

    // DJ ist Spieler 0, aktiver Spieler ist Spieler 1 (nächster nach DJ)
    this.currentDJ = 0
    this.currentPlayer = 1

    // Spieler starten mit leeren Timelines
    this.players.forEach(player => {
      player.timeline = []
      player.cards = 0
    })

    this.saveGame()
    this.renderGameScreen()
  }

  renderGameScreen() {
    const app = document.getElementById('app')
    const dj = this.players[this.currentDJ]
    const player = this.players[this.currentPlayer]

    app.innerHTML = `
      <!-- Action Bar -->
      <div class="action-bar">
        <button class="hamburger-btn" onclick="game.toggleSidebar()" id="hamburger-btn">
          <div class="hamburger-icon">
            <div class="hamburger-line"></div>
            <div class="hamburger-line"></div>
            <div class="hamburger-line"></div>
          </div>
        </button>
        <div class="action-bar-title">🎵 mxster</div>
      </div>

      <!-- Sidebar -->
      <div class="sidebar" id="sidebar">
        <div class="sidebar-menu">
          <button class="sidebar-item" onclick="game.showInstructions(); game.closeSidebar();">
            ${getIconHTML('info')}
            <span>Anleitung</span>
          </button>
          <button class="sidebar-item" onclick="game.showScoreboard(); game.closeSidebar();">
            ${getIconHTML('barchart')}
            <span>Spielstand</span>
          </button>
          <button class="sidebar-item" onclick="game.showSettings(); game.closeSidebar();">
            ${getIconHTML('settings')}
            <span>Einstellungen</span>
          </button>
          <button class="sidebar-item danger" onclick="game.endGameEarly(); game.closeSidebar();">
            ${getIconHTML('close')}
            <span>Spiel beenden</span>
          </button>
        </div>
      </div>

      <!-- Sidebar Overlay -->
      <div class="sidebar-overlay" id="sidebar-overlay" onclick="game.closeSidebar()"></div>

      <div class="game-screen container-padding with-action-bar">
        <!-- Player Info -->
        <div class="header">
          <div class="player-info">
            <div>
              <h2 style="margin: 0; display: flex; align-items: center; gap: 12px;">
                <span
                  style="cursor: pointer; user-select: none; transition: transform 0.2s;"
                  id="dj-headphone-icon"
                  onmousedown="game.startHeadphonePress()"
                  onmouseup="game.endHeadphonePress()"
                  onmouseleave="game.endHeadphonePress()"
                  ontouchstart="game.startHeadphonePress()"
                  ontouchend="game.endHeadphonePress()"
                  ontouchcancel="game.endHeadphonePress()"
                  title="2s gedrückt halten für zufälligen Song">🎧</span>
                <span>DJ: ${dj.name}</span>
              </h2>
              <div style="display: flex; gap: 16px; margin-top: 8px; flex-wrap: wrap;">
                <div class="stat-item">
                  ${getIconHTML('users')} ${player.name}
                </div>
                <div class="stat-item">
                  ${getIconHTML('music')} ${player.cards}/10 Karten
                </div>
              </div>
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">
                <div style="display: flex; gap: 8px; align-items: center; font-size: 14px; color: var(--text-secondary);">
                  <span>${GAME_MODE_INFO[this.gameMode].icon}</span>
                  <span>${GAME_MODE_INFO[this.gameMode].name}</span>
                  <span>•</span>
                  <span>${GAME_VARIANT_INFO[this.gameVariant].icon}</span>
                  <span>${GAME_VARIANT_INFO[this.gameVariant].name}</span>
                </div>
              </div>

              <!-- Beat Sync Controls -->
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #3A3C4B;">
                <div style="display: flex; gap: 12px; align-items: stretch;">
                  <button class="beat-sync-toggle ${this.beatSyncEnabled ? 'active' : ''}"
                          onclick="game.toggleBeatSync()"
                          title="Beat-Animationen aktivieren">
                    <span class="icon">🎵</span>
                    <span>Beat Sync</span>
                  </button>
                  <button class="btn btn-outline beat-sync-settings-btn"
                          onclick="game.openBeatSettings()"
                          title="Beat Sync Einstellungen">
                    ${getIconHTML('settings')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- QR Scanner (Physical) or Virtual Button -->
        ${this.gameVariant === GAME_VARIANTS.PHYSICAL ? `
          <div class="scanner-container">
            <video id="qr-video"></video>
            <div class="scanner-label">
              ${getIconHTML('camera')}
              <span>Scanne QR-Code</span>
            </div>
          </div>
        ` : `
          <div class="card" style="text-align: center; padding: 40px;">
            <h3 style="margin-bottom: 24px;">💻 Virtueller Modus</h3>
            <button class="btn btn-accent" onclick="game.playRandomSong()"
                    style="font-size: 18px; padding: 20px 40px; min-height: 60px;">
              🎲 Zufälligen Song spielen
            </button>
            <p style="margin-top: 16px; font-size: 14px; color: var(--text-secondary);">
              Klicke auf den Button, um einen zufälligen Song aus der Datenbank abzuspielen
            </p>
          </div>
        `}

        <!-- Song Info (nur im Ratespiel-Modus) -->
        ${this.gameMode === GAME_MODES.GUESS ? `
          <div id="song-info" class="card" style="display: none;">
            <h3 id="song-title" style="margin-bottom: 8px;"></h3>
            <p id="song-artist" style="margin-bottom: 16px;"></p>
            <div class="year-display" id="song-year" style="display: none;"></div>
            <audio id="audio-player" class="audio-player" controls></audio>

            <!-- Guess Section -->
            <div id="guess-section" class="guess-form">
              <h4 style="margin-bottom: 16px;">🎯 Song, Artist & Jahr erraten</h4>
              <div class="guess-inputs">
                <input type="number" id="guess-year" class="input" placeholder="Jahr (z.B. 1985)"
                       min="1900" max="${new Date().getFullYear()}"
                       onkeypress="if(event.key==='Enter') document.getElementById('guess-title').focus()">
                <input type="text" id="guess-title" class="input" placeholder="Song Titel"
                       onkeypress="if(event.key==='Enter') document.getElementById('guess-artist').focus()">
                <input type="text" id="guess-artist" class="input" placeholder="Artist Name"
                       onkeypress="if(event.key==='Enter') game.checkGuess()">
              </div>
              <div class="guess-actions">
                <button class="btn btn-accent btn-mobile-full" onclick="game.checkGuess()" style="flex: 1;">
                  ${getIconHTML('check')} Prüfen
                </button>
                <button class="btn btn-outline btn-mobile-full" onclick="game.skipGuess()" style="flex: 1;">
                  ${getIconHTML('skip')} Überspringen
                </button>
              </div>
            </div>
          </div>
        ` : `
          <!-- Timeline Modus: Karte zum Verschieben -->
          <div id="song-card" class="card" style="display: none; cursor: move; user-select: none;" draggable="true">
            <div style="text-align: center;">
              <h3 id="timeline-song-title" style="margin-bottom: 8px;">🎵 Song Titel</h3>
              <p id="timeline-song-artist" style="margin-bottom: 16px; color: var(--text-secondary);">Artist Name</p>
              <audio id="timeline-audio-player" class="audio-player" controls></audio>
              <p style="margin-top: 16px; font-size: 14px; color: var(--text-secondary);">
                ${getIconHTML('move')} Ziehe diese Karte in die Timeline
              </p>
            </div>
          </div>
        `}

        <!-- Timeline or Score Overview -->
        ${this.gameMode === GAME_MODES.GUESS ? `
          <!-- Score Overview for Guess Mode -->
          <div class="card">
            <h3 style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">${getIconHTML('trophy')} Punkteübersicht</h3>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${this.players
                .map((p, originalIdx) => ({ ...p, originalIdx }))
                .sort((a, b) => b.score - a.score)
                .map((p, rank) => {
                  const isCurrentPlayer = p.originalIdx === this.currentPlayer
                  const medal = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : ''
                  return `
                    <div style="
                      display: flex;
                      align-items: center;
                      justify-content: space-between;
                      padding: 12px 16px;
                      background: ${isCurrentPlayer ? 'var(--accent)' : 'var(--bg-secondary)'};
                      border: 2px solid ${isCurrentPlayer ? 'var(--accent)' : 'var(--border)'};
                      border-radius: 8px;
                      transition: all 0.2s;
                    ">
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="
                          width: 40px;
                          height: 40px;
                          border-radius: 50%;
                          background: ${isCurrentPlayer ? 'rgba(255,255,255,0.2)' : 'var(--accent)'};
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          font-weight: bold;
                          font-size: ${medal ? '24px' : '18px'};
                          color: ${isCurrentPlayer ? 'white' : 'var(--bg)'};
                        ">
                          ${medal || (rank + 1)}
                        </div>
                        <div>
                          <div style="font-weight: 600; color: ${isCurrentPlayer ? 'white' : 'var(--text)'};">
                            ${p.name}
                          </div>
                          <div style="font-size: 12px; color: ${isCurrentPlayer ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)'};">
                            ${p.cards} Karten
                          </div>
                        </div>
                      </div>
                      <div style="
                        font-size: 32px;
                        font-weight: bold;
                        color: ${isCurrentPlayer ? 'white' : 'var(--accent)'};
                      ">
                        ${p.score}
                      </div>
                    </div>
                  `
                })
                .join('')}
            </div>
          </div>
        ` : `
          <!-- Timeline for Timeline Modes -->
          ${this.gameMode === GAME_MODES.TIMELINE_PERSONAL ? `
            <!-- All Players' Timelines (5 slots per row) -->
            ${this.players.map((p, pIdx) => `
              <div class="card" style="${pIdx === this.currentPlayer ? 'border: 2px solid var(--accent);' : ''}">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                  <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">
                    ${getIconHTML('users')} ${p.name}
                    ${pIdx === this.currentPlayer ? '<span style="margin-left: 8px; font-size: 14px; color: var(--accent);">← Aktuell</span>' : ''}
                  </h3>
                  <div style="
                    font-size: 14px;
                    font-weight: bold;
                    color: var(--accent);
                    padding: 6px 12px;
                    background: var(--bg-secondary);
                    border-radius: 8px;
                  ">
                    ${p.cards}/10
                  </div>
                </div>

                <!-- Progress Bar -->
                <div style="
                  width: 100%;
                  height: 8px;
                  background: var(--bg-secondary);
                  border-radius: 4px;
                  overflow: hidden;
                  margin-bottom: 16px;
                ">
                  <div style="
                    width: ${(p.cards / 10) * 100}%;
                    height: 100%;
                    background: linear-gradient(90deg, var(--secondary), var(--accent));
                    transition: width 0.5s ease;
                  "></div>
                </div>

                <!-- Card Grid: 5 per row, 2 rows -->
                <div style="
                  display: grid;
                  grid-template-columns: repeat(5, 1fr);
                  gap: 10px;
                ">
                  ${Array.from({ length: 10 }, (_, slotIndex) => {
                    const song = p.timeline[slotIndex]
                    const hasSong = !!song

                    return `
                      <div class="collected-card" style="
                        background: ${hasSong ? 'var(--bg-secondary)' : 'transparent'};
                        border: 2px ${hasSong ? 'solid var(--accent)' : 'dashed var(--border)'};
                        border-radius: 12px;
                        padding: 10px 8px;
                        text-align: center;
                        transition: all 0.3s;
                        position: relative;
                        overflow: hidden;
                        opacity: ${hasSong ? '1' : '0.4'};
                        aspect-ratio: 3/4;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                      ">
                        ${hasSong ? `
                          <!-- Success Badge -->
                          <div style="
                            position: absolute;
                            top: 4px;
                            right: 4px;
                            width: 18px;
                            height: 18px;
                            background: var(--accent);
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 11px;
                          ">
                            ✓
                          </div>

                          <!-- Year -->
                          <div style="
                            font-size: 20px;
                            font-weight: bold;
                            color: var(--text-primary);
                            margin-bottom: 4px;
                          ">
                            ${song.year}
                          </div>

                          <!-- Title (truncated) -->
                          <div style="
                            font-size: 9px;
                            color: var(--text-secondary);
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                            max-width: 100%;
                          " title="${song.title} - ${song.artist}">
                            ${song.title}
                          </div>
                        ` : `
                          <!-- Empty Slot -->
                          <div style="
                            font-size: 24px;
                            font-weight: bold;
                            color: var(--text-secondary);
                            opacity: 0.3;
                          ">
                            ${slotIndex + 1}
                          </div>
                        `}
                      </div>
                    `
                  }).join('')}
                </div>
              </div>
            `).join('')}
          ` : `
            <!-- Single Timeline for Global Mode -->
            <div class="card">
              <h3 style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">${getIconHTML('music')} Globale Timeline</h3>
              <div class="timeline" id="timeline"></div>
            </div>
          `}

          <!-- Placement Options -->
          <div class="card" id="placement-card" style="display: none;">
            <h3 style="margin-bottom: 16px;">📍 Wo möchtest du die Karte platzieren?</h3>
            <div id="timeline-positions" style="display: flex; flex-direction: column; gap: 12px;"></div>
          </div>
        `}
      </div>
    `

    // Only init scanner in physical mode
    if (this.gameVariant === GAME_VARIANTS.PHYSICAL) {
      this.initScanner()
    }

    // Only update timeline for timeline modes
    if (this.gameMode !== GAME_MODES.GUESS) {
      this.updateTimeline()
    }
  }

  initScanner() {
    const video = document.getElementById('qr-video')
    if (!video) return // Skip if not in physical mode

    // Stop previous scanner instance if it exists
    if (this.qrScanner) {
      this.qrScanner.stop()
      this.qrScanner.destroy()
      this.qrScanner = null
      console.log('🛑 Previous scanner stopped')
    }

    // Suppress QR Scanner library console logs
    const originalConsoleLog = console.log
    const originalConsoleWarn = console.warn
    const logSuppressFilter = (msg) => {
      // Suppress "no QR code found" and similar scanning messages
      if (typeof msg === 'string') {
        const suppressPatterns = [
          'no qr code',
          'qr code not found',
          'scanning',
          'decode failed'
        ]
        return suppressPatterns.some(pattern => msg.toLowerCase().includes(pattern))
      }
      return false
    }

    console.log = (...args) => {
      if (!logSuppressFilter(args[0])) {
        originalConsoleLog(...args)
      }
    }
    console.warn = (...args) => {
      if (!logSuppressFilter(args[0])) {
        originalConsoleWarn(...args)
      }
    }

    this.qrScanner = new QrScanner(
      video,
      result => this.handleQRCode(result.data),
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: 'environment'
      }
    )
    this.qrScanner.start()
    console.log('▶️ Scanner initialized')

    // Restore console after 1 second (scanner initialization complete)
    setTimeout(() => {
      console.log = originalConsoleLog
      console.warn = originalConsoleWarn
    }, 1000)
  }

  handleQRCode(data) {
    if (this.lastScannedCode === data) {
      return
    }
    this.lastScannedCode = data

    // Close any open modal/dialog when QR code is scanned
    this.closeModal()

    let song = null

    // Try Spotify URL format (primary method)
    const spotifyMatch = data.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/)
    if (spotifyMatch) {
      const spotifyId = spotifyMatch[1]
      song = songs.find(s => s.spotifyId === spotifyId)
    }

    // Try direct song ID
    if (!song) {
      song = songs.find(s => s.id === data)
    }

    // Try YouTube URL
    if (!song) {
      song = songs.find(s => s.youtubeUrl === data)
    }

    if (song) {
      // Check if song was already played in this game
      const songId = song.spotifyId || song.id
      if (this.playedSongs.includes(songId)) {
        this.showToast('Dieser Song wurde bereits gespielt!', 'warning')
        console.log('⚠️ Song bereits gespielt:', song.title)
        // Reset lastScannedCode so the same code can be scanned again later
        setTimeout(() => {
          this.lastScannedCode = null
        }, 2000)
        return
      }

      // Add song to playedSongs list to prevent duplicates
      this.playedSongs.push(songId)
      console.log(`➕ Song added to played list: ${song.title} (${this.playedSongs.length}/${songs.length})`)

      this.currentSong = song
      // Speichere Spielstand sofort nach Song-Selektion
      this.saveGame()

      // Im Guess-Modus: Zeige Ratebereich
      if (this.gameMode === GAME_MODES.GUESS) {
        this.displaySong(song)
      }

      // Audio abspielen
      this.playAudio(song)

      // Im Timeline-Modus: Zeige Song-Infos mit Skip/Guess Optionen
      if (this.gameMode !== GAME_MODES.GUESS) {
        this.showTimelineSongInfo(song)
      }

      console.log('✅ Song erkannt:', song.title, '-', song.artist)
    } else {
      this.showToast('Song nicht gefunden!', 'error')
      console.warn('❌ Song nicht gefunden für QR-Code:', data)
      // Reset lastScannedCode for unknown codes
      setTimeout(() => {
        this.lastScannedCode = null
      }, 2000)
    }
  }

  displaySong(song) {
    const info = document.getElementById('song-info')

    // Im Timeline-Modus existiert song-info nicht
    if (!info) {
      return
    }

    info.style.display = 'block'
    document.getElementById('song-title').textContent = '🎵 ???'
    document.getElementById('song-artist').textContent = 'Höre und rate den Song!'
    document.getElementById('song-year').style.display = 'none'

    // Zeige Guess Section
    const guessSection = document.getElementById('guess-section')
    if (guessSection) {
      guessSection.style.display = 'block'
    }

    // Clear inputs
    const yearInput = document.getElementById('guess-year')
    const titleInput = document.getElementById('guess-title')
    const artistInput = document.getElementById('guess-artist')

    if (yearInput) yearInput.value = ''
    if (titleInput) titleInput.value = ''
    if (artistInput) artistInput.value = ''

    this.waitingForGuess = true
  }

  async playAudio(song) {
    console.log('🎵 playAudio called for:', song.title)
    console.log('   spotifyReady:', this.spotifyReady)
    console.log('   spotifyId:', song.spotifyId)
    console.log('   previewUrl:', song.previewUrl)
    console.log('   youtubeUrl:', song.youtubeUrl)

    // Priorität 1: Spotify Web Playback SDK (Premium)
    if (this.spotifyReady && song.spotifyId) {
      console.log('🔵 Attempting Spotify SDK playback...')
      const trackUri = `spotify:track:${song.spotifyId}`
      const accessToken = spotifyAuth.getAccessToken()
      console.log('   trackUri:', trackUri)
      console.log('   accessToken available:', !!accessToken)

      const success = await spotifyPlayer.playTrack(trackUri, accessToken)
      console.log('   Spotify SDK playback result:', success)

      if (success) {
        console.log('🎵 Spiele über Spotify SDK:', song.title)
        const audioPlayer = document.getElementById('audio-player')
        if (audioPlayer) {
          audioPlayer.style.display = 'none'
        }
        return
      } else {
        console.warn('⚠️ Spotify SDK playback failed, trying fallback...')
      }
    } else {
      console.log('⏭️ Skipping Spotify SDK (spotifyReady:', this.spotifyReady, ', spotifyId:', song.spotifyId, ')')
    }

    const audioPlayer = document.getElementById('audio-player')

    // Im Timeline-Modus gibt es keinen Audio-Player
    if (!audioPlayer) {
      console.log('⏭️ Kein Audio-Player Element (Timeline-Modus)')
      return
    }

    // Priorität 2: Spotify Preview URL (30 Sekunden)
    if (song.previewUrl && song.previewUrl !== '' && !song.previewUrl.includes('example.com')) {
      console.log('🔵 Attempting Spotify Preview playback...')
      console.log('   Preview URL:', song.previewUrl)
      audioPlayer.style.display = 'block'
      audioPlayer.src = song.previewUrl
      try {
        await audioPlayer.play()
        console.log('🎵 Spiele Spotify Preview:', song.title)
        return
      } catch (err) {
        console.warn('⚠️ Preview konnte nicht abgespielt werden:', err.message)
      }
    } else {
      console.log('⏭️ Skipping Preview URL (url:', song.previewUrl, ')')
    }

    // Priorität 3: YouTube Embed (als Fallback)
    if (song.youtubeUrl && song.youtubeUrl !== '') {
      console.log('🔵 Attempting YouTube playback...')
      console.log('   YouTube URL:', song.youtubeUrl)

      // Extrahiere YouTube Video ID
      const videoId = this.extractYouTubeId(song.youtubeUrl)
      console.log('   Extracted Video ID:', videoId)
      if (videoId) {
        audioPlayer.style.display = 'none'
        this.playYouTube(videoId)
        console.log('🎵 Spiele über YouTube:', song.title)
        return
      } else {
        console.warn('⚠️ Could not extract YouTube video ID')
      }
    } else {
      console.log('⏭️ Skipping YouTube (url:', song.youtubeUrl, ')')
    }

    // Priorität 4: Fallback-Nachricht (kein Audio verfügbar)
    console.warn('⚠️ Kein Audio verfügbar für:', song.title)
    audioPlayer.style.display = 'none'
    this.showToast('Kein Audio verfügbar für diesen Song', 'warning')
  }

  extractYouTubeId(url) {
    // Unterstützt verschiedene YouTube URL Formate
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  playYouTube(videoId) {
    // Erstelle YouTube IFrame Player Container falls nicht vorhanden
    let container = document.getElementById('youtube-player-container')
    if (!container) {
      container = document.createElement('div')
      container.id = 'youtube-player-container'
      container.style.display = 'none'
      document.body.appendChild(container)
    }

    // Erstelle IFrame für YouTube Player
    container.innerHTML = `
      <iframe
        id="youtube-player"
        width="0"
        height="0"
        src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0"
        frameborder="0"
        allow="autoplay; encrypted-media"
        allowfullscreen
        style="display: none;">
      </iframe>
    `
  }

  checkGuess() {
    const guessTitle = document.getElementById('guess-title').value.trim()
    const guessArtist = document.getElementById('guess-artist').value.trim()
    const guessYear = parseInt(document.getElementById('guess-year').value)

    if (!guessTitle || !guessArtist || !guessYear) {
      this.showToast('Bitte alle Felder ausfüllen!', 'warning')
      return
    }

    // Sofort Eingabemaske verstecken um mehrfache Eingaben zu verhindern
    document.getElementById('guess-section').style.display = 'none'
    this.waitingForGuess = false

    // Verwende toleranten Fuzzy-Match mit 3 erlaubten Tippfehlern
    const result = checkSongGuess(guessTitle, guessArtist, this.currentSong, 3)

    // Jahr-Prüfung mit ±2 Jahren Toleranz
    const yearDiff = Math.abs(guessYear - this.currentSong.year)
    const yearCorrect = yearDiff <= 2

    const player = this.players[this.currentPlayer]

    // Zähle korrekte Antworten
    const correctCount = (result.titleMatch ? 1 : 0) + (result.artistMatch ? 1 : 0) + (yearCorrect ? 1 : 0)

    // Punkte im Ratespiel: Jede richtige Antwort = 1 Punkt
    if (this.gameMode === GAME_MODES.GUESS) {
      player.score += correctCount
      // Speichere Spielstand sofort nach Punktevergabe
      this.saveGame()
    }

    // Modal-Titel basierend auf korrekten Antworten
    let modalTitle = ''
    if (correctCount === 3) {
      modalTitle = '🏆 Perfekt! Alles richtig!'
    } else if (correctCount === 2) {
      modalTitle = '👍 Gut gemacht! 2 von 3 richtig!'
    } else if (correctCount === 1) {
      modalTitle = '🤷 Teilweise richtig'
    } else {
      modalTitle = '❌ Leider alles falsch'
    }

    // Modal-Nachricht zusammenstellen
    let message = `<p style="text-align: center; font-size: 20px; margin: 20px 0;">
         ${result.titleMatch ? '✅' : '❌'} Titel: "${this.currentSong.title}"
       </p>
       <p style="text-align: center; font-size: 18px; color: var(--text-secondary);">
         ${result.artistMatch ? '✅' : '❌'} Artist: ${this.currentSong.artist}
       </p>
       <div class="year-display" style="margin: 20px auto;">
         ${yearCorrect ? '✅' : '❌'} Jahr: ${this.currentSong.year}
       </div>`

    if (!yearCorrect) {
      message += `<div class="card" style="background: var(--primary); padding: 16px; margin-top: 16px;">
        <p style="margin: 0;">Dein Jahr: ${guessYear} (${yearDiff} Jahre daneben)</p>
      </div>`
    }

    // Im Guess-Modus: Zeige Punkte in der Nachricht
    if (this.gameMode === GAME_MODES.GUESS) {
      message += `<div class="card" style="background: var(--accent); padding: 16px; margin-top: 16px; text-align: center;">
        <p style="margin: 0; font-weight: bold; font-size: 18px;">+${correctCount} ${correctCount === 1 ? 'Punkt' : 'Punkte'}</p>
      </div>`
    }

    // Button-Text und -Aktion abhängig vom Spielmodus
    const buttonText = this.gameMode === GAME_MODES.GUESS
      ? `${getIconHTML('arrowRight')} Weiter`
      : `${getIconHTML('check')} Karte einsortieren`

    const buttonAction = this.gameMode === GAME_MODES.GUESS
      ? 'game.placeCardAndContinue()'
      : 'game.autoPlaceInTimeline()'

    this.showModal(
      modalTitle,
      message,
      [{ text: buttonText, onclick: buttonAction, className: 'btn-accent' }]
    )
  }

  skipGuess() {
    // Sofort Eingabemaske verstecken um mehrfache Eingaben zu verhindern
    document.getElementById('guess-section').style.display = 'none'
    this.waitingForGuess = false

    // Button-Text und -Aktion abhängig vom Spielmodus
    const buttonText = this.gameMode === GAME_MODES.GUESS
      ? `${getIconHTML('arrowRight')} Weiter`
      : `${getIconHTML('check')} Karte einsortieren`

    const buttonAction = this.gameMode === GAME_MODES.GUESS
      ? 'game.placeCardAndContinue()'
      : 'game.autoPlaceInTimeline()'

    this.showModal(
      'Song enthüllt',
      `<p style="text-align: center; font-size: 20px; margin: 20px 0;">
         "${this.currentSong.title}"
       </p>
       <p style="text-align: center; font-size: 18px; color: var(--text-secondary);">
         von ${this.currentSong.artist}
       </p>
       <div class="year-display" style="margin: 20px auto;">
         ${this.currentSong.year}
       </div>`,
      [{ text: buttonText, onclick: buttonAction, className: 'btn-accent' }]
    )
  }

  showTimelineSongInfo(song) {
    const player = this.players[this.currentPlayer]

    // Zeige Song-Infos im Timeline-Modus (virtueller Modus)
    this.showModal(
      '📍 Karte platzieren',
      `<div style="text-align: center;">
         <p style="font-size: 18px; margin-bottom: 20px;">Wähle die Position in der Timeline</p>

         <div class="virtual-song-card" style="margin: 20px auto;">
           <div class="card-title">${song.title}</div>
           <div class="card-artist">${song.artist}</div>
           <div class="card-logo">mxster</div>
         </div>

         <div style="margin-top: 30px;">
           <p style="font-weight: 600; margin-bottom: 16px;">Wo möchtest du die Karte einfügen?</p>
           ${this.createDropZones(player)}
         </div>

         <div style="background: rgba(255, 107, 53, 0.1); padding: 12px; border-radius: 8px; margin-top: 20px;">
           <strong>⚠️ Hinweis:</strong> Du musst eine Position wählen, um fortzufahren.
         </div>
       </div>`,
      [],
      { required: true, preventRefresh: true }
    )
  }

  startTimelineGuessing() {
    // Zeige Eingabefelder für Ratespiel (ohne Punkte)
    this.showModal(
      '🎯 Rate den Song!',
      `<div style="text-align: center;">
         <p style="margin-bottom: 20px; color: var(--text-secondary);">Nur zum Spaß - keine Punkte im Timeline-Modus</p>

         <div style="text-align: left; max-width: 400px; margin: 0 auto;">
           <div style="margin-bottom: 16px;">
             <label style="display: block; margin-bottom: 8px; font-weight: 600;">Titel</label>
             <input id="timeline-guess-title" type="text" class="input" placeholder="Song-Titel" />
           </div>

           <div style="margin-bottom: 16px;">
             <label style="display: block; margin-bottom: 8px; font-weight: 600;">Künstler</label>
             <input id="timeline-guess-artist" type="text" class="input" placeholder="Künstler" />
           </div>

           <div style="margin-bottom: 16px;">
             <label style="display: block; margin-bottom: 8px; font-weight: 600;">Jahr</label>
             <input id="timeline-guess-year" type="number" class="input" placeholder="Jahr" />
           </div>
         </div>
       </div>`,
      [
        { text: `${getIconHTML('check')} Auflösung & Platzieren`, onclick: 'game.checkTimelineGuess()', className: 'btn-accent' },
        { text: '⏭️ Überspringen', onclick: 'game.autoPlaceInTimeline(); game.closeModal()', className: 'btn-outline' }
      ]
    )
  }

  checkTimelineGuess() {
    const guessedTitle = document.getElementById('timeline-guess-title')?.value.trim()
    const guessedArtist = document.getElementById('timeline-guess-artist')?.value.trim()
    const guessedYear = document.getElementById('timeline-guess-year')?.value

    // Prüfe Antworten mit Fuzzy Matching
    const titleCorrect = checkSongGuess(this.currentSong.title, guessedTitle)
    const artistCorrect = checkSongGuess(this.currentSong.artist, guessedArtist)
    const yearCorrect = guessedYear && Math.abs(parseInt(guessedYear) - this.currentSong.year) <= 2

    // Zeige Auflösung
    const message = `
      <div style="text-align: center;">
        <h3 style="margin-bottom: 20px;">Auflösung</h3>

        <div style="text-align: left; max-width: 400px; margin: 0 auto;">
          <div style="margin-bottom: 12px; padding: 12px; background: var(--primary); border-radius: 8px;">
            ${titleCorrect ? '✅' : '❌'} <strong>Titel:</strong> ${this.currentSong.title}
          </div>

          <div style="margin-bottom: 12px; padding: 12px; background: var(--primary); border-radius: 8px;">
            ${artistCorrect ? '✅' : '❌'} <strong>Künstler:</strong> ${this.currentSong.artist}
          </div>

          <div style="margin-bottom: 12px; padding: 12px; background: var(--primary); border-radius: 8px;">
            ${yearCorrect ? '✅' : '❌'} <strong>Jahr:</strong> ${this.currentSong.year}
          </div>
        </div>

        <p style="margin-top: 20px; color: var(--text-secondary); font-size: 14px;">
          Im Timeline-Modus gibt es keine Punkte
        </p>
      </div>
    `

    this.showModal(
      'Auflösung',
      message,
      [{ text: `${getIconHTML('check')} Karte platzieren`, onclick: 'game.autoPlaceInTimeline(); game.closeModal()', className: 'btn-accent' }]
    )
  }

  showSongCardAndStartDragDrop(song) {
    const player = this.players[this.currentPlayer]

    // Erstelle virtuelle Song-Karte OHNE Jahr (Kreditkartenformat)
    const cardHTML = `
      <div class="virtual-song-card">
        <div class="card-title">${song.title}</div>
        <div class="card-artist">${song.artist}</div>
        <div class="card-logo">mxster</div>
      </div>
    `

    // Zeige Modal mit klickbaren Buttons
    this.showModal(
      'Platziere die Karte!',
      `<div style="text-align: center;">
         <p style="margin-bottom: 20px;">Klicke auf die richtige Position in der Timeline</p>
         ${cardHTML}
         <div id="drop-zones" style="margin-top: 30px;">
           ${this.createDropZones(player)}
         </div>
       </div>`,
      []
    )
  }

  createDropZones(player) {
    // Bei Timeline Global: Verwende globale Timeline
    const timeline = this.gameMode === GAME_MODES.TIMELINE_GLOBAL
      ? this.globalTimeline
      : player.timeline

    if (timeline.length === 0) {
      return '<button class="drop-zone" onclick="game.placeAtPosition(0)">📍 Erste Karte platzieren</button>'
    }

    let zones = `<button class="drop-zone" onclick="game.placeAtPosition(0)">⬅️ Vor ${timeline[0].year}</button>`

    // Gruppiere aufeinanderfolgende gleiche Jahre
    let i = 0
    while (i < timeline.length) {
      const currentYear = timeline[i].year

      // Finde das Ende der aktuellen Jahresgruppe
      let j = i
      while (j < timeline.length && timeline[j].year === currentYear) {
        j++
      }

      // j zeigt jetzt auf das erste Element mit einem anderen Jahr (oder auf timeline.length)
      if (j < timeline.length) {
        const nextYear = timeline[j].year

        // Nur eine Zone für die gesamte Jahresgruppe erstellen
        if (currentYear === nextYear) {
          zones += `<button class="drop-zone" onclick="game.placeAtPosition(${j})">📍 Bei ${currentYear}</button>`
        } else {
          zones += `<button class="drop-zone" onclick="game.placeAtPosition(${j})">↔️ Zwischen ${currentYear} und ${nextYear}</button>`
        }
      }

      // Springe zum nächsten unterschiedlichen Jahr
      i = j
    }

    zones += `<button class="drop-zone" onclick="game.placeAtPosition(${timeline.length})">➡️ Nach ${timeline[timeline.length - 1].year}</button>`

    return zones
  }

  showPlacementOptions() {
    const player = this.players[this.currentPlayer]
    const container = document.getElementById('timeline-positions')
    const placementCard = document.getElementById('placement-card')

    // Zeige Placement-Card
    if (placementCard) {
      placementCard.style.display = 'block'
    }

    // Erstelle Buttons für jede mögliche Position
    const positions = []

    // Position 0: Ganz links (ältester Song)
    positions.push({ label: '⬅️ Ganz links (ältester)', index: 0 })

    // Positionen zwischen Songs
    for (let i = 0; i < player.timeline.length - 1; i++) {
      positions.push({
        label: `↔️ Zwischen ${player.timeline[i].year} und ${player.timeline[i+1].year}`,
        index: i + 1
      })
    }

    // Position ganz rechts (neuester Song)
    if (player.timeline.length > 0) {
      positions.push({ label: '➡️ Ganz rechts (neuester)', index: player.timeline.length })
    }

    if (container) {
      container.innerHTML = positions.map(pos => `
        <button class="btn btn-accent" onclick="game.placeAtPosition(${pos.index})">
          ${pos.label}
        </button>
      `).join('')
    }
  }

  placeAtPosition(position) {
    // Schließe den Positionsauswahl-Dialog sofort
    this.closeModal()

    const player = this.players[this.currentPlayer]

    // Bei Timeline Global: Verwende globale Timeline
    const timeline = this.gameMode === GAME_MODES.TIMELINE_GLOBAL
      ? this.globalTimeline
      : player.timeline

    // Füge Song an gewählter Position ein
    timeline.splice(position, 0, this.currentSong)

    // Prüfe ob korrekt platziert
    const sortedTimeline = [...timeline].sort((a, b) => a.year - b.year)
    const isCorrect = JSON.stringify(timeline.map(s => s.id)) === JSON.stringify(sortedTimeline.map(s => s.id))

    if (isCorrect) {
      // Sortiere Timeline chronologisch (ältester Song links/oben)
      timeline.sort((a, b) => a.year - b.year)
      player.cards += 1
      // Speichere Spielstand sofort nach Kartenzählung
      this.saveGame()

      // Prüfe Gewinnbedingung
      if (player.cards >= 10) {
        this.showWinner(player)
        return
      }

      this.showModal(
        'Richtig platziert!',
        `<div class="placement-result placement-success">
           <div class="result-icon">✅</div>
           <p class="result-message">Die Karte wurde korrekt in die Timeline eingefügt!</p>

           <div class="result-song-info">
             <div class="result-song-title">${this.currentSong.title}</div>
             <div class="result-song-artist">${this.currentSong.artist}</div>
             <div class="result-song-year">${this.currentSong.year}</div>
           </div>

           <div class="result-progress">
             <strong>${player.name} - Fortschritt:</strong>
             <p>${player.cards}/10 Karten</p>
           </div>
         </div>`,
        [{ text: `${getIconHTML('check')} Weiter`, onclick: 'game.continueTurn(); game.closeModal()', className: 'btn-accent' }]
      )
    } else {
      // Entferne falsch platzierte Karte
      timeline.splice(position, 1)

      this.showModal(
        'Falsch platziert!',
        `<div class="placement-result placement-error">
           <div class="result-icon">❌</div>
           <p class="result-message">Die Karte wurde an der falschen Position platziert und wird entfernt.</p>

           <div class="result-song-info">
             <div class="result-song-title">${this.currentSong.title}</div>
             <div class="result-song-artist">${this.currentSong.artist}</div>
             <div class="result-song-year">${this.currentSong.year}</div>
           </div>

           <div class="result-progress">
             <strong>${player.name} - Aktueller Stand:</strong>
             <p>${player.cards}/10 Karten</p>
           </div>
         </div>`,
        [{ text: `${getIconHTML('check')} Weiter`, onclick: 'game.continueTurn(); game.closeModal()', className: 'btn-accent' }]
      )
    }
  }

  continueTurn() {
    this.updateTimeline()
    this.saveGame()
    this.nextTurn()
  }


  placeCardAndContinue() {
    // Schließe Modal zuerst
    this.closeModal()

    const player = this.players[this.currentPlayer]

    // Füge Song zur Timeline hinzu und sortiere chronologisch
    player.timeline.push(this.currentSong)
    player.timeline.sort((a, b) => a.year - b.year)

    // Karte zählt immer (da automatisch richtig platziert)
    player.cards += 1
    // Speichere Spielstand sofort nach Kartenzählung
    this.saveGame()

    // Update Timeline
    this.updateTimeline()

    // Prüfe Gewinnbedingung
    if (player.cards >= 10) {
      this.showWinner(player)
      return
    }

    // Weiter zum nächsten Spieler
    this.nextTurn()
  }

  autoPlaceInTimeline() {
    const player = this.players[this.currentPlayer]

    // Füge Song zur richtigen Timeline hinzu (global oder persönlich)
    if (this.gameMode === GAME_MODES.TIMELINE_GLOBAL) {
      // Bei globaler Timeline: Füge zur gemeinsamen Timeline hinzu
      this.globalTimeline.push(this.currentSong)
      this.globalTimeline.sort((a, b) => a.year - b.year)
    } else {
      // Bei persönlicher Timeline: Füge zur Spieler-Timeline hinzu
      player.timeline.push(this.currentSong)
      player.timeline.sort((a, b) => a.year - b.year)
    }

    // Karte zählt immer (da automatisch richtig platziert)
    player.cards += 1
    // Speichere Spielstand sofort nach Kartenzählung
    this.saveGame()

    // Prüfe Gewinnbedingung
    if (player.cards >= 10) {
      this.updateTimeline()
      this.showWinner(player)
      return
    }

    // Update Timeline SOFORT nach dem Einfügen
    this.updateTimeline()

    // Im Timeline-Modus: Zeige Bestätigung
    this.showModal(
      'Karte eingefügt!',
      `<div style="text-align: center;">
         <div style="font-size: 48px; margin: 20px 0;">✅</div>
         <p style="font-size: 18px;">"${this.currentSong.title}" wurde chronologisch in die Timeline eingefügt!</p>
         <div class="card" style="background: var(--primary); margin-top: 20px; padding: 16px;">
           <strong>Fortschritt:</strong>
           <p style="margin: 8px 0 0 0; font-size: 20px;">${player.cards}/10 Karten</p>
         </div>
       </div>`,
      [{ text: `${getIconHTML('check')} Weiter`, onclick: 'game.closeModal(); game.nextTurn()', className: 'btn-accent' }]
    )
  }

  nextTurn() {
    // Reset
    this.lastScannedCode = null
    this.currentSong = null

    // Song-info nur im Guess-Modus ausblenden
    const songInfo = document.getElementById('song-info')
    if (songInfo) {
      songInfo.style.display = 'none'
    }

    // Wechsle zum nächsten Spieler (im Uhrzeigersinn)
    this.currentPlayer = (this.currentPlayer + 1) % this.players.length

    // Nur im physischen Guess-Modus: DJ-Wechsel-Logik
    // Im Timeline-Modus legen alle Spieler (inkl. DJ) selbst Karten
    if (this.gameVariant === GAME_VARIANTS.PHYSICAL && this.gameMode === GAME_MODES.GUESS) {
      // Wenn wieder beim DJ: DJ wechselt
      if (this.currentPlayer === this.currentDJ) {
        this.currentDJ = (this.currentDJ + 1) % this.players.length
        this.currentPlayer = (this.currentPlayer + 1) % this.players.length
      }
    }

    // Speichere Spielstand nach Spielerwechsel
    this.saveGame()

    this.renderGameScreen()

    // Bei Timeline Global: Aktualisiere Timeline nach renderGameScreen
    if (this.gameMode === GAME_MODES.TIMELINE_GLOBAL) {
      this.updateTimeline()
    }
  }

  updatePlayerInfo() {
    const dj = this.players[this.currentDJ]
    const player = this.players[this.currentPlayer]
    const h2 = document.querySelector('h2')
    if (h2) h2.textContent = `🎧 DJ: ${dj.name}`

    // Update stats
    const stats = document.querySelectorAll('.stat-item')
    if (stats.length >= 2) {
      stats[0].innerHTML = `${getIconHTML('users')} ${player.name}`
      stats[1].innerHTML = `${getIconHTML('music')} ${player.cards}/10 Karten`
    }
  }

  updateTimeline() {
    const timeline = document.getElementById('timeline')

    // Im Guess-Modus gibt es kein Timeline-Element
    if (!timeline) {
      return
    }

    // Bei TIMELINE_GLOBAL: Verwende globale Timeline
    // Bei TIMELINE_PERSONAL: Verwende Spieler-Timeline
    const timelineData = this.gameMode === GAME_MODES.TIMELINE_GLOBAL
      ? this.globalTimeline
      : this.players[this.currentPlayer].timeline

    if (timelineData.length === 0) {
      timeline.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Noch keine Karten in der Timeline</p>'
      return
    }

    timeline.innerHTML = timelineData
      .map((song, index) => `
        <div class="timeline-card">
          <div style="font-weight: 800; font-size: 24px; margin-bottom: 8px;">${song.year}</div>
          <div style="font-size: 14px; margin-bottom: 4px; font-weight: 600;">${song.title}</div>
          <div style="font-size: 12px; opacity: 0.8;">${song.artist}</div>
        </div>
      `).join('')
  }

  showInstructions() {
    const modeInfo = GAME_MODE_INFO[this.gameMode]
    const variantInfo = GAME_VARIANT_INFO[this.gameVariant]

    let content = ''

    // Header mit aktuellem Modus
    content += `
      <div style="text-align: left;">
        <div style="background: rgba(74, 144, 226, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 20px;">
          <strong>Aktueller Modus:</strong> ${modeInfo.icon} ${modeInfo.name} | ${variantInfo.icon} ${variantInfo.name}
        </div>
    `

    // GUESS MODE
    if (this.gameMode === GAME_MODES.GUESS) {
      content += `
        <h3 style="margin-top: 0; margin-bottom: 16px;">🎯 Ziel des Spiels</h3>
        <p style="margin-bottom: 20px;">
          Rate Song-Titel, Künstler und Jahr richtig, um <strong>Punkte</strong> zu sammeln. Der Spieler mit den meisten Punkten nach 10 Songs gewinnt!
        </p>

        <h3 style="margin-bottom: 16px;">🎮 Spielablauf</h3>
        <ol style="margin-left: 20px; line-height: 1.8;">
          ${this.gameVariant === GAME_VARIANTS.PHYSICAL ? `
            <li><strong>DJ scannt QR-Code:</strong> Der DJ scannt eine Song-Karte. Der DJ rät nicht mit.</li>
          ` : `
            <li><strong>Zufälliger Song:</strong> Das System wählt automatisch einen zufälligen Song aus.</li>
          `}
          <li><strong>Song anhören:</strong> Der Song wird für alle Spieler abgespielt.</li>
          <li><strong>Raten:</strong> Der aktive Spieler gibt seine Tipps ein:
            <ul style="margin-top: 8px; margin-left: 20px;">
              <li>Titel richtig = <strong>+1 Punkt</strong></li>
              <li>Künstler richtig = <strong>+1 Punkt</strong></li>
              <li>Jahr richtig (±2 Jahre) = <strong>+1 Punkt</strong></li>
            </ul>
          </li>
          <li><strong>Automatische Platzierung:</strong> Die Karte wird automatisch chronologisch in die Timeline eingefügt.</li>
          <li><strong>Nächster Spieler:</strong> Das Spiel geht im Uhrzeigersinn weiter.</li>
        </ol>

        <h3 style="margin-top: 24px; margin-bottom: 16px;">🏆 Gewinnbedingung</h3>
        <p style="margin: 0;">
          Der Spieler mit den <strong>meisten Punkten</strong> nach 10 Songs gewinnt!
        </p>
      `
    }

    // TIMELINE PERSONAL MODE
    else if (this.gameMode === GAME_MODES.TIMELINE_PERSONAL) {
      content += `
        <h3 style="margin-top: 0; margin-bottom: 16px;">🎯 Ziel des Spiels</h3>
        <p style="margin-bottom: 20px;">
          Sortiere 10 Songs <strong>chronologisch korrekt</strong> in deine persönliche Timeline ein, um zu gewinnen!
        </p>

        <h3 style="margin-bottom: 16px;">🎮 Spielablauf</h3>
        <ol style="margin-left: 20px; line-height: 1.8;">
          ${this.gameVariant === GAME_VARIANTS.PHYSICAL ? `
            <li><strong>DJ scannt QR-Code:</strong> Der DJ scannt eine Song-Karte für den aktiven Spieler.</li>
          ` : `
            <li><strong>Zufälliger Song:</strong> Das System wählt automatisch einen zufälligen Song aus.</li>
          `}
          <li><strong>Song anhören:</strong> Der Song wird für alle Spieler abgespielt.</li>
          <li><strong>Raten (optional):</strong> Du kannst versuchen zu raten, aber es gibt keine Punkte.</li>
          <li><strong>Position wählen:</strong> Wähle die richtige Position in deiner Timeline:
            <ul style="margin-top: 8px; margin-left: 20px;">
              <li>Richtig platziert = <strong>Karte bleibt in Timeline (+1 Karte)</strong></li>
              <li>Falsch platziert = <strong>Karte wird entfernt (keine Karte)</strong></li>
            </ul>
          </li>
          <li><strong>Nächster Spieler:</strong> Das Spiel geht im Uhrzeigersinn weiter.</li>
        </ol>

        <h3 style="margin-top: 24px; margin-bottom: 16px;">🏆 Gewinnbedingung</h3>
        <p style="margin: 0;">
          Der erste Spieler, der <strong>10 Karten korrekt</strong> in seiner persönlichen Timeline hat, gewinnt!
        </p>

        <div style="background: rgba(255, 107, 53, 0.1); padding: 12px; border-radius: 8px; margin-top: 20px;">
          <strong>⚠️ Wichtig:</strong> Jeder Spieler baut seine <strong>eigene Timeline</strong> auf. Die Timelines der anderen Spieler siehst du nicht.
        </div>
      `
    }

    // TIMELINE GLOBAL MODE
    else if (this.gameMode === GAME_MODES.TIMELINE_GLOBAL) {
      content += `
        <h3 style="margin-top: 0; margin-bottom: 16px;">🎯 Ziel des Spiels</h3>
        <p style="margin-bottom: 20px;">
          Sortiere 10 Songs <strong>chronologisch korrekt</strong> in die gemeinsame Timeline ein, um zu gewinnen!
        </p>

        <h3 style="margin-bottom: 16px;">🎮 Spielablauf</h3>
        <ol style="margin-left: 20px; line-height: 1.8;">
          ${this.gameVariant === GAME_VARIANTS.PHYSICAL ? `
            <li><strong>DJ scannt QR-Code:</strong> Der DJ scannt eine Song-Karte für den aktiven Spieler.</li>
          ` : `
            <li><strong>Zufälliger Song:</strong> Das System wählt automatisch einen zufälligen Song aus.</li>
          `}
          <li><strong>Song anhören:</strong> Der Song wird für alle Spieler abgespielt.</li>
          <li><strong>Raten (optional):</strong> Du kannst versuchen zu raten, aber es gibt keine Punkte.</li>
          <li><strong>Position wählen:</strong> Wähle die richtige Position in der <strong>gemeinsamen Timeline</strong>:
            <ul style="margin-top: 8px; margin-left: 20px;">
              <li>Richtig platziert = <strong>Karte bleibt in Timeline (+1 Karte)</strong></li>
              <li>Falsch platziert = <strong>Karte wird entfernt (keine Karte)</strong></li>
            </ul>
          </li>
          <li><strong>Nächster Spieler:</strong> Das Spiel geht im Uhrzeigersinn weiter.</li>
        </ol>

        <h3 style="margin-top: 24px; margin-bottom: 16px;">🏆 Gewinnbedingung</h3>
        <p style="margin: 0;">
          Der erste Spieler, der <strong>10 Karten korrekt</strong> platziert hat, gewinnt!
        </p>

        <div style="background: rgba(255, 107, 53, 0.1); padding: 12px; border-radius: 8px; margin-top: 20px;">
          <strong>⚠️ Wichtig:</strong> Alle Spieler arbeiten an der <strong>gleichen Timeline</strong>. Du siehst alle bereits platzierten Songs aller Spieler.
        </div>
      `
    }

    // Zusätzliche Info zu bereits gespielten Songs
    content += `
      <div style="background: rgba(99, 102, 241, 0.1); padding: 12px; border-radius: 8px; margin-top: 20px;">
        <strong>💡 Tipp:</strong> Jeder Song kann nur einmal pro Spiel gezogen werden. Bereits gespielte Songs können nicht erneut auftreten.
      </div>
    `

    content += `</div>`

    this.showModal(
      'Spielregeln',
      content,
      [{ text: 'Verstanden', onclick: 'game.closeModal()', className: 'btn-accent' }]
    )
  }

  showScoreboard() {
    const rows = this.players.map((p, i) => {
      const isDJ = i === this.currentDJ
      const isActive = i === this.currentPlayer
      return `
        <div class="player-row ${isActive ? 'active' : ''}">
          <div>
            <strong>${i + 1}. ${p.name}</strong>
            ${isDJ ? '<span style="margin-left: 8px;">🎧 DJ</span>' : ''}
            ${isActive ? '<span style="margin-left: 8px; color: var(--accent);">▶ Aktiv</span>' : ''}
          </div>
          <div style="display: flex; gap: 16px;">
            <span>${getIconHTML('music')} ${p.cards}/10</span>
          </div>
        </div>
      `
    }).join('')

    this.showModal(
      'Spielstand',
      `<div class="scoreboard">${rows}</div>`,
      [{ text: 'Schließen', onclick: 'game.closeModal()', className: 'btn-accent' }]
    )
  }

  showSettings() {
    const historyCount = gameHistory.getAll().length
    this.showModal(
      'Einstellungen',
      `<div class="scoreboard">
         <div class="player-row" onclick="game.showHistory()">
           <div>
             <strong>${getIconHTML('trophy')} Spielhistorie anzeigen</strong>
             <p style="margin: 4px 0 0 0; font-size: 14px; color: var(--text-secondary);">
               ${historyCount} abgeschlossene(s) Spiel(e)
             </p>
           </div>
         </div>
         <div class="player-row" onclick="game.exportGame()">
           <div>
             <strong>${getIconHTML('download')} Spielhistorie exportieren</strong>
             <p style="margin: 4px 0 0 0; font-size: 14px; color: var(--text-secondary);">
               Speichere aktuelle Spielhistorie als JSON-Datei
             </p>
           </div>
         </div>
         <div class="player-row" onclick="document.getElementById('import-file-settings').click()">
           <div>
             <strong>${getIconHTML('upload')} Spielhistorie importieren</strong>
             <p style="margin: 4px 0 0 0; font-size: 14px; color: var(--text-secondary);">
               Lade gespeicherte Spielhistorie
             </p>
           </div>
         </div>
         <input type="file" id="import-file-settings" accept=".json" style="display: none;"
                onchange="game.importGame(event); game.closeModal()">
       </div>`,
      [{ text: 'Schließen', onclick: 'game.closeModal()', className: 'btn-outline' }]
    )
  }

  showWinner(player) {
    // Save game to history before clearing state
    gameHistory.saveGame({
      winner: {
        name: player.name,
        cards: player.cards,
        score: player.score || 0
      },
      players: this.players
    })

    this.gameState.clear()

    // Render winner screen component
    const app = document.getElementById('app')
    app.innerHTML = renderWinnerScreen(this.players)
  }

  // Helper methods for winner screen
  startNewGame() {
    // Reset played songs list when starting completely new game
    this.playedSongs = []
    // Reset global timeline
    this.globalTimeline = []
    // Clear saved game state from localStorage
    this.gameState.clear()
    this.closeModal()
    this.renderModeSelection()
  }

  backToSetup() {
    this.renderStartScreen()
  }

  showStatistics() {
    const app = document.getElementById('app')
    app.innerHTML = renderStatistics(this.players, gameHistory.getAll())
  }

  closeStatistics() {
    // Wenn ein Gewinner existiert oder das Spiel beendet ist, zurück zur Spielauswahl
    // Ansonsten zurück zum laufenden Spiel
    const hasWinner = this.players.some(p => p.cards >= 10)
    if (hasWinner || !this.currentSong) {
      this.renderStartScreen()
    } else {
      this.renderGameScreen()
    }
  }

  shareResults(platform) {
    const winner = [...this.players].sort((a, b) => b.cards - a.cards)[0]
    const text = `🏆 ${winner.name} hat mxster gewonnen mit ${winner.cards} Karten! 🎵\n\nSpiele jetzt mit: https://mxster.de`

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
    } else if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('In Zwischenablage kopiert!', 'success')
      })
    }
  }

  exportGame() {
    const data = this.gameState.load()
    if (!data || !data.players || data.players.length === 0) {
      this.showToast('Kein Spielstand zum Exportieren!', 'warning')
      return
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mxster-spielstand-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    this.showToast('Spielstand exportiert!', 'success')
  }

  importGame(event) {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (!data.players || !Array.isArray(data.players)) {
          throw new Error('Ungültiges Spielstand-Format')
        }
        this.gameState.save(data)
        this.showToast('Spielstand erfolgreich importiert!', 'success')
        setTimeout(() => {
          this.showRestoreDialog(data)
        }, 1000)
      } catch (error) {
        this.showToast('Fehler beim Importieren: ' + error.message, 'error')
      }
    }
    reader.readAsText(file)
  }

  endGameEarly() {
    // Find player with most cards
    const sortedPlayers = [...this.players].sort((a, b) => b.cards - a.cards)
    const topPlayer = sortedPlayers[0]

    this.showModal(
      'Spiel vorzeitig beenden?',
      `<p>Möchtest du das aktuelle Spiel wirklich beenden?</p>
       <div class="card" style="background: var(--primary); margin-top: 16px; padding: 16px;">
         <p style="margin: 0 0 12px 0;"><strong>Aktueller Stand:</strong></p>
         ${sortedPlayers.map((p, i) => `
           <p style="margin: 4px 0;">
             ${i + 1}. ${p.name}: ${p.cards} Karten
           </p>
         `).join('')}
       </div>
       <div class="card" style="background: var(--accent); margin-top: 16px; padding: 16px;">
         <p style="margin: 0;">
           <strong>🏆 ${topPlayer.name}</strong> führt mit ${topPlayer.cards} Karten und wird als Gewinner in die Historie eingetragen.
         </p>
       </div>`,
      [
        { text: `${getIconHTML('check')} Spiel beenden`, onclick: 'game.confirmEndGame()', className: 'btn-danger' },
        { text: 'Abbrechen', onclick: 'game.closeModal()', className: 'btn-outline' }
      ]
    )
  }

  confirmEndGame() {
    // Find player with most cards as winner
    const sortedPlayers = [...this.players].sort((a, b) => b.cards - a.cards)
    const winner = sortedPlayers[0]

    // Save game to history
    gameHistory.saveGame({
      winner: {
        name: winner.name,
        cards: winner.cards,
        score: winner.score || 0
      },
      players: this.players
    })

    this.gameState.clear()
    this.closeModal()

    this.showModal(
      'Spiel beendet',
      `<div style="text-align: center;">
         <div style="font-size: 64px; margin: 20px 0;">🏁</div>
         <h2 style="font-size: 28px; margin-bottom: 16px;">${winner.name} gewinnt!</h2>
         <p style="font-size: 18px; color: var(--accent);">${winner.cards} Karten korrekt platziert</p>
         <div class="card" style="background: var(--primary); margin-top: 16px; padding: 16px;">
           <p style="margin: 0; font-size: 14px; color: var(--text-secondary);">
             ✅ Spiel wurde in der Historie gespeichert
           </p>
         </div>
       </div>`,
      [
        { text: `${getIconHTML('home')} Zur Startseite`, onclick: 'game.closeModal(); game.renderLoginScreen()', className: 'btn-accent' }
      ]
    )
  }

  logout() {
    this.showModal(
      'Ausloggen?',
      `<p>Möchtest du dich wirklich von Spotify abmelden?</p>
       <div class="card" style="background: var(--primary); margin-top: 16px; padding: 16px;">
         <p style="margin: 0; color: var(--accent);"><strong>Hinweis:</strong> Dein Spielstand bleibt gespeichert und kann beim nächsten Login fortgesetzt werden.</p>
       </div>`,
      [
        { text: `${getIconHTML('logout')} Ausloggen`, onclick: 'game.confirmLogout()', className: 'btn-danger' },
        { text: 'Abbrechen', onclick: 'game.closeModal()', className: 'btn-outline' }
      ]
    )
  }

  showHistory() {
    const history = gameHistory.getAll()

    if (history.length === 0) {
      this.showModal(
        'Spielhistorie',
        `<div style="text-align: center; padding: 40px 20px;">
           <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">📚</div>
           <p style="color: var(--text-secondary);">Noch keine Spiele abgeschlossen</p>
         </div>`,
        [{ text: 'Schließen', onclick: 'game.closeModal()', className: 'btn-accent' }]
      )
      return
    }

    const rows = history.map(game => {
      const date = new Date(game.timestamp).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })

      return `
        <div class="player-row" onclick="game.showGameDetails(${game.id})">
          <div>
            <strong>🏆 ${game.winner.name}</strong>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: var(--text-secondary);">
              ${date} • ${game.players.length} Spieler
            </p>
          </div>
        </div>
      `
    }).join('')

    this.showModal(
      'Spielhistorie',
      `<div class="scoreboard">${rows}</div>
       <div style="margin-top: 16px; display: flex; gap: 8px;">
         <button class="btn btn-outline" onclick="game.exportHistory()" style="flex: 1;">
           ${getIconHTML('download')} Historie exportieren
         </button>
         <button class="btn btn-outline" onclick="document.getElementById('import-history-file').click()" style="flex: 1;">
           ${getIconHTML('upload')} Historie importieren
         </button>
       </div>
       <input type="file" id="import-history-file" accept=".json" style="display: none;"
              onchange="game.importHistory(event)">`,
      [
        { text: 'Alle löschen', onclick: 'game.confirmClearHistory()', className: 'btn-danger' },
        { text: 'Schließen', onclick: 'game.closeModal()', className: 'btn-accent' }
      ]
    )
  }

  showGameDetails(gameId) {
    const game = gameHistory.getById(gameId)
    if (!game) return

    const date = new Date(game.timestamp).toLocaleString('de-DE')

    const playerRows = game.players.map((p, i) => {
      const isWinner = p.name === game.winner.name
      return `
        <div class="player-row ${isWinner ? 'active' : ''}">
          <div>
            <strong>${i + 1}. ${p.name}</strong>
            ${isWinner ? '<span style="margin-left: 8px;">🏆 Gewinner</span>' : ''}
          </div>
          <div style="display: flex; gap: 16px;">
            <span>${getIconHTML('music')} ${p.cards}/10</span>
          </div>
        </div>
      `
    }).join('')

    // Show winner's timeline
    const timeline = game.players
      .find(p => p.name === game.winner.name)
      ?.timeline.map(song => `
        <div class="timeline-card">
          <div style="font-weight: 800; font-size: 24px; margin-bottom: 8px;">${song.year}</div>
          <div style="font-size: 14px; margin-bottom: 4px; font-weight: 600;">${song.title}</div>
          <div style="font-size: 12px; opacity: 0.8;">${song.artist}</div>
        </div>
      `).join('') || '<p style="color: var(--text-secondary);">Keine Timeline verfügbar</p>'

    this.showModal(
      `Spiel vom ${date}`,
      `<div>
         <h3 style="margin-top: 0; margin-bottom: 16px;">Spieler</h3>
         <div class="scoreboard">${playerRows}</div>

         <h3 style="margin-top: 24px; margin-bottom: 16px;">Timeline von ${game.winner.name}</h3>
         <div class="timeline">${timeline}</div>

         <div style="margin-top: 24px; text-align: center;">
           <button class="btn btn-danger" onclick="game.deleteGameFromHistory(${game.id})" style="width: 100%;">
             ${getIconHTML('trash')} Dieses Spiel löschen
           </button>
         </div>
       </div>`,
      [{ text: 'Zurück zur Historie', onclick: 'game.showHistory()', className: 'btn-accent' }]
    )
  }

  deleteGameFromHistory(gameId) {
    this.showModal(
      'Spiel löschen?',
      '<p>Möchtest du dieses Spiel wirklich aus der Historie löschen?</p>',
      [
        { text: `${getIconHTML('trash')} Löschen`, onclick: `game.confirmDeleteGame(${gameId})`, className: 'btn-danger' },
        { text: 'Abbrechen', onclick: 'game.showHistory()', className: 'btn-outline' }
      ]
    )
  }

  confirmDeleteGame(gameId) {
    gameHistory.deleteGame(gameId)
    this.showToast('Spiel aus Historie gelöscht', 'success')
    this.showHistory()
  }

  confirmClearHistory() {
    this.showModal(
      'Alle Spiele löschen?',
      '<p>Möchtest du wirklich die gesamte Spielhistorie löschen? Diese Aktion kann nicht rückgängig gemacht werden.</p>',
      [
        { text: `${getIconHTML('trash')} Alle löschen`, onclick: 'game.clearHistoryConfirmed()', className: 'btn-danger' },
        { text: 'Abbrechen', onclick: 'game.showHistory()', className: 'btn-outline' }
      ]
    )
  }

  clearHistoryConfirmed() {
    gameHistory.clearAll()
    this.showToast('Spielhistorie gelöscht', 'success')
    this.closeModal()
  }

  exportHistory() {
    const history = gameHistory.getAll()
    if (history.length === 0) {
      this.showToast('Keine Spielhistorie zum Exportieren!', 'warning')
      return
    }

    const jsonData = gameHistory.exportAll()
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mxster-historie-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    this.showToast('Spielhistorie exportiert!', 'success')
  }

  importHistory(event) {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = gameHistory.importGames(e.target.result, true) // Merge mode
        if (result.success) {
          this.showToast(result.message, 'success')
          this.showHistory() // Refresh history view
        } else {
          this.showToast(result.message, 'error')
        }
      } catch (error) {
        this.showToast('Fehler beim Importieren: ' + error.message, 'error')
      }
    }
    reader.readAsText(file)
  }

  confirmLogout() {
    spotifyPlayer.disconnect()
    spotifyAuth.logout()
    window.location.reload()
  }

  // Modal System
  showModal(title, bodyHTML, buttons = [], options = {}) {
    // Remove existing modal if any
    const existing = document.getElementById('game-modal')
    if (existing) existing.remove()

    const modal = document.createElement('div')
    modal.id = 'game-modal'
    modal.className = 'modal'
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${title}</h2>
        </div>
        <div class="modal-body">
          ${bodyHTML}
        </div>
        <div class="modal-footer">
          ${buttons.map(btn => `
            <button class="btn ${btn.className || ''}" onclick="${btn.onclick}">
              ${btn.text}
            </button>
          `).join('')}
        </div>
      </div>
    `
    document.body.appendChild(modal)

    // Close on background click (only if not required)
    if (!options.required) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal()
        }
      })
    }

    // Prevent page refresh when modal is open (if preventRefresh option is enabled)
    if (options.preventRefresh) {
      this.beforeUnloadHandler = (e) => {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
      window.addEventListener('beforeunload', this.beforeUnloadHandler)
    }
  }

  closeModal() {
    const modal = document.getElementById('game-modal')
    if (modal) modal.remove()

    // Remove beforeunload handler if it exists
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler)
      this.beforeUnloadHandler = null
    }
  }

  // Toast Notification System
  showToast(message, type = 'info') {
    const toast = document.createElement('div')
    toast.className = `toast ${type}`
    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div>${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</div>
        <div>${message}</div>
      </div>
    `
    document.body.appendChild(toast)

    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.3s ease-out reverse'
      setTimeout(() => toast.remove(), 300)
    }, 3000)
  }

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar')
    const overlay = document.getElementById('sidebar-overlay')
    const hamburger = document.getElementById('hamburger-btn')

    if (sidebar && overlay && hamburger) {
      const isOpen = sidebar.classList.contains('open')

      if (isOpen) {
        this.closeSidebar()
      } else {
        sidebar.classList.add('open')
        overlay.classList.add('visible')
        hamburger.classList.add('active')
      }
    }
  }

  closeSidebar() {
    const sidebar = document.getElementById('sidebar')
    const overlay = document.getElementById('sidebar-overlay')
    const hamburger = document.getElementById('hamburger-btn')

    if (sidebar && overlay && hamburger) {
      sidebar.classList.remove('open')
      overlay.classList.remove('visible')
      hamburger.classList.remove('active')
    }
  }

  // Headphone button long press for random song
  startHeadphonePress() {
    this.headphonePressStart = Date.now()
    const icon = document.getElementById('dj-headphone-icon')

    if (icon) {
      icon.style.transform = 'scale(1.2)'
      icon.style.filter = 'drop-shadow(0 0 8px var(--accent))'
    }

    // Set timer for 2 seconds
    this.headphonePressTimer = setTimeout(() => {
      this.playRandomSong()
    }, 2000)
  }

  endHeadphonePress() {
    const icon = document.getElementById('dj-headphone-icon')

    if (icon) {
      icon.style.transform = 'scale(1)'
      icon.style.filter = ''
    }

    // Clear timer if released before 2 seconds
    if (this.headphonePressTimer) {
      clearTimeout(this.headphonePressTimer)
      this.headphonePressTimer = null
    }

    // Reset press start time
    if (this.headphonePressStart) {
      this.headphonePressStart = null
    }
  }

  playRandomSong() {
    // Clear the timer
    if (this.headphonePressTimer) {
      clearTimeout(this.headphonePressTimer)
      this.headphonePressTimer = null
    }
    this.headphonePressStart = null

    // Visual feedback
    const icon = document.getElementById('dj-headphone-icon')
    if (icon) {
      icon.style.transform = 'scale(1)'
      icon.style.filter = ''
    }

    // Filter out already played songs
    const availableSongs = songs.filter(song => {
      const songId = song.spotifyId || song.id
      return !this.playedSongs.includes(songId)
    })

    // Check if all songs have been played
    if (availableSongs.length === 0) {
      this.showToast('Alle Songs wurden bereits gespielt!', 'warning')
      console.log('⚠️ Keine neuen Songs mehr verfügbar')
      return
    }

    // Select random song from available songs
    const randomIndex = Math.floor(Math.random() * availableSongs.length)
    const randomSong = availableSongs[randomIndex]

    console.log('🎲 Zufälliger Song ausgewählt:', randomSong.title, 'von', randomSong.artist)
    console.log(`📊 Verbleibende Songs: ${availableSongs.length}/${songs.length}`)

    // Simulate QR code scan by calling handleQRCode
    if (randomSong.spotifyId) {
      this.handleQRCode(`https://open.spotify.com/track/${randomSong.spotifyId}`)
    } else if (randomSong.id) {
      this.handleQRCode(randomSong.id)
    }
  }

  // ===== Beat Sync Methods =====

  /**
   * Initialize Beat Sync system
   */
  initializeBeatSync() {
    const accessToken = spotifyAuth.getAccessToken()
    if (!accessToken) {
      console.warn('⚠️ No access token available for beat sync')
      return
    }

    beatAnimator.initialize(accessToken)

    // Register beat event listener
    document.addEventListener('beatPulse', (event) => {
      this.handleBeatPulse(event)
    })

    console.log('🎵 Beat Sync system initialized')
  }

  /**
   * Handle beat pulse event
   */
  handleBeatPulse(event) {
    if (!this.beatSyncEnabled || !beatSyncConfig.config.enabled) return

    const enabledElements = beatSyncConfig.getEnabledElements()

    enabledElements.forEach(element => {
      const domElements = document.querySelectorAll(element.selector)
      if (domElements.length > 0) {
        applyBeatAnimation(
          domElements,
          element.animationType,
          element.intensity,
          event.detail.duration,
          element.colors
        )
      }
    })
  }

  /**
   * Toggle Beat Sync on/off
   */
  toggleBeatSync() {
    this.beatSyncEnabled = !this.beatSyncEnabled

    if (this.beatSyncEnabled) {
      // Start beat sync if music is playing
      if (this.currentSong && this.currentSong.spotifyId) {
        this.startBeatSyncForCurrentTrack()
      }
      this.showToast('Beat Sync aktiviert! 🎵', 'success')
    } else {
      beatAnimator.stop()
      this.showToast('Beat Sync deaktiviert', 'info')
    }

    // Update UI
    this.updateBeatSyncButton()
  }

  /**
   * Start beat sync for current track
   */
  async startBeatSyncForCurrentTrack() {
    if (!this.currentSong || !this.currentSong.spotifyId) return

    const trackId = this.currentSong.spotifyId

    // Get fresh access token
    const accessToken = spotifyAuth.getAccessToken()
    if (!accessToken) {
      console.error('❌ No access token available for beat sync')
      this.showToast('Beat Sync benötigt aktive Spotify-Verbindung', 'error')
      return
    }

    // Load analysis if different track
    if (this.currentTrackId !== trackId) {
      const success = await beatAnimator.loadTrackAnalysis(trackId, accessToken)
      if (success) {
        this.currentTrackId = trackId
      } else {
        this.showToast('Beat-Analyse konnte nicht geladen werden', 'error')
        return
      }
    }

    // Get current playback position
    const state = await spotifyPlayer.getState()
    const position = state?.position || 0

    // Start beat sync
    beatAnimator.start(position)
  }

  /**
   * Update Beat Sync button appearance
   */
  updateBeatSyncButton() {
    const button = document.querySelector('.beat-sync-toggle')
    if (!button) return

    if (this.beatSyncEnabled) {
      button.classList.add('active')
    } else {
      button.classList.remove('active')
    }
  }

  /**
   * Open Beat Sync settings modal
   */
  openBeatSettings() {
    const content = beatSyncSettings.render()

    this.showModal(
      '🎵 Beat Sync Einstellungen',
      content,
      [
        { text: '✓ Speichern & Schließen', onclick: 'game.closeModal()', className: 'btn-accent' }
      ]
    )
  }
}

// Global game instance
window.game = new MxsterGame()
