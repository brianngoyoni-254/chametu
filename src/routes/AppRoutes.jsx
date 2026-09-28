import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

// Public
import Home from '../home/Home'

// Auth
import Login from '../auth/Login'
import Register from '../auth/Register'
import ForgotPassword from '../auth/ForgotPassword'

// Dashboard shell
import DashboardLayout from '../dashboard/DashboardLayout'

// Dashboard / admin pages
import Overview from '../dashboard/admin/Overview'
import MyChama from '../dashboard/admin/MyChama'
import Transactions from '../dashboard/admin/Transactions'
import Contributions from '../dashboard/admin/Contributions'
import Savings from '../dashboard/admin/Savings'
import Loans from '../dashboard/admin/Loans'
import Welfare from '../dashboard/admin/Welfare'
import Portfolio from '../dashboard/admin/Portfolio'
import Assets from '../dashboard/admin/Assets'
import Meetings from '../dashboard/admin/Meetings'
import Voting from '../dashboard/admin/Voting'
import Members from '../dashboard/admin/Members'
import RolesPermissions from '../dashboard/admin/RolesPermissions'
import Reports from '../dashboard/admin/Reports'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Dashboard: admin */}
      <Route
        path="/dashboard/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="my-chama" element={<MyChama />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="contributions" element={<Contributions />} />
        <Route path="savings" element={<Savings />} />
        <Route path="loans" element={<Loans />} />
        <Route path="welfare" element={<Welfare />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="assets" element={<Assets />} />
        <Route path="meetings" element={<Meetings />} />
        <Route path="voting" element={<Voting />} />
        <Route path="members" element={<Members />} />
        <Route path="roles" element={<RolesPermissions />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* /dashboard alone goes to the admin dashboard for now */}
      <Route path="/dashboard" element={<Navigate to="/dashboard/admin" replace />} />

      {/* Anything else goes home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}