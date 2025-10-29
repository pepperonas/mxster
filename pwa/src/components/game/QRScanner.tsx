/**
 * QR Scanner Component
 * Camera-based QR code scanner for Physical mode
 * Full implementation in Phase 9 - this is a placeholder
 */

import { useState } from 'react'
import { useUI } from '@/contexts'
import { CameraIcon } from '@/utils/icons'

export function QRScanner() {
  const { addToast } = useUI()
  const [isScanning, setIsScanning] = useState(false)

  const handleStartScan = () => {
    // Phase 9: Full QR scanner implementation with camera
    addToast('QR-Scanner wird in Phase 9 implementiert', 'info')
    setIsScanning(!isScanning)
  }

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-gray-800 text-center">
      {!isScanning ? (
        <>
          <div className="text-6xl mb-6">📷</div>
          <h3 className="text-2xl font-bold mb-4">QR-Code Scanner</h3>
          <p className="text-gray-400 mb-6">
            Scanne die QR-Codes auf den physischen Karten
          </p>
          <button
            onClick={handleStartScan}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-bold text-lg flex items-center gap-3 mx-auto"
          >
            <CameraIcon size={24} />
            Kamera starten
          </button>
        </>
      ) : (
        <>
          <div className="aspect-video bg-gray-800 rounded-lg mb-4 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-4 animate-pulse">📹</div>
              <p className="text-gray-400">Kamera-Feed (Phase 9)</p>
            </div>
          </div>
          <button
            onClick={handleStartScan}
            className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Kamera stoppen
          </button>
        </>
      )}

      <div className="mt-6 p-4 bg-purple-900/30 rounded-lg text-sm text-purple-300">
        💡 <strong>Tipp:</strong> Halte die Karte ruhig und gut beleuchtet vor die Kamera.
      </div>
    </div>
  )
}
