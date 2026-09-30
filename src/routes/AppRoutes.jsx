import { Routes, Route, Navigate } from 'react-router-dom'

// Public
import Home from '../home/Home'

// Auth
import Login from '../auth/Login'
import Register from '../auth/Register'
import ForgotPassword from '../auth/ForgotPassword'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Anything else goes home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}