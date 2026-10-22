import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import { ChamaProvider } from './context/ChamaContext'
import { TierProvider } from './context/TierContext'
import { PointsProvider } from './context/PointsContext'
import AppRoutes from './routes/AppRoutes'
import LiveChat from './home/LiveChat'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChamaProvider>
          <TierProvider>
            <PointsProvider>
              <AppRoutes />
              <LiveChat />
              <Toaster
                position="bottom-center"
                richColors
                closeButton
                toastOptions={{
                  style: {
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: '0.86rem',
                    borderRadius: '12px',
                  },
                }}
              />
            </PointsProvider>
          </TierProvider>
        </ChamaProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}