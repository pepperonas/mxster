/**
 * QR Scanner Component
 * Camera-based QR code scanner for Physical mode with proper lifecycle management
 */

import { useState, useEffect, useRef } from 'react'
import QrScanner from 'qr-scanner'
import { useGame, useUI } from '@/contexts'
import { CameraIcon } from '@/utils/icons'
import { songs } from '@/data/songs'

export function QRScanner() {
  const { setCurrentSong, addToPlayedSongs } = useGame()
  const { addToast } = useUI()
  const [isScanning, setIsScanning] = useState(true) // Automatically start scanning
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [httpsError, setHttpsError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)

  /**
   * Check if running in secure context (HTTPS or localhost)
   */
  const isSecureContext = window.isSecureContext || window.location.protocol === 'https:'

  /**
   * Camera Lifecycle Management
   * Start/Stop camera with proper cleanup
   */
  useEffect(() => {
    if (!isScanning || !videoRef.current) {
      return
    }

    let scanner: QrScanner | null = null

    const startCamera = async () => {
      // Check for HTTPS requirement
      if (!isSecureContext) {
        console.error('❌ HTTPS Required: Camera access only works over HTTPS')
        setHttpsError(true)
        setHasPermission(false)
        setIsScanning(false)
        addToast('HTTPS erforderlich für Kamera-Zugriff', 'error')
        return
      }

      try {
        console.log('📷 Starting QR Scanner...')

        // Create QR Scanner instance
        scanner = new QrScanner(
          videoRef.current!,
          (result) => handleScanSuccess(result.data),
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            returnDetailedScanResult: true
          }
        )

        scannerRef.current = scanner

        // Start scanning
        await scanner.start()
        setHasPermission(true)
        setHttpsError(false)
        console.log('✅ QR Scanner started')
        addToast('Kamera gestartet', 'success')
      } catch (error: any) {
        console.error('❌ QR Scanner error:', error)
        setHasPermission(false)

        // Check if error is due to insecure context
        if (
          error.message &&
          (error.message.includes('secure context') ||
            error.message.includes('https') ||
            error.message.includes('Only secure'))
        ) {
          setHttpsError(true)
          addToast('HTTPS erforderlich für Kamera-Zugriff', 'error')
        } else if (error.name === 'NotAllowedError') {
          addToast('Kamera-Zugriff verweigert', 'error')
        } else if (error.name === 'NotFoundError') {
          addToast('Keine Kamera gefunden', 'error')
        } else {
          addToast('Kamera konnte nicht gestartet werden', 'error')
        }

        setIsScanning(false)
      }
    }

    startCamera()

    // Cleanup: Stop camera on unmount or when scanning stops
    return () => {
      console.log('🔌 Stopping QR Scanner...')
      if (scanner) {
        scanner.stop()
        scanner.destroy()
        scannerRef.current = null
        console.log('✅ QR Scanner stopped and cleaned up')
      }
    }
  }, [isScanning, addToast])

  /**
   * Handle successful QR code scan
   */
  const handleScanSuccess = (data: string) => {
    console.log('🎯 QR Code detected:', data)

    // Extract Spotify track ID from URL
    const spotifyTrackIdMatch = data.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/)
    const trackId = spotifyTrackIdMatch ? spotifyTrackIdMatch[1] : data

    // Find song in database
    const song = songs.find(
      (s) => s.spotifyId === trackId || s.id === data || s.spotifyId === data
    )

    if (!song) {
      console.warn('⚠️ Song not found in database:', trackId)
      addToast('Song nicht in Datenbank gefunden', 'error')
      return
    }

    // Check if song already played (duplicate scan prevention)
    // This check should be done in GameContext, but we show immediate feedback
    console.log('✅ Song found:', song.title)

    // Set current song
    setCurrentSong(song)
    addToPlayedSongs(song.spotifyId || song.id)
    addToast(`Song gescannt: ${song.title}`, 'success')

    // Stop scanning after successful scan
    setIsScanning(false)
  }

  /**
   * Toggle scanning
   */
  const handleToggleScan = () => {
    setIsScanning(!isScanning)
  }

  return (
    <div className="glass rounded-2xl p-8 border-2 border-accent/30 hover:border-accent transition-colors text-center">
      {!isScanning ? (
        <>
          <div className="text-6xl mb-6">📷</div>
          <h3 className="text-2xl font-bold mb-4 text-gradient">QR-Code Scanner</h3>
          <p className="text-text-secondary mb-6">
            Scanne die QR-Codes auf den physischen Karten
          </p>
          <button
            onClick={handleToggleScan}
            className="btn btn-accent shadow-glow-accent flex items-center gap-3 mx-auto"
          >
            <CameraIcon size={24} />
            Kamera starten
          </button>

          {hasPermission === false && httpsError && (
            <div className="mt-6 p-4 bg-red-900/30 rounded-lg text-sm text-red-300">
              ⚠️ <strong>HTTPS erforderlich!</strong>
              <br />
              <br />
              Die Kamera kann nur über eine sichere HTTPS-Verbindung verwendet werden.
              <br />
              <br />
              <strong>Lösungen:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Verwende die virtuelle Spielvariante (keine Kamera benötigt)</li>
                <li>
                  Öffne die App über{' '}
                  <a
                    href="https://mxster.de"
                    className="text-secondary hover:text-text-secondary underline"
                  >
                    https://mxster.de
                  </a>
                </li>
                <li>Lokale Entwicklung: Verwende localhost statt 127.0.0.1</li>
              </ul>
            </div>
          )}

          {hasPermission === false && !httpsError && (
            <div className="mt-6 p-4 bg-red-900/30 rounded-lg text-sm text-red-300">
              ⚠️ <strong>Kamera-Zugriff verweigert.</strong> Bitte erlaube den Zugriff in deinen
              Browser-Einstellungen.
            </div>
          )}
        </>
      ) : (
        <>
          {/* Camera Video Feed - Square for QR codes */}
          <div className="aspect-square max-w-md mx-auto bg-primary rounded-lg mb-4 overflow-hidden relative border-2 border-accent/20">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {/* Scanning Indicator */}
            <div className="absolute top-4 right-4 px-3 py-1 bg-red-600 rounded-full text-sm font-bold animate-pulse shadow-glow-sm">
              🔴 LIVE
            </div>
          </div>

          <button
            onClick={handleToggleScan}
            className="btn btn-secondary"
          >
            Kamera stoppen
          </button>
        </>
      )}

      <div className="mt-6 p-4 glass rounded-lg text-sm text-text-secondary border border-accent/20">
        💡 <strong>Tipp:</strong> Halte die Karte ruhig und gut beleuchtet vor die Kamera.
      </div>
    </div>
  )
}
