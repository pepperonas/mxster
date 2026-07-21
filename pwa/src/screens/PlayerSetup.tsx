/**
 * Player Setup Screen
 * Add/remove players before starting the game
 */

import { useState } from 'react'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { useGame, useUI, useSettings } from '@/contexts'
import { PlusIcon, CloseIcon } from '@/utils/icons'
import { requiresDJ } from '@/utils/gameModes'
import { createBotPlayers } from '@/services/botPlayer'

export function PlayerSetup() {
  const navigate = useAppNavigate()
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
          <h1 className="text-display-sm md:text-display-md text-emphasized text-gradient mb-4">
            Spieler hinzufügen
          </h1>
          <p className="text-title-lg text-text-secondary mb-2">
            Mindestens {minPlayers} Spieler benötigt
          </p>

          {/* Virtual Mode Banner (Prominent) */}
          {!needsDJ && (
            <div className="mt-4 p-4 bg-md-secondary-container border border-md-primary/40 rounded-m3-lg">
              <p className="text-title-md text-md-on-secondary-container mb-1">
                🎮 Virtueller Modus - Sofort loslegen!
              </p>
              <p className="text-body-sm text-text-secondary">
                Keine Karten nötig · Songs werden automatisch gezogen · Keine DJ-Rolle erforderlich
              </p>
            </div>
          )}

          {/* DJ Info (Less Prominent for Physical Mode) */}
          {needsDJ && (
            <p className="text-body-sm text-text-secondary mt-2">
              ℹ️ DJ-Modus: Der erste Spieler scannt QR-Codes und spielt mit
            </p>
          )}
        </div>

        {/* Add Player Input */}
        <div className="card p-6 sm:p-8 mb-8">
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Spielername eingeben..."
              className="input flex-1"
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
              <h3 className="text-label-lg text-text-secondary mb-3">
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
                        px-5 py-2 min-h-[48px] rounded-m3-full text-label-lg border transition-all duration-m3-spatial-fast ease-m3-spatial-fast
                        ${
                          isAlreadyAdded
                            ? 'bg-md-surface-container-highest text-text-secondary border-transparent cursor-not-allowed'
                            : 'bg-md-surface-container-high border-md-outline-variant text-text-primary hover:border-md-primary hover:shadow-glow-sm active:scale-95'
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
          <div className="card p-6 sm:p-8 mb-8 border-secondary/40">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🤖</span>
              <h2 className="text-headline-sm text-text-primary">Bot-Gegner hinzufügen</h2>
            </div>

            <p className="text-body-md text-text-secondary mb-6">
              Spiele gegen KI-Gegner in verschiedenen Schwierigkeitsgraden
            </p>

            <div className="space-y-6">
              {/* Bot Count Selector */}
              <div>
                <label className="block text-label-lg text-text-secondary mb-3">
                  Anzahl der Bots
                </label>
                <div className="flex gap-3">
                  {[1, 2, 3].map((count) => (
                    <button
                      key={count}
                      onClick={() => setBotCount(count)}
                      style={{ transition: 'border-radius var(--m3-spatial-fast), transform var(--m3-spatial-fast), background-color var(--m3-effects-default), border-color var(--m3-effects-default), color var(--m3-effects-default)' }}
                      className={`
                        flex-1 py-3 px-4 min-h-[48px] text-label-lg border-2 active:scale-95
                        ${
                          botCount === count
                            ? 'bg-md-secondary-container text-md-on-secondary-container border-md-primary rounded-m3-xl'
                            : 'bg-md-surface-container-high border-transparent text-text-primary hover:border-md-primary/50 rounded-m3-lg'
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
                <label className="block text-label-lg text-text-secondary mb-3">
                  Schwierigkeitsgrad
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setBotDifficulty('easy')}
                    style={{ transition: 'border-radius var(--m3-spatial-fast), transform var(--m3-spatial-fast), background-color var(--m3-effects-default), border-color var(--m3-effects-default), color var(--m3-effects-default)' }}
                    className={`
                      flex-1 py-3 px-4 min-h-[48px] text-label-lg border-2 active:scale-95
                      ${
                        botDifficulty === 'easy'
                          ? 'bg-md-secondary-container text-md-on-secondary-container border-md-primary rounded-m3-xl'
                          : 'bg-md-surface-container-high border-transparent text-text-primary hover:border-md-primary/50 rounded-m3-lg'
                      }
                    `}
                  >
                    😊 Leicht
                  </button>
                  <button
                    onClick={() => setBotDifficulty('medium')}
                    style={{ transition: 'border-radius var(--m3-spatial-fast), transform var(--m3-spatial-fast), background-color var(--m3-effects-default), border-color var(--m3-effects-default), color var(--m3-effects-default)' }}
                    className={`
                      flex-1 py-3 px-4 min-h-[48px] text-label-lg border-2 active:scale-95
                      ${
                        botDifficulty === 'medium'
                          ? 'bg-md-secondary-container text-md-on-secondary-container border-md-primary rounded-m3-xl'
                          : 'bg-md-surface-container-high border-transparent text-text-primary hover:border-md-primary/50 rounded-m3-lg'
                      }
                    `}
                  >
                    🎯 Mittel
                  </button>
                  <button
                    onClick={() => setBotDifficulty('hard')}
                    style={{ transition: 'border-radius var(--m3-spatial-fast), transform var(--m3-spatial-fast), background-color var(--m3-effects-default), border-color var(--m3-effects-default), color var(--m3-effects-default)' }}
                    className={`
                      flex-1 py-3 px-4 min-h-[48px] text-label-lg border-2 active:scale-95
                      ${
                        botDifficulty === 'hard'
                          ? 'bg-md-secondary-container text-md-on-secondary-container border-md-primary rounded-m3-xl'
                          : 'bg-md-surface-container-high border-transparent text-text-primary hover:border-md-primary/50 rounded-m3-lg'
                      }
                    `}
                  >
                    🔥 Schwer
                  </button>
                </div>
              </div>

              {/* Difficulty Description */}
              <div className="bg-md-surface-container-highest rounded-m3-md p-4 border border-white/5">
                <p className="text-body-sm text-text-secondary">
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
          <div className="card p-6 sm:p-8 mb-8">
            <h2 className="text-headline-sm text-text-primary mb-6">
              Spieler ({players.length})
            </h2>
            <div className="space-y-3 stagger-children">
              {players.map((player, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 px-5 min-h-[48px] bg-md-surface-container-high rounded-m3-full border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {player.isBot ? '🤖' : (index === 0 && needsDJ ? '🎧' : '🎮')}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-label-lg text-text-primary">{player.name}</p>
                        {player.isBot && player.botDifficulty && (
                          <span className={`
                            text-label-sm px-2 py-1 rounded-m3-full
                            ${player.botDifficulty === 'easy' ? 'bg-md-secondary-container text-md-on-secondary-container' : ''}
                            ${player.botDifficulty === 'medium' ? 'bg-md-tertiary-container text-md-on-tertiary-container' : ''}
                            ${player.botDifficulty === 'hard' ? 'bg-md-error-container text-md-on-error-container' : ''}
                          `}>
                            {player.botDifficulty === 'easy' ? 'Leicht' : player.botDifficulty === 'medium' ? 'Mittel' : 'Schwer'}
                          </span>
                        )}
                      </div>
                      {player.isBot && (
                        <p className="text-label-sm text-secondary">KI-Gegner</p>
                      )}
                      {!player.isBot && index === 0 && needsDJ && (
                        <p className="text-label-sm text-secondary">DJ (scannt QR-Codes)</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemovePlayer(index)}
                    className="touch-target p-2 rounded-m3-full text-md-error hover:bg-md-error-container hover:text-md-on-error-container active:scale-95 transition-all duration-m3-spatial-fast ease-m3-spatial-fast"
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
              px-12 py-4 text-lg transition-all
              ${
                players.length >= minPlayers
                  ? 'btn btn-accent font-bold shadow-glow-accent'
                  : 'bg-md-surface-container-highest text-text-secondary cursor-not-allowed rounded-m3-full min-h-[48px] font-medium'
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
