/**
 * Player Setup Screen
 * Add/remove players before starting the game
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame, useUI } from '@/contexts'
import { PlusIcon, CloseIcon } from '@/utils/icons'
import { requiresDJ } from '@/utils/gameModes'

export function PlayerSetup() {
  const navigate = useNavigate()
  const { gameMode, gameVariant, players, addPlayer, removePlayer, startGame } = useGame()
  const { addToast } = useUI()
  const [newPlayerName, setNewPlayerName] = useState('')

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

    addPlayer(newPlayerName.trim())
    setNewPlayerName('')
    addToast(`${newPlayerName} hinzugefügt`, 'success')
  }

  const handleRemovePlayer = (index: number) => {
    const playerName = players[index].name
    removePlayer(index)
    addToast(`${playerName} entfernt`, 'info')
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
          <div className="flex gap-3">
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
        </div>

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
                      {index === 0 && needsDJ ? '🎧' : '🎮'}
                    </span>
                    <div>
                      <p className="font-medium text-white">{player.name}</p>
                      {index === 0 && needsDJ && (
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
