/**
 * Music Player Component
 * Spotify Web Playback SDK Integration
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Song } from '@/types'
import { SpotifyPlayerService, type SpotifyPlayerState } from '@/services/SpotifyPlayerService'
import { MusicIcon } from '@/utils/icons'
import { useUI, useAuth, useSettings } from '@/contexts'

interface MusicPlayerProps {
  song: Song | null
  onStateChange?: (state: SpotifyPlayerState) => void
}

export function MusicPlayer({ song, onStateChange }: MusicPlayerProps) {
  const { addToast } = useUI()
  const { accessToken } = useAuth()
  const { settings } = useSettings()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPosition, setCurrentPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playerReady, setPlayerReady] = useState(false)

  // Track last played song to ensure we play each new song
  const lastPlayedSongId = useRef<string | null>(null)

  /**
   * Initialize Spotify Player on mount
   */
  useEffect(() => {
    const initPlayer = async () => {
      // Get access token from AuthContext
      if (!accessToken) {
        console.error('❌ No Spotify access token found')
        addToast('Spotify-Login erforderlich', 'error')
        return
      }

      try {
        // Check if player already ready
        if (SpotifyPlayerService.isPlayerReady()) {
          setPlayerReady(true)
          return
        }

        // Initialize player
        console.log('🎵 Initializing Spotify Player...')
        await SpotifyPlayerService.initialize(accessToken)
        setPlayerReady(true)
        console.log('✅ Spotify Player ready!')
      } catch (error) {
        console.error('❌ Failed to initialize player:', error)
        addToast('Spotify Player konnte nicht initialisiert werden', 'error')
      }
    }

    initPlayer()

    // NOTE: We don't disconnect the player on unmount because the component
    // might re-mount during game flow. The player will be cleaned up when
    // the user actually leaves the game or logs out.
  }, [accessToken, addToast])

  /**
   * Register player state change listener
   */
  useEffect(() => {
    const handleStateChange = (state: SpotifyPlayerState) => {
      setIsPlaying(!state.paused)
      setCurrentPosition(state.position)
      setDuration(state.duration)

      // Notify parent component
      if (onStateChange) {
        onStateChange(state)
      }
    }

    SpotifyPlayerService.onStateChange(handleStateChange)
  }, [onStateChange])

  /**
   * Play song when song prop changes
   */
  useEffect(() => {
    if (!song || !playerReady) {
      console.log('🔇 MusicPlayer: No song or player not ready', { song: !!song, playerReady })
      return
    }

    // Only play if this is a different song
    const songId = song.spotifyId || song.id
    if (lastPlayedSongId.current === songId) {
      console.log('🔇 Same song, skipping playback:', songId)
      return
    }

    console.log('🎵 New song detected:', song.title, 'ID:', songId)
    lastPlayedSongId.current = songId

    const playSong = async () => {
      setIsLoading(true)

      try {
        const trackUri = `spotify:track:${song.spotifyId}`

        // Calculate random start position if setting is enabled
        let startPosition = 0
        if (settings.randomStartPosition) {
          // Get track duration from Spotify API or use estimated 3 minutes (180000ms)
          const estimatedDuration = 180000 // 3 minutes in ms
          const minRemainingTime = 60000 // 60 seconds in ms

          // Random position: anywhere from 0 to (duration - 60s)
          const maxStartPosition = Math.max(0, estimatedDuration - minRemainingTime)
          startPosition = Math.floor(Math.random() * maxStartPosition)

          console.log(`🎲 Random start position: ${Math.floor(startPosition / 1000)}s (ensuring 60s+ remaining)`)
        }

        console.log('▶️ Playing track:', trackUri, 'for song:', song.title, 'at position:', startPosition)

        const success = await SpotifyPlayerService.playTrackWithPosition(trackUri, startPosition)

        if (success) {
          setIsPlaying(true)
          console.log('✅ Playback started successfully')
        } else {
          console.error('❌ Playback failed')
          addToast('Playback fehlgeschlagen', 'error')
        }
      } catch (error) {
        console.error('❌ Playback error:', error)
        addToast('Playback fehlgeschlagen', 'error')
      } finally {
        setIsLoading(false)
      }
    }

    playSong()
  }, [song, playerReady, addToast, settings.randomStartPosition])

  /**
   * Toggle play/pause
   */
  const handleTogglePlay = useCallback(async () => {
    if (!playerReady) return

    try {
      await SpotifyPlayerService.togglePlay()
      setIsPlaying(!isPlaying)
    } catch (error) {
      console.error('❌ Toggle play error:', error)
    }
  }, [isPlaying, playerReady])

  /**
   * Seek to position
   */
  const handleSeek = useCallback(
    async (percentage: number) => {
      if (!playerReady || duration === 0) return

      const positionMs = (percentage / 100) * duration
      try {
        await SpotifyPlayerService.seek(positionMs)
        setCurrentPosition(positionMs)
      } catch (error) {
        console.error('❌ Seek error:', error)
      }
    },
    [duration, playerReady]
  )

  /**
   * Format time (ms to mm:ss)
   */
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!song) return null

  const progress = duration > 0 ? (currentPosition / duration) * 100 : 0

  return (
    <div className="glass rounded-2xl p-8 border-2 border-accent/30 hover:border-accent transition-colors">
      {/* Song Info */}
      <div className="flex items-center gap-6 mb-6">
        <div className="w-24 h-24 bg-gradient-to-br from-secondary to-accent rounded-xl flex items-center justify-center text-4xl shadow-glow-accent">
          <MusicIcon size={48} color="white" />
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gradient mb-1">
            {isLoading ? 'Wird geladen...' : 'Song wird abgespielt'}
          </h3>
          <p className="text-text-secondary">Rate Titel, Interpret und Jahr</p>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div
            className="h-2 bg-primary rounded-full overflow-hidden cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              const percentage = (x / rect.width) * 100
              handleSeek(percentage)
            }}
          >
            <div
              className={`h-full bg-gradient-to-r from-secondary to-accent transition-all ${
                isPlaying ? '' : 'animate-pulse'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-secondary">
            <span>{formatTime(currentPosition)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleTogglePlay}
            disabled={!playerReady || isLoading}
            className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center hover:bg-secondary transition-colors text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '⏳' : isPlaying ? '⏸' : '▶️'}
          </button>
        </div>

        {/* Player Status */}
        {!playerReady && (
          <div className="text-center text-sm text-yellow-300">
            ⏳ Spotify Player wird initialisiert...
          </div>
        )}
      </div>
    </div>
  )
}
