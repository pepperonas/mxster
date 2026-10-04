/**
 * Music Player Component
 * Unified player supporting Spotify Premium + Preview fallback
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Song } from '@/types'
import { getMusicPlayer, type AudioMode } from '@/services/MusicPlayerService'
import type { PlayerState } from '@/services/PreviewPlayerService'
import { AnimatePresence, m } from 'motion/react'
import { spring } from '@/motion/springs'
import { useUI, useAuth, useSettings, useInteraction, useGame } from '@/contexts'

interface MusicPlayerProps {
  song: Song | null
  onStateChange?: (state: PlayerState) => void
}

export function MusicPlayer({ song, onStateChange }: MusicPlayerProps) {
  const { addToast } = useUI()
  const { accessToken, isLoggedIn } = useAuth()
  const { settings } = useSettings()
  const { registerInteraction, setActivityLevel } = useInteraction()
  const { gameMode } = useGame()

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

  const progress = duration > 0 ? Math.min(100, (currentPosition / duration) * 100) : 0
  const status = isLoading ? 'Wird geladen …' : isPlaying ? 'Song läuft' : 'Pausiert'
  const modeLabel =
    audioMode === 'spotify' ? 'Spotify Premium · 320 kbps' : audioMode === 'preview' ? 'Standard-Audio · 128 kbps' : 'Kein Audio'

  // The component itself stays mounted (player init is expensive); only its
  // surface enters and leaves.
  return (
    <AnimatePresence initial={false}>
      {song && (
        <m.section
          key="music-player"
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98, transition: spring.effectsDefault }}
          transition={spring.spatialDefault}
          className="bg-md-surface-container rounded-m3-xl p-4 sm:p-6 border border-md-outline-variant/50"
          aria-label="Musik"
        >
          <div className="flex items-center gap-4 mb-4">
            <Equalizer playing={isPlaying && !isLoading} />
            <div className="flex-1 min-w-0">
              <p className="text-title-lg text-text-primary">{status}</p>
              <p className="text-body-md text-md-on-surface-variant">
                {gameMode === 'hardcore' ? 'Rate Titel, Interpret und Jahr' : 'Wo gehört der Song auf der Zeitleiste hin?'}
              </p>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-m3-full text-label-md bg-md-secondary-container text-md-on-secondary-container">
                {modeLabel}
              </span>
            </div>
            <m.button
              type="button"
              onClick={handleTogglePlay}
              disabled={!playerReady || isLoading}
              animate={{ borderRadius: isPlaying ? 'var(--m3-shape-lg)' : 'var(--m3-shape-full)' }}
              whileTap={{ scale: 0.9 }}
              transition={spring.spatialFast}
              className="m3-state-layer flex-shrink-0 w-14 h-14 grid place-items-center bg-md-primary text-md-on-primary shadow-m3-2 disabled:opacity-40"
              aria-label={isPlaying ? 'Pause' : 'Abspielen'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isLoading ? (
                  <m.span key="load" className="m3-loading-arc" style={{ width: 22, height: 22, borderTopColor: 'currentColor', borderRightColor: 'currentColor' }} />
                ) : (
                  <m.svg
                    key={isPlaying ? 'pause' : 'play'}
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.4, opacity: 0, rotate: 30 }}
                    transition={spring.spatialFast}
                    aria-hidden="true"
                  >
                    {isPlaying ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />}
                  </m.svg>
                )}
              </AnimatePresence>
            </m.button>
          </div>

          <input
            type="range"
            min={0}
            max={1000}
            step={1}
            value={Math.round(progress * 10)}
            onChange={(e) => handleSeek(Number(e.target.value) / 10)}
            disabled={!playerReady || duration === 0}
            className="m3-slider w-full"
            style={{ '--progress': `${progress}%` } as React.CSSProperties}
            aria-label="Position im Song"
            aria-valuetext={`${formatTime(currentPosition)} von ${formatTime(duration)}`}
          />
          <div className="flex justify-between mt-1 text-label-md tabular-nums text-md-on-surface-variant">
            <span>{formatTime(currentPosition)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {!playerReady && <p className="mt-3 text-center text-body-sm text-md-on-surface-variant">Player wird initialisiert …</p>}
          {audioMode === 'preview' && playerReady && !song.previewUrl && (
            <p className="mt-3 text-center text-body-sm text-md-warning">Für diesen Song ist kein Audio verfügbar.</p>
          )}
          {audioMode === 'none' && playerReady && (
            <p className="mt-3 text-center text-body-sm text-md-error">
              Kein Audio verfügbar. Für Vollzugriff nutze Spotify Premium.
            </p>
          )}
        </m.section>
      )}
    </AnimatePresence>
  )
}

/** Cover art: equalizer bars that dance while music plays and rest when paused. */
function Equalizer({ playing }: { playing: boolean }) {
  const bars = [0.55, 0.9, 0.7, 1, 0.6]
  return (
    <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-m3-lg bg-md-tertiary-container text-md-on-tertiary-container flex items-end justify-center gap-1 p-3" aria-hidden="true">
      {bars.map((peak, i) => (
        <m.span
          key={i}
          className="w-1.5 sm:w-2 h-full rounded-m3-full bg-current origin-bottom"
          animate={playing ? { scaleY: [0.25, peak, 0.4, peak * 0.8, 0.25] } : { scaleY: 0.25 }}
          transition={
            playing
              ? { duration: 1.1 + i * 0.12, repeat: Infinity, ease: 'easeInOut', delay: i * 0.08 }
              : spring.spatialDefault
          }
        />
      ))}
    </div>
  )
}
