/**
 * Player Setup Screen
 * Add/remove players before starting the game
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame, useUI, useSettings } from '@/contexts'
import { PlusIcon, CloseIcon } from '@/utils/icons'
import { requiresDJ } from '@/utils/gameModes'
import { createBotPlayers } from '@/services/botPlayer'

export function PlayerSetup() {
  const navigate = useNavigate()
  const { gameMode, gameVariant, players, addPlayer, removePlayer, startGame } = useGame()
  const { addToast } = useUI()
  const { settings, addPlayer: savePlayer } = useSettings()
  const [newPlayerName, setNewPlayerName] = useState('')
  const [botCount, setBotCount] = useState(1)
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')

  if (!gameMode || !gameVariant) {
    navigate('/mode-selection')
    return null
  }

  const needsDJ = requiresDJ(gameMode, gameVariant)
  const minPlayers = 2 // All modes require minimum 2 players (DJ also plays in physical mode)

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) {
      addToast('Bitte gib einen Namen ein', 'warning')
      return
    }

    if (players.some((p) => p.name.toLowerCase() === newPlayerName.trim().toLowerCase())) {
      addToast('Dieser Name existiert bereits', 'error')
      return
    }

    const playerName = newPlayerName.trim()
    addPlayer(playerName)
    savePlayer(playerName) // Save to settings for future use
    setNewPlayerName('')
    addToast(`${playerName} hinzugefügt`, 'success')
  }

  const handleQuickAddPlayer = (playerName: string) => {
    if (players.some((p) => p.name.toLowerCase() === playerName.toLowerCase())) {
      addToast('Dieser Name existiert bereits', 'error')
      return
    }

    addPlayer(playerName)
    addToast(`${playerName} hinzugefügt`, 'success')
  }

  const handleRemovePlayer = (index: number) => {
    const playerName = players[index].name
    removePlayer(index)
    addToast(`${playerName} entfernt`, 'info')
  }

  const handleAddBots = () => {
    // Only allow in virtual mode
    if (gameVariant !== 'virtual') {
      addToast('Bots sind nur im Virtual Mode verfügbar', 'warning')
      return
    }

    // Only allow when exactly 1 human player exists
    const humanPlayers = players.filter((p) => !p.isBot)
    if (humanPlayers.length !== 1) {
      addToast('Bots können nur hinzugefügt werden, wenn genau 1 menschlicher Spieler vorhanden ist', 'warning')
      return
    }

    // Remove existing bots first
    const existingBots = players.filter((p) => p.isBot)
    existingBots.forEach((bot) => {
      const index = players.findIndex((p) => p.name === bot.name)
      if (index !== -1) removePlayer(index)
    })

    // Create new bot players
    const bots = createBotPlayers(botCount, botDifficulty, players.filter((p) => !p.isBot))
    bots.forEach((bot) => addPlayer(bot.name, bot))

    const difficultyLabels = { easy: 'Leicht', medium: 'Mittel', hard: 'Schwer' }
    addToast(
      `${botCount} ${botCount === 1 ? 'Bot' : 'Bots'} hinzugefügt (${difficultyLabels[botDifficulty]})`,
      'success'
    )
  }

  const handleStartGame = () => {
    if (players.length < minPlayers) {
      addToast(`Mindestens ${minPlayers} Spieler benötigt`, 'warning')
      return
    }

    startGame()
    navigate('/game')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // If field is empty AND minimum players reached -> Start game
      if (!newPlayerName.trim() && players.length >= minPlayers) {
        handleStartGame()
      }
      // If field has name -> Add player
      else if (newPlayerName.trim()) {
        handleAddPlayer()
      }
      // Otherwise: Show warning (field empty but not enough players)
      else {
        addToast(`Mindestens ${minPlayers} Spieler benötigt`, 'warning')
      }
    }
  }

  return (
    <div className="min-h-screen pt-28 pb-8 relative z-10">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-gradient mb-4">
            Spieler hinzufügen
          </h1>
          <p className="text-xl text-text-secondary mb-2">
            Mindestens {minPlayers} Spieler benötigt
          </p>
          {needsDJ && (
            <p className="text-sm text-yellow-400">
              ℹ️ Der erste Spieler ist DJ (scannt QR-Codes) und spielt mit
            </p>
          )}
        </div>

        {/* Add Player Input */}
        <div className="glass rounded-2xl p-8 border-2 border-accent/30 mb-8">
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Spielername eingeben..."
              className="flex-1 px-4 py-3 bg-primary border-2 border-accent/30 rounded-lg text-white placeholder-gray-500 focus:border-accent focus:shadow-glow-accent focus:outline-none focus:ring-0 transition-all"
              maxLength={20}
              autoFocus
            />
            <button
              onClick={handleAddPlayer}
              className="btn btn-accent px-6 py-3 flex items-center gap-2"
            >
              <PlusIcon size={20} />
              <span className="hidden sm:inline">Hinzufügen</span>
            </button>
          </div>

          {/* Saved Players Quick Add */}
          {settings.savedPlayers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-secondary mb-3">
                👥 Gespeicherte Spieler
              </h3>
              <div className="flex flex-wrap gap-2">
                {settings.savedPlayers.map((playerName, index) => {
                  const isAlreadyAdded = players.some(
                    (p) => p.name.toLowerCase() === playerName.toLowerCase()
                  )
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuickAddPlayer(playerName)}
                      disabled={isAlreadyAdded}
                      className={`
                        px-4 py-2 rounded-lg font-medium transition-all border-2
                        ${
                          isAlreadyAdded
                            ? 'bg-gray-700 text-text-secondary border-gray-600 cursor-not-allowed'
                            : 'bg-primary border-accent/30 text-white hover:border-accent hover:shadow-glow-sm'
                        }
                      `}
                      title={isAlreadyAdded ? 'Bereits hinzugefügt' : `${playerName} hinzufügen`}
                    >
                      {playerName}
                      {isAlreadyAdded && ' ✓'}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bot Configuration Panel (Virtual Mode only) */}
        {gameVariant === 'virtual' && players.length === 1 && players.filter(p => !p.isBot).length === 1 && (
          <div className="glass rounded-2xl p-8 border-2 border-cyan-500/40 mb-8 bg-gradient-to-br from-cyan-900/20 to-blue-900/20">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🤖</span>
              <h2 className="text-2xl font-bold text-white">Bot-Gegner hinzufügen</h2>
            </div>

            <p className="text-text-secondary mb-6">
              Spiele gegen KI-Gegner in verschiedenen Schwierigkeitsgraden
            </p>

            <div className="space-y-6">
              {/* Bot Count Selector */}
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-3">
                  Anzahl der Bots
                </label>
                <div className="flex gap-3">
                  {[1, 2, 3].map((count) => (
                    <button
                      key={count}
                      onClick={() => setBotCount(count)}
                      className={`
                        flex-1 py-3 px-4 rounded-lg font-medium transition-all border-2
                        ${
                          botCount === count
                            ? 'bg-cyan-600 border-cyan-400 text-white shadow-glow-cyan'
                            : 'bg-primary border-white/10 text-white hover:border-cyan-500/50'
                        }
                      `}
                    >
                      {count} Bot{count > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bot Difficulty Selector */}
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-3">
                  Schwierigkeitsgrad
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setBotDifficulty('easy')}
                    className={`
                      flex-1 py-3 px-4 rounded-lg font-medium transition-all border-2
                      ${
                        botDifficulty === 'easy'
                          ? 'bg-green-600 border-green-400 text-white shadow-glow-green'
                          : 'bg-primary border-white/10 text-white hover:border-green-500/50'
                      }
                    `}
                  >
                    😊 Leicht
                  </button>
                  <button
                    onClick={() => setBotDifficulty('medium')}
                    className={`
                      flex-1 py-3 px-4 rounded-lg font-medium transition-all border-2
                      ${
                        botDifficulty === 'medium'
                          ? 'bg-orange-600 border-orange-400 text-white shadow-glow-orange'
                          : 'bg-primary border-white/10 text-white hover:border-orange-500/50'
                      }
                    `}
                  >
                    🎯 Mittel
                  </button>
                  <button
                    onClick={() => setBotDifficulty('hard')}
                    className={`
                      flex-1 py-3 px-4 rounded-lg font-medium transition-all border-2
                      ${
                        botDifficulty === 'hard'
                          ? 'bg-red-600 border-red-400 text-white shadow-glow-red'
                          : 'bg-primary border-white/10 text-white hover:border-red-500/50'
                      }
                    `}
                  >
                    🔥 Schwer
                  </button>
                </div>
              </div>

              {/* Difficulty Description */}
              <div className="bg-primary/50 rounded-lg p-4 border border-white/10">
                <p className="text-sm text-text-secondary">
                  {botDifficulty === 'easy' && '😊 Leicht: Perfekt für Einsteiger. Der Bot macht häufig Fehler (~30% Trefferquote).'}
                  {botDifficulty === 'medium' && '🎯 Mittel: Eine faire Herausforderung. Der Bot hat eine solide Trefferquote (~60%).'}
                  {botDifficulty === 'hard' && '🔥 Schwer: Nur für Profis! Der Bot spielt fast perfekt (~90% Trefferquote).'}
                </p>
              </div>

              {/* Add Bots Button */}
              <button
                onClick={handleAddBots}
                className="w-full btn btn-accent py-4 text-lg font-bold shadow-glow-accent"
              >
                🤖 {botCount} Bot{botCount > 1 ? 's' : ''} hinzufügen ({botDifficulty === 'easy' ? 'Leicht' : botDifficulty === 'medium' ? 'Mittel' : 'Schwer'})
              </button>
            </div>
          </div>
        )}

        {/* Players List */}
        {players.length > 0 && (
          <div className="glass rounded-2xl p-8 border-2 border-accent/30 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Spieler ({players.length})
            </h2>
            <div className="space-y-3">
              {players.map((player, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-primary rounded-lg border-2 border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {player.isBot ? '🤖' : (index === 0 && needsDJ ? '🎧' : '🎮')}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{player.name}</p>
                        {player.isBot && player.botDifficulty && (
                          <span className={`
                            text-xs px-2 py-1 rounded font-semibold
                            ${player.botDifficulty === 'easy' ? 'bg-green-600/30 text-green-300 border border-green-500/50' : ''}
                            ${player.botDifficulty === 'medium' ? 'bg-orange-600/30 text-orange-300 border border-orange-500/50' : ''}
                            ${player.botDifficulty === 'hard' ? 'bg-red-600/30 text-red-300 border border-red-500/50' : ''}
                          `}>
                            {player.botDifficulty === 'easy' ? 'Leicht' : player.botDifficulty === 'medium' ? 'Mittel' : 'Schwer'}
                          </span>
                        )}
                      </div>
                      {player.isBot && (
                        <p className="text-xs text-cyan-400">KI-Gegner</p>
                      )}
                      {!player.isBot && index === 0 && needsDJ && (
                        <p className="text-xs text-secondary">DJ (scannt QR-Codes)</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemovePlayer(index)}
                    className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-red-400 hover:text-red-300"
                    aria-label={`${player.name} entfernen`}
                  >
                    <CloseIcon size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Start Button */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/variant-selection')}
            className="btn btn-secondary"
          >
            ← Zurück
          </button>
          <button
            onClick={handleStartGame}
            disabled={players.length < minPlayers}
            className={`
              px-12 py-4 rounded-lg font-bold text-lg transition-all
              ${
                players.length >= minPlayers
                  ? 'btn btn-accent shadow-glow-accent'
                  : 'bg-gray-700 text-text-secondary cursor-not-allowed'
              }
            `}
          >
            {players.length >= minPlayers ? '🎮 Spiel starten' : `Noch ${minPlayers - players.length} Spieler fehlen`}
          </button>
        </div>
      </div>
    </div>
  )
}
