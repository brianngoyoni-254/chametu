// src/App.jsx
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import LiveChat from './home/LiveChat'
import InstallPWA from './components/InstallPWA' // ADDED: PWA install prompt

export default function App() {
  const location = useLocation()

  // Hide the floating LiveChat widget on the entire superadmin area
  // (login page + all protected superadmin routes) — it's a developer-only portal.
  const isSuperAdminArea = location.pathname.startsWith('/superadmin')

  // ADDED (SEO): scroll to #hash targets (e.g. /#features, /rewards/how-it-works#plans).
  // React Router doesn't do this on its own, and on a fresh load the element
  // may not exist yet, so retry briefly until it appears.
  useEffect(() => {
    if (!location.hash) return
    const id = decodeURIComponent(location.hash.slice(1))
    let tries = 0
    const timer = setInterval(() => {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        clearInterval(timer)
      } else if (++tries > 25) {
        clearInterval(timer)
      }
    }, 100)
    return () => clearInterval(timer)
  }, [location.pathname, location.hash])

  return (
    <>
      <AppRoutes />
      {!isSuperAdminArea && <LiveChat />}
      {!isSuperAdminArea && <InstallPWA />} {/* ADDED: Don't show install prompt in superadmin */}
    </>
  )
}