import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProviders, useInteraction } from '@/contexts'
import { Modal, Toast, ActionBar, Sidebar } from '@/components'
import { ParticleBackground } from '@/components/game'
import {
  LandingPage,
  ModeSelection,
  VariantSelection,
  PlayerSetup,
  GameScreen,
  CallbackScreen
} from '@/screens'
import { useTokenRefresh } from '@/hooks/useTokenRefresh'
import './styles/tailwind.css'
import './styles/beatAnimations.css'

function AppContent() {
  // Background Token Refresh Service
  useTokenRefresh()

  // Get interaction state for background animation
  const { activityLevel, pulseIntensity } = useInteraction()

  return (
    <>
      {/* 3D Particle Background - Activity-reactive */}
      <ParticleBackground
        isPlaying={true}
        beatIntensity={pulseIntensity}
        activityLevel={activityLevel}
      />

      {/* Layout Components */}
      <ActionBar />
      <Sidebar />

      {/* Modal & Toast (rendered via Portal) */}
      <Modal />
      <Toast />

      {/* Main Content - Router */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/mode-selection" element={<ModeSelection />} />
        <Route path="/variant-selection" element={<VariantSelection />} />
        <Route path="/player-setup" element={<PlayerSetup />} />
        <Route path="/game" element={<GameScreen />} />
        <Route path="/callback" element={<CallbackScreen />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <AppContent />
      </AppProviders>
    </BrowserRouter>
  )
}

export default App
