// src/App.jsx
import { useLocation } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import LiveChat from './home/LiveChat'

export default function App() {
  const location = useLocation()

  // Hide the floating LiveChat widget on the entire superadmin area
  // (login page + all protected superadmin routes) — it's a developer-only portal.
  const isSuperAdminArea = location.pathname.startsWith('/superadmin')

  return (
    <>
      <AppRoutes />
      {!isSuperAdminArea && <LiveChat />}
    </>
  )
}