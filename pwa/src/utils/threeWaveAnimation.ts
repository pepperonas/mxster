/**
 * Three.js Particle Wave Animation
 * Beautiful 3D particle wave effect synchronized with music beats
 */

import * as THREE from 'three'

interface AnimationState {
  time: number
  waveIntensity: number
}

let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let particleSystem: THREE.Points | null = null
let animationFrameId: number | null = null
let isInitialized = false
let animationState: AnimationState = {
  time: 0,
  waveIntensity: 0
}

/**
 * Initialize Three.js scene
 */
export function initThreeWave(): void {
  if (isInitialized) return

  const container = document.getElementById('beat-background')
  if (!container) {
    console.error('Beat background container not found')
    return
  }

  // Scene Setup
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  })

  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Cap at 2 for performance
  renderer.domElement.style.position = 'fixed'
  renderer.domElement.style.top = '0'
  renderer.domElement.style.left = '0'
  renderer.domElement.style.width = '100vw'
  renderer.domElement.style.height = '100vh'
  renderer.domElement.style.pointerEvents = 'none'
  renderer.domElement.style.zIndex = '0'
  container.appendChild(renderer.domElement)

  // Particle System - MASSIVE wave field for viewing from distance
  const particleCount = 10000 // More particles for dense coverage
  const particles = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)

  // Initialize particle positions in huge grid
  const gridSize = Math.ceil(Math.sqrt(particleCount))
  const spacing = 6.0 // Much wider spacing for larger scale

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3
    const x = (i % gridSize) - gridSize / 2
    const z = Math.floor(i / gridSize) - gridSize / 2

    positions[i3] = x * spacing
    positions[i3 + 1] = 0
    positions[i3 + 2] = z * spacing
  }

  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  // Create perfectly round texture with alpha transparency
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    console.error('Cannot get 2D context for canvas')
    return
  }

  // Fill with transparent background
  ctx.clearRect(0, 0, 256, 256)

  // Draw perfect circle with soft edges
  const centerX = 128
  const centerY = 128
  const radius = 120

  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.9)')
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.5)')
  gradient.addColorStop(0.85, 'rgba(255, 255, 255, 0.1)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, false)
  ctx.closePath()
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  // Particle Material - PERFECTLY ROUND particles, larger for distance viewing
  const material = new THREE.PointsMaterial({
    map: texture,
    color: 0x6366f1, // Accent blue
    size: 1.2, // Much larger for viewing from distance
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    depthWrite: false,
    alphaTest: 0.01
  })

  particleSystem = new THREE.Points(particles, material)
  scene.add(particleSystem)

  // Camera Position - MUCH further back for overview perspective
  camera.position.set(0, 80, 140) // High and far back
  camera.lookAt(0, 0, 0) // Look at center of wave field

  // Handle Window Resize
  window.addEventListener('resize', onWindowResize)

  isInitialized = true
  console.log('🌊 Three.js Wave initialized')
}

/**
 * Handle window resize
 */
function onWindowResize(): void {
  if (!camera || !renderer) return

  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

/**
 * Start wave animation
 */
export function startThreeWave(intensity: number = 50): void {
  if (!isInitialized) {
    initThreeWave()
  }

  if (!particleSystem || !renderer || !scene || !camera) return

  // Stop previous animation
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }

  // Normalize intensity (0-100 to 0-1)
  const normalizedIntensity = intensity / 100

  // Animation loop - BUTTER SMOOTH 60fps with optimized calculations
  let lastTime = performance.now()

  function animate(currentTime: number): void {
    if (!particleSystem || !renderer || !scene || !camera) return

    // Delta time for frame-independent animation
    const deltaTime = (currentTime - lastTime) * 0.001 // Convert to seconds
    lastTime = currentTime

    // Smooth time progression (capped for consistency)
    animationState.time += Math.min(deltaTime, 0.1) * 2

    const positionsAttr = particleSystem.geometry.attributes.position
    const positions = positionsAttr.array as Float32Array
    const time = animationState.time

    // Optimized wave calculations - pre-calculate values
    const t1 = time * 1.5
    const t2 = time * 2.0
    const t3 = time * 2.5

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const z = positions[i + 2]

      // Large, smooth waves with multiple harmonics
      const wave1 = Math.sin(x * 0.15 + t1) * 5 * normalizedIntensity
      const wave2 = Math.cos(z * 0.15 + t1) * 5 * normalizedIntensity

      // Circular ripple effect
      const distance = Math.sqrt(x * x + z * z) * 0.05
      const wave3 = Math.sin(distance - t2) * 8 * normalizedIntensity

      // Cross pattern for visual interest
      const wave4 = Math.sin((x + z) * 0.1 + t3) * 3 * normalizedIntensity

      // DRAMATIC BEAT PULSE - Multiplied by distance for ripple effect
      const beatIntensity = animationState.waveIntensity
      const beatPulse = beatIntensity * 25 * normalizedIntensity // Much stronger!

      // Beat ripple spreads from center
      const beatRipple = Math.sin(distance * 2 - beatIntensity * 10) * beatIntensity * 15

      // Combine all waves with STRONG beat reaction
      positions[i + 1] = wave1 + wave2 + wave3 + wave4 + beatPulse + beatRipple
    }

    // Flag geometry for update
    positionsAttr.needsUpdate = true

    // Beat-reactive particle color - flash brighter on beats
    const material = particleSystem.material as THREE.PointsMaterial
    material.opacity = 0.85 + (animationState.waveIntensity * 0.15) // Pulse opacity

    // Very slow rotation for dynamic view
    particleSystem.rotation.y += deltaTime * 0.1

    // SLOWER beat intensity decay - beats last longer and are more visible
    animationState.waveIntensity *= Math.pow(0.85, deltaTime * 60)

    // Render scene
    renderer!.render(scene!, camera!)

    animationFrameId = requestAnimationFrame(animate)
  }

  // Start animation loop with initial timestamp
  animate(performance.now())
  console.log('🌊 Three.js Wave started - Smooth 60fps with delta time')
}

/**
 * Trigger beat pulse in the wave
 */
export function triggerWaveBeat(intensity: number = 50): void {
  animationState.waveIntensity = intensity / 100
}

/**
 * Stop wave animation
 */
export function stopThreeWave(): void {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  console.log('🌊 Three.js Wave stopped')
}

/**
 * Cleanup Three.js resources
 */
export function cleanupThreeWave(): void {
  stopThreeWave()

  if (renderer && renderer.domElement && renderer.domElement.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement)
  }

  if (particleSystem) {
    particleSystem.geometry.dispose()
    const material = particleSystem.material as THREE.PointsMaterial
    material.dispose()
    if (scene) {
      scene.remove(particleSystem)
    }
  }

  if (renderer) {
    renderer.dispose()
  }

  scene = null
  camera = null
  renderer = null
  particleSystem = null
  isInitialized = false

  window.removeEventListener('resize', onWindowResize)

  console.log('🌊 Three.js Wave cleaned up')
}
