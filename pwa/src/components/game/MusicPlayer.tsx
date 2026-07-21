/**
 * Music Player Component
 * Unified player supporting Spotify Premium + Preview fallback
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Song } from '@/types'
import { getMusicPlayer, type AudioMode } from '@/services/MusicPlayerService'
import type { PlayerState } from '@/services/PreviewPlayerService'
import { MusicIcon } from '@/utils/icons'
import { useUI, useAuth, useSettings, useInteraction } from '@/contexts'

interface MusicPlayerProps {
  song: Song | null
  onStateChange?: (state: PlayerState) => void
}

export function MusicPlayer({ song, onStateChange }: MusicPlayerProps) {
  const { addToast } = useUI()
  const { accessToken, isLoggedIn } = useAuth()
  const { settings } = useSettings()
  const { registerInteraction, setActivityLevel } = useInteraction()

  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPosition, setCurrentPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playerReady, setPlayerReady] = useState(false)
  const [audioMode, setAudioMode] = useState<AudioMode>('none')

  // Track last played song to ensure we play each new song
  const lastPlayedSongId = useRef<string | null>(null)
  const musicPlayer = useRef(getMusicPlayer())
  const progressInterval = useRef<number | null>(null)

  /**
   * Initialize player on mount (ONLY ONCE)
   */
  const playerInitialized = useRef(false)

  useEffect(() => {
    // Prevent multiple initializations
    if (playerInitialized.current) {
      console.log('⚠️ Player already initialized, skipping...')
      return
    }

    const initPlayer = async () => {
      playerInitialized.current = true

      // Check user's audio mode preference from Landing Page
      const preference = localStorage.getItem('audio_mode_preference') as AudioMode | null

      console.log('🎵 Initializing player with preference:', preference)

      // If Spotify mode + logged in, initialize Spotify player
      if (preference === 'spotify' && isLoggedIn && accessToken) {
        try {
          console.log('🎧 Initializing Spotify Premium mode...')
          await musicPlayer.current.initializeSpotifyPlayer(accessToken)
          setPlayerReady(true)
          setAudioMode('spotify')
          console.log('✅ Spotify Premium mode ready!')
        } catch (error) {
          console.error('❌ Failed to initialize Spotify:', error)
          addToast('Spotify konnte nicht initialisiert werden. Fallback zu Preview-Modus.', 'warning')
          setPlayerReady(true)
          setAudioMode('preview')
        }
      } else {
        // Preview mode (default)
        console.log('🎵 Using Preview mode (128 kbps MP3)')
        setPlayerReady(true)
        setAudioMode('preview')
      }

      // Register callbacks
      musicPlayer.current.config = {
        onStateChange: (state: PlayerState) => {
          const nowPlaying = state === 'playing'
          setIsPlaying(nowPlaying)

          // Music-reactive animation
          if (nowPlaying) {
            registerInteraction('music', 85)
          } else {
            setActivityLevel('calm')
          }

          onStateChange?.(state)
        },
        onProgress: (progress: number) => {
          // Progress from PreviewPlayer (0-100%)
          const pos = (progress / 100) * musicPlayer.current.getDuration() * 1000
          setCurrentPosition(pos)
        },
        onEnd: () => {
          setIsPlaying(false)
          setActivityLevel('calm')
        },
        onError: (error: string) => {
          addToast(error, 'error')
        },
        onModeChange: (mode: AudioMode) => {
          setAudioMode(mode)
        }
      }
    }

    initPlayer()

    return () => {
      // Clear progress interval
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - initialize ONLY ONCE on mount

  /**
   * Update progress bar for both Spotify and Preview modes
   */
  useEffect(() => {
    // Clear interval if not playing or no mode
    if (!isPlaying || audioMode === 'none') {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
        progressInterval.current = null
      }
      return
    }

    // Poll position every 500ms for both modes
    progressInterval.current = window.setInterval(() => {
      const pos = musicPlayer.current.getCurrentTime()
      const dur = musicPlayer.current.getDuration()
      setCurrentPosition(pos * 1000) // Convert to ms
      setDuration(dur * 1000)
    }, 500)

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
        progressInterval.current = null
      }
    }
  }, [audioMode, isPlaying])

  /**
   * Play song when song prop changes
   */
  useEffect(() => {
    if (!song || !playerReady) {
      console.log('🔇 MusicPlayer: No song or player not ready', { song: !!song, playerReady })
      return
    }

    // Note: Removed lastPlayedSongId check - MusicPlayerService.play() already handles
    // stopping the old track before playing new one, so duplicate prevention is not needed here
    const songId = song.spotifyId || song.id
    console.log('🎵 New song detected:', song.title, 'ID:', songId)
    lastPlayedSongId.current = songId

    const playSong = async () => {
      setIsLoading(true)

      try {
        // Calculate random start position if setting is enabled
        let startPosition = 0
        if (settings.randomStartPosition && (audioMode === 'spotify' || audioMode === 'preview')) {
          // For both Spotify and self-hosted MP3s (full songs ~3-5 minutes)
          const estimatedDuration = 210 // 3.5 minutes in seconds (average song length)
          const minRemainingTime = 60 // 60 seconds guaranteed playback

          const maxStartPosition = Math.max(0, estimatedDuration - minRemainingTime)
          startPosition = Math.floor(Math.random() * maxStartPosition)

          console.log(`🎲 Random start position: ${startPosition}s (ensuring ${minRemainingTime}s+ remaining)`)
        }

        console.log(`▶️ Playing ${audioMode} mode:`, song.title, 'at position:', startPosition)

        await musicPlayer.current.play(song, startPosition)

        setIsPlaying(true)
        setDuration(musicPlayer.current.getDuration() * 1000) // Convert to ms

        console.log('✅ Playback started successfully')

        // Trigger intense animation when new song starts
        registerInteraction('music', 85)
      } catch (error) {
        console.error('❌ Playback error:', error)
        // Error toast already shown by musicPlayer
      } finally {
        setIsLoading(false)
      }
    }

    playSong()
  }, [song, playerReady, settings.randomStartPosition, audioMode, registerInteraction])

  /**
   * Toggle play/pause
   */
  const handleTogglePlay = useCallback(async () => {
    if (!playerReady) return

    try {
      if (isPlaying) {
        musicPlayer.current.pause()
        setIsPlaying(false)
      } else {
        musicPlayer.current.resume()
        setIsPlaying(true)
      }
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

      const positionSeconds = (percentage / 100) * (duration / 1000)
      try {
        musicPlayer.current.seek(positionSeconds)
        setCurrentPosition(positionSeconds * 1000)
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

  // Mode badge configuration
  const modeBadge = {
    spotify: {
      label: '🎧 Spotify Premium (320 kbps)',
      color: 'text-green-400 border-green-500/30 bg-green-500/10'
    },
    preview: {
      label: '🎵 Standard Audio (128 kbps)',
      color: 'text-orange-400 border-orange-500/30 bg-orange-500/10'
    },
    none: {
      label: '⏸️ Kein Audio',
      color: 'text-gray-400 border-gray-500/30 bg-gray-500/10'
    }
  }

  const currentBadge = modeBadge[audioMode]

  return (
    <div
      className="bg-md-surface-container rounded-m3-xl p-4 sm:p-6 lg:p-8 border border-md-outline-variant/50 hover:bg-md-surface-container-high transition-colors duration-m3-effects ease-m3-effects"
      style={{ viewTransitionName: 'music-player' }}
    >
      {/* Song Info */}
      <div className="flex items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-secondary to-accent rounded-m3-lg flex items-center justify-center shadow-glow-accent flex-shrink-0">
          <MusicIcon size={32} color="white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-2xl font-bold text-gradient mb-1">
            {isLoading ? 'Wird geladen...' : 'Song wird abgespielt'}
          </h3>
          <p className="text-text-secondary">Rate Titel, Interpret und Jahr</p>

          {/* Audio Mode Badge */}
          <div className="mt-2">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${currentBadge.color}`}>
              {currentBadge.label}
            </span>
          </div>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div
            className="h-4 sm:h-3 bg-md-surface-container-highest rounded-m3-full overflow-hidden cursor-pointer border border-accent/20 hover:border-accent/50 transition-colors"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              const percentage = (x / rect.width) * 100
              handleSeek(percentage)
            }}
          >
            <div
              className={`h-full bg-gradient-to-r from-secondary via-accent to-secondary transition-all shadow-lg ${
                isPlaying ? '' : 'animate-pulse'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className="text-secondary">{formatTime(currentPosition)}</span>
            <span className="text-text-secondary">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {/* Play/pause with M3 shape morph: circle when paused → squircle while playing */}
          <button
            onClick={handleTogglePlay}
            disabled={!playerReady || isLoading}
            className={`w-14 h-14 min-w-[48px] min-h-[48px] bg-md-primary text-md-on-primary m3-state-layer flex items-center justify-center shadow-glow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${
              isPlaying ? 'rounded-m3-lg' : 'rounded-m3-full'
            }`}
            style={{ transition: 'border-radius var(--m3-spatial-fast), transform var(--m3-spatial-fast), background-color var(--m3-effects-default)' }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <span className="m3-loading-arc" style={{ width: 22, height: 22, borderTopColor: 'currentColor', borderRightColor: 'currentColor' }} />
            ) : (
              <span className="text-xl flex items-center justify-center">
                {isPlaying ? '⏸️' : '▶️'}
              </span>
            )}
          </button>
        </div>

        {/* Player Status */}
        {!playerReady && (
          <div className="text-center text-sm text-yellow-300">
            ⏳ Player wird initialisiert...
          </div>
        )}

        {/* Preview Mode Info */}
        {audioMode === 'preview' && playerReady && (
          <div className="text-center text-xs text-text-secondary border-t border-accent/20 pt-3">
            {song.previewUrl ? (
              <span>💡 Standard Audio-Modus: Volle Songs · 128 kbps MP3 · Unbegrenzte Spieler</span>
            ) : (
              <span className="text-yellow-400">⚠️ Kein Audio verfügbar für diesen Song</span>
            )}
          </div>
        )}

        {/* No Audio Mode Info */}
        {audioMode === 'none' && playerReady && (
          <div className="text-center text-xs border-t border-red-500/20 pt-3">
            <p className="text-red-400 mb-2">❌ Kein Audio verfügbar</p>
            <p className="text-text-secondary text-xs">
              Dieser Song hat keine Preview-URL. Für Vollzugriff nutze Spotify Premium.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
