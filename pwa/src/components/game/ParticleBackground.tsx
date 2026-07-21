/**
 * ParticleBackground Component
 * Enhanced 3D Particle Animation with Three.js
 * Features:
 * - Multi-layer particle systems with different colors
 * - Dramatic beat-reactive explosions and waves
 * - Dynamic camera movements
 * - Color gradients synchronized with beats
 * - Glow effects and advanced blending
 * - Activity-based animation intensity (responds to user interactions)
 */

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { ActivityLevel } from '@/contexts/InteractionContext'
import {
  getParametersForActivity,
  interpolateParameters,
  getTransitionDuration,
  type AnimationParameters
} from '@/utils/activityAnimations'
import {
  startInteractionTracking,
  stopInteractionTracking
} from '@/utils/interactionActivityTracker'
import { getParticleCount, prefersReducedMotion } from '@/utils/animationHelpers'

interface ParticleBackgroundProps {
  isPlaying?: boolean
  beatIntensity?: number
  activityLevel?: ActivityLevel
  isHardcoreMode?: boolean
}

export function ParticleBackground({
  isPlaying = false,
  beatIntensity = 0,
  activityLevel = 'calm',
  isHardcoreMode = false
}: ParticleBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const particleSystemsRef = useRef<THREE.Points[]>([])
  const animationIdRef = useRef<number | null>(null)
  const timeRef = useRef(0)
  const beatPulseRef = useRef(0)
  const interactionIntensityRef = useRef(0)

  // Activity-based animation parameters (includes colors now!)
  const [currentParams, setCurrentParams] = useState<AnimationParameters>(() =>
    getParametersForActivity('calm', isHardcoreMode)
  )
  const [targetParams, setTargetParams] = useState<AnimationParameters>(() =>
    getParametersForActivity('calm', isHardcoreMode)
  )
  const transitionStartTimeRef = useRef(0)
  const transitionDurationRef = useRef(0)
  const previousActivityRef = useRef<ActivityLevel>('calm')
  const previousHardcoreModeRef = useRef(isHardcoreMode)

  useEffect(() => {
    if (!containerRef.current) return

    // Reduced motion: skip the entire WebGL scene — the container renders the
    // static token-based gradient from currentParams.backgroundColor instead.
    if (prefersReducedMotion()) return

    // ============================================================================
    // Scene Setup
    // ============================================================================

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x000000, 0.0008) // Add depth with fog
    sceneRef.current = scene

    // Camera Setup - Dynamic perspective
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    )
    camera.position.set(0, 100, 200)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // ============================================================================
    // Particle Texture - Perfect circle with glow
    // ============================================================================

    const createParticleTexture = (glowIntensity: number = 1.0) => {
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 256
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      ctx.clearRect(0, 0, 256, 256)

      const centerX = 128
      const centerY = 128
      const radius = 120

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
      gradient.addColorStop(0, `rgba(255, 255, 255, ${1.0 * glowIntensity})`)
      gradient.addColorStop(0.2, `rgba(255, 255, 255, ${0.95 * glowIntensity})`)
      gradient.addColorStop(0.5, `rgba(255, 255, 255, ${0.6 * glowIntensity})`)
      gradient.addColorStop(0.8, `rgba(255, 255, 255, ${0.2 * glowIntensity})`)
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()

      return new THREE.CanvasTexture(canvas)
    }

    // ============================================================================
    // Multi-Layer Particle Systems
    // ============================================================================

    const particleSystems: THREE.Points[] = []

    // Layer 1: Main Wave (Purple/Blue)
    const createMainWave = () => {
      const count = getParticleCount(12000) // halved on mobile
      const geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(count * 3)
      const velocities = new Float32Array(count * 3)

      const gridSize = Math.ceil(Math.sqrt(count))
      const spacing = 7.0

      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        const x = (i % gridSize) - gridSize / 2
        const z = Math.floor(i / gridSize) - gridSize / 2

        positions[i3] = x * spacing
        positions[i3 + 1] = 0
        positions[i3 + 2] = z * spacing

        // Random velocities for organic movement
        velocities[i3] = (Math.random() - 0.5) * 0.1
        velocities[i3 + 1] = (Math.random() - 0.5) * 0.1
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.1
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))

      const material = new THREE.PointsMaterial({
        map: createParticleTexture(1.0),
        color: currentParams.mainColor, // Color from interpolated parameters
        size: currentParams.mainParticleSize,
        transparent: true,
        opacity: currentParams.mainOpacity,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        depthWrite: false
      })

      return new THREE.Points(geometry, material)
    }

    // Layer 2: Accent Wave (Orange/Red)
    const createAccentWave = () => {
      const count = getParticleCount(8000)
      const geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(count * 3)

      const gridSize = Math.ceil(Math.sqrt(count))
      const spacing = 8.5

      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        const x = (i % gridSize) - gridSize / 2
        const z = Math.floor(i / gridSize) - gridSize / 2

        positions[i3] = x * spacing + (Math.random() - 0.5) * 2
        positions[i3 + 1] = 0
        positions[i3 + 2] = z * spacing + (Math.random() - 0.5) * 2
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

      const material = new THREE.PointsMaterial({
        map: createParticleTexture(1.2),
        color: currentParams.accentColor, // Color from interpolated parameters
        size: currentParams.accentParticleSize,
        transparent: true,
        opacity: currentParams.accentOpacity,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        depthWrite: false
      })

      return new THREE.Points(geometry, material)
    }

    // Layer 3: Floating Stars (Cyan)
    const createStarLayer = () => {
      const count = getParticleCount(5000)
      const geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(count * 3)

      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        positions[i3] = (Math.random() - 0.5) * 800
        positions[i3 + 1] = Math.random() * 400 - 50
        positions[i3 + 2] = (Math.random() - 0.5) * 800
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

      const material = new THREE.PointsMaterial({
        map: createParticleTexture(0.8),
        color: currentParams.starColor, // Color from interpolated parameters
        size: currentParams.starParticleSize,
        transparent: true,
        opacity: currentParams.starOpacity,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        depthWrite: false
      })

      return new THREE.Points(geometry, material)
    }

    // Create and add all layers
    const mainWave = createMainWave()
    const accentWave = createAccentWave()
    const starLayer = createStarLayer()

    scene.add(mainWave)
    scene.add(accentWave)
    scene.add(starLayer)

    particleSystems.push(mainWave, accentWave, starLayer)
    particleSystemsRef.current = particleSystems

    // ============================================================================
    // Start Interaction Tracking
    // ============================================================================

    startInteractionTracking((intensity: number) => {
      interactionIntensityRef.current = intensity
    })

    console.log('🖱️ Interaction tracking started for ParticleBackground')

    // ============================================================================
    // Animation Loop
    // ============================================================================

    let lastTime = performance.now()

    const animate = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) * 0.001, 0.1)
      lastTime = currentTime

      timeRef.current += deltaTime

      const time = timeRef.current

      // Decay beat pulse
      beatPulseRef.current *= Math.pow(0.9, deltaTime * 60)

      // Combined intensity from beat AND mouse/touch interaction
      const interactionBoost = interactionIntensityRef.current / 100 // 0-1
      const combinedPulse = Math.max(beatPulseRef.current, interactionBoost)

      // ============================================================================
      // Main Wave Animation - Complex multi-wave patterns
      // ============================================================================

      const mainPositions = mainWave.geometry.attributes.position.array as Float32Array
      const mainVelocities = mainWave.geometry.attributes.velocity.array as Float32Array

      for (let i = 0; i < mainPositions.length; i += 3) {
        const x = mainPositions[i]
        const z = mainPositions[i + 2]

        // Multiple wave harmonics (scaled by activity AND interaction)
        const baseAmplitude = currentParams.waveAmplitude * (1 + interactionBoost * 0.5)
        const wave1 = Math.sin(x * 0.12 + time * 1.5) * (6 * baseAmplitude)
        const wave2 = Math.cos(z * 0.12 + time * 1.8) * (6 * baseAmplitude)
        const wave3 = Math.sin((x + z) * 0.08 + time * 2.2) * (4 * baseAmplitude)

        // Circular ripples from center (scaled by activity)
        const distFromCenter = Math.sqrt(x * x + z * z)
        const ripple1 = Math.sin(distFromCenter * 0.06 - time * 2.5) * (10 * baseAmplitude)
        const ripple2 = Math.cos(distFromCenter * 0.04 + time * 1.8) * (6 * baseAmplitude)

        // Cross patterns (scaled by activity)
        const cross = Math.sin((x - z) * 0.1 + time * 1.2) * (3 * baseAmplitude)

        // Beat explosion effect - radiating from center
        const beatDistance = Math.sqrt(x * x + z * z) * 0.02
        const beatWave = Math.sin(beatDistance - beatPulseRef.current * 15) * beatPulseRef.current * 40
        const beatExplosion = beatPulseRef.current * 35 * Math.exp(-beatDistance * 0.5)

        // NEW: Turbulence/Noise for organic chaos (activity-based)
        const turbulence =
          currentParams.turbulenceStrength > 0
            ? Math.sin(x * 0.05 + time * 3) * Math.cos(z * 0.05 - time * 2.5) * currentParams.turbulenceStrength * 15
            : 0

        // NEW: Interaction ripple - responds to mouse/touch movement
        const interactionRipple = Math.sin(distFromCenter * 0.08 - time * 4) * interactionBoost * 20

        // Combine all effects (including turbulence AND interaction)
        mainPositions[i + 1] = wave1 + wave2 + wave3 + ripple1 + ripple2 + cross + beatWave + beatExplosion + turbulence + interactionRipple

        // NEW: Activity-based velocity multiplier (more dynamic drift based on user interaction)
        const velocityMultiplier = currentParams.rotationSpeed / 0.08 // Base rotation is 0.08, scales with activity
        mainPositions[i] += mainVelocities[i] * deltaTime * 10 * velocityMultiplier
        mainPositions[i + 2] += mainVelocities[i + 2] * deltaTime * 10 * velocityMultiplier
      }

      mainWave.geometry.attributes.position.needsUpdate = true

      // Beat-reactive AND interaction-reactive material properties
      const mainMaterial = mainWave.material as THREE.PointsMaterial
      mainMaterial.color.setHex(currentParams.mainColor) // Update color smoothly
      mainMaterial.opacity = currentParams.mainOpacity + combinedPulse * 0.2
      mainMaterial.size = currentParams.mainParticleSize + combinedPulse * 1.5

      // Activity-based rotation
      mainWave.rotation.y += deltaTime * currentParams.rotationSpeed

      // ============================================================================
      // Accent Wave Animation - Secondary layer with offset timing
      // ============================================================================

      const accentPositions = accentWave.geometry.attributes.position.array as Float32Array

      for (let i = 0; i < accentPositions.length; i += 3) {
        const x = accentPositions[i]
        const z = accentPositions[i + 2]

        // Offset timing for layered effect (scaled by activity)
        const accentAmplitude = currentParams.waveAmplitude
        const wave1 = Math.sin(x * 0.1 - time * 1.8) * (8 * accentAmplitude)
        const wave2 = Math.cos(z * 0.1 + time * 2.0) * (8 * accentAmplitude)

        const distFromCenter = Math.sqrt(x * x + z * z)
        const ripple = Math.cos(distFromCenter * 0.05 + time * 2.8) * (12 * accentAmplitude)

        // Beat effect with different pattern
        const beatDistance = Math.sqrt(x * x + z * z) * 0.015
        const beatRipple = Math.cos(beatDistance + beatPulseRef.current * 12) * beatPulseRef.current * 45

        accentPositions[i + 1] = wave1 + wave2 + ripple + beatRipple
      }

      accentWave.geometry.attributes.position.needsUpdate = true

      const accentMaterial = accentWave.material as THREE.PointsMaterial
      accentMaterial.color.setHex(currentParams.accentColor) // Update color smoothly
      accentMaterial.opacity = currentParams.accentOpacity + combinedPulse * 0.3
      accentMaterial.size = currentParams.accentParticleSize + combinedPulse * 2.0

      accentWave.rotation.y -= deltaTime * (currentParams.rotationSpeed * 1.5) // Counter-rotation (faster)

      // ============================================================================
      // Star Layer Animation - Floating ambient particles
      // ============================================================================

      const starPositions = starLayer.geometry.attributes.position.array as Float32Array

      for (let i = 0; i < starPositions.length; i += 3) {
        const x = starPositions[i]
        const z = starPositions[i + 2]

        // Gentle float
        const float = Math.sin(time * 0.5 + i * 0.01) * 2

        // Slight wave influence
        const wave = Math.sin(x * 0.02 + z * 0.02 + time) * 3

        starPositions[i + 1] = (starPositions[i + 1] % 400) + float + wave - 50
      }

      starLayer.geometry.attributes.position.needsUpdate = true

      const starMaterial = starLayer.material as THREE.PointsMaterial
      starMaterial.color.setHex(currentParams.starColor) // Update color smoothly
      starMaterial.opacity = currentParams.starOpacity + Math.sin(time * 0.8) * 0.2 + combinedPulse * 0.3
      starMaterial.size = currentParams.starParticleSize

      // ============================================================================
      // Dynamic Camera Movement
      // ============================================================================

      if (isPlaying) {
        // Orbital camera movement (activity-based)
        const cameraRadius = currentParams.cameraRadius
        const cameraSpeed = currentParams.cameraSpeed
        const cameraX = Math.sin(time * cameraSpeed) * cameraRadius * 0.3
        const cameraZ = Math.cos(time * cameraSpeed) * cameraRadius

        camera.position.x = cameraX
        camera.position.z = cameraZ
        camera.position.y = 100 + Math.sin(time * 0.3) * 30 + beatPulseRef.current * 20

        // Look slightly ahead of center
        camera.lookAt(
          Math.sin(time * cameraSpeed + 0.5) * 20,
          0,
          Math.cos(time * cameraSpeed + 0.5) * 20
        )
      }

      // Render scene
      renderer.render(scene, camera)

      animationIdRef.current = requestAnimationFrame(animate)
    }

    // Start animation
    animate(performance.now())

    // ============================================================================
    // Window Resize Handler
    // ============================================================================

    const handleResize = () => {
      if (!camera || !renderer) return

      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    console.log('🎨 Enhanced Particle Background initialized')

    // ============================================================================
    // Cleanup
    // ============================================================================

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }

      // Stop interaction tracking
      stopInteractionTracking()
      console.log('🖱️ Interaction tracking stopped for ParticleBackground')

      window.removeEventListener('resize', handleResize)

      particleSystems.forEach((system) => {
        system.geometry.dispose()
        const material = system.material as THREE.PointsMaterial
        material.dispose()
        if (material.map) material.map.dispose()
        scene.remove(system)
      })

      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }

      renderer.dispose()

      console.log('🎨 Particle Background cleaned up')
    }
  }, [isPlaying])

  // Update beat pulse when beatIntensity changes
  useEffect(() => {
    if (beatIntensity > 0) {
      beatPulseRef.current = Math.min(beatIntensity / 100, 1.0)
    }
  }, [beatIntensity])

  // Handle activity level AND game mode changes with smooth transitions
  useEffect(() => {
    const activityChanged = activityLevel !== previousActivityRef.current
    const gameModeChanged = isHardcoreMode !== previousHardcoreModeRef.current

    if (activityChanged || gameModeChanged) {
      if (activityChanged) {
        console.log(`🎨 Activity level changed: ${previousActivityRef.current} → ${activityLevel}`)
      }
      if (gameModeChanged) {
        console.log(`🎨 Game mode changed: ${previousHardcoreModeRef.current ? 'HARDCORE' : 'TIMELINE'} → ${isHardcoreMode ? 'HARDCORE' : 'TIMELINE'}`)
      }

      const newParams = getParametersForActivity(activityLevel, isHardcoreMode)
      const duration = activityChanged
        ? getTransitionDuration(previousActivityRef.current, activityLevel)
        : 800 // 800ms for game mode changes

      setTargetParams(newParams)
      transitionStartTimeRef.current = Date.now()
      transitionDurationRef.current = duration
      previousActivityRef.current = activityLevel
      previousHardcoreModeRef.current = isHardcoreMode
    }
  }, [activityLevel, isHardcoreMode])

  // Smooth parameter interpolation — rAF loop keyed only on the target, so the
  // effect isn't torn down and recreated on every interpolation frame
  useEffect(() => {
    if (transitionDurationRef.current <= 0) return

    let rafId: number
    const step = () => {
      const elapsed = Date.now() - transitionStartTimeRef.current
      const progress = Math.min(1, elapsed / transitionDurationRef.current)

      if (progress < 1) {
        setCurrentParams((prev) => interpolateParameters(prev, targetParams, progress))
        rafId = requestAnimationFrame(step)
      } else {
        setCurrentParams(targetParams)
        transitionDurationRef.current = 0
      }
    }
    rafId = requestAnimationFrame(step)

    return () => cancelAnimationFrame(rafId)
  }, [targetParams])

  // Colors are now handled by the smooth interpolation system above - no separate useEffect needed!

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none particle-bg"
      style={{
        background: currentParams.backgroundColor, // Smooth background transition
        viewTransitionName: 'particle-bg'
      }}
      aria-hidden="true"
    />
  )
}
