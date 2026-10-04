/**
 * ParticleBackground — the three.js wave field behind the app.
 *
 * Performance architecture (all state lives in refs, never in React state):
 * - the scene is built once per mount (and rebuilt only if the reduced-motion
 *   preference flips); activity/beat/mode changes retarget parameters that
 *   the render loop interpolates itself — from the value at the moment of the
 *   change, not compounding from the previous frame;
 * - the loop stops while the tab is hidden and drops to ~20 fps while a
 *   foreground gesture asks for quiet (see motion/backgroundControl);
 * - reduced motion: no WebGL at all, a static token gradient instead (live).
 * Colours mirror the design tokens (activityAnimations).
 * Loaded lazily (App.tsx), so three.js is not part of the first paint.
 */
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { ActivityLevel } from '@/contexts/InteractionContext'
import {
  getParametersForActivity,
  interpolateParameters,
  getTransitionDuration,
  type AnimationParameters
} from '@/utils/activityAnimations'
import { startInteractionTracking, stopInteractionTracking } from '@/utils/interactionActivityTracker'
import { getParticleCount } from '@/utils/animationHelpers'
import { useReducedMotionPreference } from '@/motion/policy'
import { isBackgroundQuiet } from '@/motion/backgroundControl'

interface ParticleBackgroundProps {
  isPlaying?: boolean
  beatIntensity?: number
  /** Changes on every impulse (equal strengths must still pulse). */
  pulseSeq?: number
  activityLevel?: ActivityLevel
  isHardcoreMode?: boolean
}

const QUIET_FRAME_MS = 50

interface Transition {
  from: AnimationParameters
  to: AnimationParameters
  start: number
  duration: number
}

export function ParticleBackground({
  isPlaying = false,
  beatIntensity = 0,
  pulseSeq = 0,
  activityLevel = 'calm',
  isHardcoreMode = false
}: ParticleBackgroundProps) {
  const reduced = useReducedMotionPreference()
  const containerRef = useRef<HTMLDivElement>(null)
  const paramsRef = useRef<AnimationParameters>(getParametersForActivity('calm', isHardcoreMode))
  const transitionRef = useRef<Transition | null>(null)
  const beatPulseRef = useRef(0)
  const interactionRef = useRef(0)
  const playingRef = useRef(isPlaying)
  const previous = useRef({ activity: 'calm' as ActivityLevel, hardcore: isHardcoreMode })

  playingRef.current = isPlaying

  // Retarget parameters (the loop does the interpolation)
  useEffect(() => {
    const prev = previous.current
    if (prev.activity === activityLevel && prev.hardcore === isHardcoreMode) return
    const duration = prev.activity !== activityLevel ? getTransitionDuration(prev.activity, activityLevel) : 800
    transitionRef.current = {
      from: paramsRef.current,
      to: getParametersForActivity(activityLevel, isHardcoreMode),
      start: performance.now(),
      duration
    }
    previous.current = { activity: activityLevel, hardcore: isHardcoreMode }
    // Reduced motion has no loop: apply the background at once
    if (reduced && containerRef.current) {
      paramsRef.current = transitionRef.current.to
      containerRef.current.style.background = paramsRef.current.backgroundColor
    }
  }, [activityLevel, isHardcoreMode, reduced])

  useEffect(() => {
    if (beatIntensity > 0) beatPulseRef.current = Math.min(beatIntensity / 100, 1)
  }, [beatIntensity, pulseSeq])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.style.background = paramsRef.current.backgroundColor
    if (reduced) return

    // ── Scene ──────────────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x000000, 0.0008)
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000)
    camera.position.set(0, 100, 200)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    const texture = (glow: number) => {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 256
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 120)
      g.addColorStop(0, `rgba(255,255,255,${glow})`)
      g.addColorStop(0.2, `rgba(255,255,255,${0.95 * glow})`)
      g.addColorStop(0.5, `rgba(255,255,255,${0.6 * glow})`)
      g.addColorStop(0.8, `rgba(255,255,255,${0.2 * glow})`)
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(128, 128, 120, 0, Math.PI * 2)
      ctx.fill()
      return new THREE.CanvasTexture(canvas)
    }

    const p0 = paramsRef.current
    const material = (glow: number, color: number, size: number, opacity: number) =>
      new THREE.PointsMaterial({
        map: texture(glow),
        color,
        size,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        depthWrite: false
      })

    const grid = (count: number, spacing: number, jitter: number) => {
      const positions = new Float32Array(count * 3)
      const side = Math.ceil(Math.sqrt(count))
      for (let i = 0; i < count; i++) {
        positions[i * 3] = ((i % side) - side / 2) * spacing + (Math.random() - 0.5) * jitter
        positions[i * 3 + 2] = (Math.floor(i / side) - side / 2) * spacing + (Math.random() - 0.5) * jitter
      }
      return positions
    }

    // Layer 1: main wave (drifts with per-particle velocity)
    const mainCount = getParticleCount(12000)
    const mainGeometry = new THREE.BufferGeometry()
    mainGeometry.setAttribute('position', new THREE.BufferAttribute(grid(mainCount, 7, 0), 3))
    const velocities = new Float32Array(mainCount * 3).map(() => (Math.random() - 0.5) * 0.1)
    const mainWave = new THREE.Points(mainGeometry, material(1, p0.mainColor, p0.mainParticleSize, p0.mainOpacity))

    // Layer 2: accent wave
    const accentGeometry = new THREE.BufferGeometry()
    accentGeometry.setAttribute('position', new THREE.BufferAttribute(grid(getParticleCount(8000), 8.5, 2), 3))
    const accentWave = new THREE.Points(accentGeometry, material(1.2, p0.accentColor, p0.accentParticleSize, p0.accentOpacity))

    // Layer 3: floating stars
    const starCount = getParticleCount(5000)
    const starPositions0 = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      starPositions0[i * 3] = (Math.random() - 0.5) * 800
      starPositions0[i * 3 + 1] = Math.random() * 400 - 50
      starPositions0[i * 3 + 2] = (Math.random() - 0.5) * 800
    }
    const starGeometry = new THREE.BufferGeometry()
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions0, 3))
    const starLayer = new THREE.Points(starGeometry, material(0.8, p0.starColor, p0.starParticleSize, p0.starOpacity))

    const layers = [mainWave, accentWave, starLayer]
    layers.forEach((l) => scene.add(l))

    startInteractionTracking((intensity: number) => {
      interactionRef.current = intensity
    })

    // ── Loop ───────────────────────────────────────────────────────────────
    let raf = 0
    let last = performance.now()
    let lastRender = 0
    let time = 0
    let lastBackground = ''

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (isBackgroundQuiet() && now - lastRender < QUIET_FRAME_MS) return
      lastRender = now

      const dt = Math.min((now - last) * 0.001, 0.1)
      last = now
      time += dt

      // Parameter transition, measured from the value at retarget time
      const tr = transitionRef.current
      if (tr) {
        const progress = Math.min(1, (now - tr.start) / tr.duration)
        paramsRef.current = interpolateParameters(tr.from, tr.to, progress)
        if (progress >= 1) transitionRef.current = null
      }
      const p = paramsRef.current
      if (p.backgroundColor !== lastBackground) {
        container.style.background = p.backgroundColor
        lastBackground = p.backgroundColor
      }

      beatPulseRef.current *= Math.pow(0.9, dt * 60)
      const beat = beatPulseRef.current
      const boost = interactionRef.current / 100
      const pulse = Math.max(beat, boost)

      // Main wave
      const mp = mainGeometry.attributes.position.array as Float32Array
      const amp = p.waveAmplitude * (1 + boost * 0.5)
      const drift = (p.rotationSpeed / 0.08) * dt * 10
      for (let i = 0; i < mp.length; i += 3) {
        const x = mp[i]
        const z = mp[i + 2]
        const d = Math.sqrt(x * x + z * z)
        const bd = d * 0.02
        mp[i + 1] =
          Math.sin(x * 0.12 + time * 1.5) * 6 * amp +
          Math.cos(z * 0.12 + time * 1.8) * 6 * amp +
          Math.sin((x + z) * 0.08 + time * 2.2) * 4 * amp +
          Math.sin(d * 0.06 - time * 2.5) * 10 * amp +
          Math.cos(d * 0.04 + time * 1.8) * 6 * amp +
          Math.sin((x - z) * 0.1 + time * 1.2) * 3 * amp +
          Math.sin(bd - beat * 15) * beat * 40 +
          beat * 35 * Math.exp(-bd * 0.5) +
          (p.turbulenceStrength > 0 ? Math.sin(x * 0.05 + time * 3) * Math.cos(z * 0.05 - time * 2.5) * p.turbulenceStrength * 15 : 0) +
          Math.sin(d * 0.08 - time * 4) * boost * 20
        mp[i] += velocities[i] * drift
        mp[i + 2] += velocities[i + 2] * drift
      }
      mainGeometry.attributes.position.needsUpdate = true
      const mm = mainWave.material as THREE.PointsMaterial
      mm.color.setHex(p.mainColor)
      mm.opacity = p.mainOpacity + pulse * 0.2
      mm.size = p.mainParticleSize + pulse * 1.5
      mainWave.rotation.y += dt * p.rotationSpeed

      // Accent wave
      const ap = accentGeometry.attributes.position.array as Float32Array
      for (let i = 0; i < ap.length; i += 3) {
        const x = ap[i]
        const z = ap[i + 2]
        const d = Math.sqrt(x * x + z * z)
        ap[i + 1] =
          Math.sin(x * 0.1 - time * 1.8) * 8 * p.waveAmplitude +
          Math.cos(z * 0.1 + time * 2) * 8 * p.waveAmplitude +
          Math.cos(d * 0.05 + time * 2.8) * 12 * p.waveAmplitude +
          Math.cos(d * 0.015 + beat * 12) * beat * 45
      }
      accentGeometry.attributes.position.needsUpdate = true
      const am = accentWave.material as THREE.PointsMaterial
      am.color.setHex(p.accentColor)
      am.opacity = p.accentOpacity + pulse * 0.3
      am.size = p.accentParticleSize + pulse * 2
      accentWave.rotation.y -= dt * p.rotationSpeed * 1.5

      // Stars
      const sp = starGeometry.attributes.position.array as Float32Array
      for (let i = 0; i < sp.length; i += 3) {
        sp[i + 1] = (sp[i + 1] % 400) + Math.sin(time * 0.5 + i * 0.01) * 2 + Math.sin(sp[i] * 0.02 + sp[i + 2] * 0.02 + time) * 3 - 50
      }
      starGeometry.attributes.position.needsUpdate = true
      const sm = starLayer.material as THREE.PointsMaterial
      sm.color.setHex(p.starColor)
      sm.opacity = p.starOpacity + Math.sin(time * 0.8) * 0.2 + pulse * 0.3
      sm.size = p.starParticleSize

      if (playingRef.current) {
        camera.position.x = Math.sin(time * p.cameraSpeed) * p.cameraRadius * 0.3
        camera.position.z = Math.cos(time * p.cameraSpeed) * p.cameraRadius
        camera.position.y = 100 + Math.sin(time * 0.3) * 30 + beat * 20
        camera.lookAt(Math.sin(time * p.cameraSpeed + 0.5) * 20, 0, Math.cos(time * p.cameraSpeed + 0.5) * 20)
      }

      renderer.render(scene, camera)
    }

    const start = () => {
      if (raf) return
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
    const onVisibility = () => (document.hidden ? stop() : start())
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    if (!document.hidden) start()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('resize', onResize)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', onResize)
      stopInteractionTracking()
      layers.forEach((l) => {
        l.geometry.dispose()
        const mat = l.material as THREE.PointsMaterial
        mat.map?.dispose()
        mat.dispose()
        scene.remove(l)
      })
      renderer.domElement.remove()
      renderer.dispose()
    }
  }, [reduced])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none particle-bg"
      style={{ viewTransitionName: 'particle-bg' }}
      aria-hidden="true"
    />
  )
}

export default ParticleBackground
