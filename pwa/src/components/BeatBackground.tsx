/**
 * BeatBackground Component
 * Three.js-powered animated background with beat synchronization
 * Simplified version - full implementation in Phase 10
 */

import { useEffect, useRef } from 'react'
import { useBeatSync } from '@/contexts'

export function BeatBackground() {
  const { enabled, animationType, intensity } = useBeatSync()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!enabled || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Simple gradient background for now
    // Full Three.js implementation in Phase 10
    const drawBackground = () => {
      if (!ctx) return

      // Create gradient based on animation type
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)

      switch (animationType) {
        case 'wave_3d':
          gradient.addColorStop(0, '#1a0033')
          gradient.addColorStop(0.5, '#330066')
          gradient.addColorStop(1, '#1a0033')
          break
        case 'pulse':
          gradient.addColorStop(0, '#0d1117')
          gradient.addColorStop(1, '#1f1f2e')
          break
        case 'flash':
          gradient.addColorStop(0, '#1a1a2e')
          gradient.addColorStop(1, '#16213e')
          break
        case 'gradient':
          gradient.addColorStop(0, '#121212')
          gradient.addColorStop(0.5, '#1e1e2e')
          gradient.addColorStop(1, '#121212')
          break
        case 'glow':
          gradient.addColorStop(0, '#0f0f0f')
          gradient.addColorStop(0.5, '#1a1a2e')
          gradient.addColorStop(1, '#0f0f0f')
          break
        default:
          gradient.addColorStop(0, '#0d1117')
          gradient.addColorStop(1, '#161b22')
      }

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Initial draw
    drawBackground()

    // Animation loop placeholder
    let animationId: number
    const animate = () => {
      drawBackground()
      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [enabled, animationType, intensity])

  if (!enabled) {
    return (
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      aria-hidden="true"
    />
  )
}
