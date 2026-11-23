import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

import { AuthProvider } from './context/AuthContext'
import { TrialProvider } from './context/TrialContext'
import { TierProvider } from './context/TierContext'
import { ChamaProvider } from './context/ChamaContext'
import { PointsProvider } from './context/PointsContext' // <-- ADD THIS IMPORT

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TrialProvider>
          <TierProvider>
            <ChamaProvider>
              <PointsProvider> {/* <-- ADD THIS WRAPPER */}
                <App />
              </PointsProvider>
            </ChamaProvider>
          </TierProvider>
        </TrialProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)