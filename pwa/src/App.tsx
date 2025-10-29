import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProviders } from '@/contexts'
import { Modal, Toast, ActionBar, Sidebar, BeatBackground } from '@/components'
import {
  LandingPage,
  ModeSelection,
  VariantSelection,
  PlayerSetup,
  GameScreen,
  CallbackScreen
} from '@/screens'
import './styles/tailwind.css'
import './styles/beatAnimations.css'

function AppContent() {
  return (
    <>
      {/* Beat-synchronized Background */}
      <BeatBackground />

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
