/**
 * Interaction Activity Tracker
 * Tracks mouse movement and touch interactions to drive particle animation intensity
 */

interface InteractionState {
  lastX: number
  lastY: number
  lastTime: number
  velocity: number
  intensity: number
  isTracking: boolean
}

const state: InteractionState = {
  lastX: 0,
  lastY: 0,
  lastTime: 0,
  velocity: 0,
  intensity: 0,
  isTracking: false
}

// Configuration
const CONFIG = {
  // Velocity calculation
  velocityDecay: 0.95, // How fast velocity decays per frame
  maxVelocity: 100, // Maximum tracked velocity (pixels per frame)

  // Intensity mapping
  velocityToIntensity: 0.5, // Multiplier: velocity → intensity (0-100)
  minIntensity: 0, // Minimum intensity (idle state)
  maxIntensity: 100, // Maximum intensity
  intensityDecay: 0.92, // How fast intensity decays without interaction

  // Smoothing (UPDATED for softer transitions)
  smoothingFactor: 0.08, // 0-1: Much lower = much smoother (was 0.15)
  easingPower: 3.0, // Higher easing power for gentler curves (was 2.0)

  // Throttling
  updateInterval: 16, // ~60fps (16ms)

  // Touch sensitivity (REDUCED for softer feel)
  touchMultiplier: 1.2, // Reduced from 1.5
  scrollMultiplier: 0.8 // Much lower for gentle scroll effect (was 2.0)
}

let updateTimerId: number | null = null
let lastUpdateTime = 0
let onIntensityChangeCallback: ((intensity: number) => void) | null = null

/**
 * Calculate velocity from mouse/touch movement
 */
function calculateVelocity(currentX: number, currentY: number, currentTime: number): number {
  if (state.lastTime === 0) {
    state.lastX = currentX
    state.lastY = currentY
    state.lastTime = currentTime
    return 0
  }

  const deltaTime = currentTime - state.lastTime
  if (deltaTime === 0) return state.velocity

  const deltaX = currentX - state.lastX
  const deltaY = currentY - state.lastY
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

  // Velocity = pixels per millisecond * 16 (normalize to per-frame)
  const velocity = (distance / deltaTime) * 16

  state.lastX = currentX
  state.lastY = currentY
  state.lastTime = currentTime

  return Math.min(velocity, CONFIG.maxVelocity)
}

/**
 * Update intensity based on current velocity with smooth transitions
 */
function updateIntensity(): void {
  const now = performance.now()
  const deltaTime = now - lastUpdateTime

  if (deltaTime < CONFIG.updateInterval) return
  lastUpdateTime = now

  // Apply velocity decay
  state.velocity *= CONFIG.velocityDecay

  // Convert velocity to target intensity
  const targetIntensity = Math.min(
    state.velocity * CONFIG.velocityToIntensity,
    CONFIG.maxIntensity
  )

  // Smooth exponential interpolation with gentle transitions
  const delta = targetIntensity - state.intensity

  if (Math.abs(delta) > 0.1) {
    // Use smoothing factor for gradual changes
    const easedDelta = delta * CONFIG.smoothingFactor

    // Apply easing curve for smoother feel - SAME smoothness for both directions
    if (delta > 0) {
      // Rising: Very smooth ramp-up (same as falling)
      state.intensity += easedDelta * 0.3
    } else {
      // Falling: Very smooth decay
      state.intensity += easedDelta * 0.3
    }
  } else {
    // When close to target, apply decay
    state.intensity *= CONFIG.intensityDecay
  }

  // Clamp intensity
  state.intensity = Math.max(
    CONFIG.minIntensity,
    Math.min(CONFIG.maxIntensity, state.intensity)
  )

  // Notify callback (always notify for smooth updates)
  if (onIntensityChangeCallback) {
    onIntensityChangeCallback(state.intensity)
  }
}

/**
 * Start continuous intensity update loop
 */
function startUpdateLoop(): void {
  if (updateTimerId !== null) return

  function update(): void {
    updateIntensity()
    updateTimerId = requestAnimationFrame(update)
  }

  lastUpdateTime = performance.now()
  update()
}

/**
 * Stop continuous update loop
 */
function stopUpdateLoop(): void {
  if (updateTimerId !== null) {
    cancelAnimationFrame(updateTimerId)
    updateTimerId = null
  }
}

/**
 * Handle mouse movement
 */
function handleMouseMove(event: MouseEvent): void {
  const velocity = calculateVelocity(event.clientX, event.clientY, performance.now())
  state.velocity = Math.max(state.velocity, velocity)
}

/**
 * Handle touch movement
 */
function handleTouchMove(event: TouchEvent): void {
  if (event.touches.length === 0) return

  const touch = event.touches[0]
  const velocity = calculateVelocity(touch.clientX, touch.clientY, performance.now())

  // Touch gestures feel more impactful
  state.velocity = Math.max(state.velocity, velocity * CONFIG.touchMultiplier)
}

/**
 * Handle touch start (tap)
 */
function handleTouchStart(event: TouchEvent): void {
  if (event.touches.length === 0) return

  const touch = event.touches[0]

  // Reset tracking position
  state.lastX = touch.clientX
  state.lastY = touch.clientY
  state.lastTime = performance.now()

  // Instant intensity boost on tap
  state.intensity = Math.min(state.intensity + 20, CONFIG.maxIntensity)
}

/**
 * Handle scroll events
 */
function handleScroll(): void {
  // Scroll has highest impact
  const scrollBoost = 30 * CONFIG.scrollMultiplier
  state.velocity = Math.max(state.velocity, scrollBoost)
  state.intensity = Math.min(state.intensity + scrollBoost, CONFIG.maxIntensity)
}

/**
 * Start tracking user interactions
 */
export function startInteractionTracking(
  onIntensityChange: (intensity: number) => void
): void {
  if (state.isTracking) return

  onIntensityChangeCallback = onIntensityChange

  // Desktop: Mouse movement
  window.addEventListener('mousemove', handleMouseMove, { passive: true })

  // Mobile: Touch gestures
  window.addEventListener('touchmove', handleTouchMove, { passive: true })
  window.addEventListener('touchstart', handleTouchStart, { passive: true })

  // Both: Scroll
  window.addEventListener('scroll', handleScroll, { passive: true })

  // Start continuous update loop
  startUpdateLoop()

  state.isTracking = true
  console.log('🖱️ Interaction tracking started')
}

/**
 * Stop tracking user interactions
 */
export function stopInteractionTracking(): void {
  if (!state.isTracking) return

  // Remove event listeners
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('touchmove', handleTouchMove)
  window.removeEventListener('touchstart', handleTouchStart)
  window.removeEventListener('scroll', handleScroll)

  // Stop update loop
  stopUpdateLoop()

  // Reset state
  state.velocity = 0
  state.intensity = 0
  state.lastTime = 0
  state.isTracking = false
  onIntensityChangeCallback = null

  console.log('🖱️ Interaction tracking stopped')
}

/**
 * Get current interaction intensity (0-100)
 */
export function getInteractionIntensity(): number {
  return state.intensity
}

/**
 * Check if tracking is active
 */
export function isTrackingActive(): boolean {
  return state.isTracking
}
