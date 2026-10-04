import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { installViewTransitionGate } from './motion/viewTransitionGate'

// Must run before the router issues its first view transition
installViewTransitionGate()

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
