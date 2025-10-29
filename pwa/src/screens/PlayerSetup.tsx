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
  const minPlayers = needsDJ ? 3 : 2 // DJ + 2 players minimum for physical guess mode

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
      handleAddPlayer()
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-gradient mb-4">
            Spieler hinzufügen
          </h1>
          <p className="text-xl text-gray-400 mb-2">
            Mindestens {minPlayers} Spieler benötigt
          </p>
          {needsDJ && (
            <p className="text-sm text-yellow-400">
              ℹ️ Der erste Spieler wird automatisch als DJ festgelegt
            </p>
          )}
        </div>

        {/* Add Player Input */}
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-gray-800 mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Spielername eingeben..."
              className="flex-1 px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-600 focus:outline-none"
              maxLength={20}
              autoFocus
            />
            <button
              onClick={handleAddPlayer}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white font-medium flex items-center gap-2"
            >
              <PlusIcon size={20} />
              <span className="hidden sm:inline">Hinzufügen</span>
            </button>
          </div>
        </div>

        {/* Players List */}
        {players.length > 0 && (
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-gray-800 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Spieler ({players.length})
            </h2>
            <div className="space-y-3">
              {players.map((player, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border-2 border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {index === 0 && needsDJ ? '🎧' : '🎮'}
                    </span>
                    <div>
                      <p className="font-medium text-white">{player.name}</p>
                      {index === 0 && needsDJ && (
                        <p className="text-xs text-purple-400">DJ (scannt QR-Codes)</p>
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
            className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-white"
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
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-glow-accent text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
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
