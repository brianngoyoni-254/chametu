import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { TierProvider } from './context/TierContext'
import { PointsProvider } from './context/PointsContext'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TierProvider>
          <PointsProvider>
            <AppRoutes />
          </PointsProvider>
        </TierProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
