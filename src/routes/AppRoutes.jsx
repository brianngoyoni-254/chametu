import { Routes, Route, Navigate } from 'react-router-dom'

import Home from '../home/Home'
import Login from '../auth/Login'
import Register from '../auth/Register'
import ForgotPassword from '../auth/ForgotPassword'
import ResetPassword from '../auth/ResetPassword'
import Payment from '../auth/Payment'
import HowRewardsWork from '../home/HowRewardsWork'

import ProtectedRoute from './ProtectedRoute'
import RequirePermission from './RequirePermission'
import RequireTier from './RequireTier'
import DashboardLayout from '../dashboard/DashboardLayout'

import Rewards from '../rewards/Rewards'
import Points from '../rewards/Points'
import TierComparison from '../rewards/TierComparison'

// Main
import Overview from '../dashboard/admin/Overview'
import InviteMembers from '../dashboard/admin/InviteMembers'
import MyChama from '../dashboard/admin/MyChama'

// Finance
import Payments from '../dashboard/admin/Payments'
import Transactions from '../dashboard/admin/Transactions'
import Contributions from '../dashboard/admin/Contributions'
import Savings from '../dashboard/admin/Savings'
import Loans from '../dashboard/admin/Loans'
import Welfare from '../dashboard/admin/Welfare'

// Investments
import Portfolio from '../dashboard/admin/Portfolio'
import Assets from '../dashboard/admin/Assets'

// Governance
import Payouts from '../dashboard/admin/Payouts'
import Meetings from '../dashboard/admin/Meetings'
import Voting from '../dashboard/admin/Voting'

// People & Reports
import Members from '../dashboard/admin/Members'
import RolesPermissions from '../dashboard/admin/RolesPermissions'
import Statements from '../dashboard/admin/Statements'
import Reports from '../dashboard/admin/Reports'

// Utility
import NoAccess from '../dashboard/admin/NoAccess'
import Upgrade from '../dashboard/admin/Upgrade'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/payment" element={<Payment />} />
      <Route path="/rewards/how-it-works" element={<HowRewardsWork />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Utility pages (outside guards so they can render regardless) */}
          <Route path="/dashboard/no-access" element={<NoAccess />} />
          <Route path="/dashboard/upgrade" element={<Upgrade />} />

          {/* Main — open to any authenticated member */}
          <Route path="/dashboard" element={<Overview />} />
          <Route path="/dashboard/chama" element={<MyChama />} />

          {/* Permission-gated area */}
          <Route element={<RequirePermission />}>
            <Route path="/dashboard/invite" element={<InviteMembers />} />

            {/* Finance — no tier requirement */}
            <Route path="/dashboard/payments" element={<Payments />} />
            <Route path="/dashboard/transactions" element={<Transactions />} />
            <Route path="/dashboard/contributions" element={<Contributions />} />
            <Route path="/dashboard/savings" element={<Savings />} />
            <Route path="/dashboard/loans" element={<Loans />} />
            <Route path="/dashboard/welfare" element={<Welfare />} />

            {/* People */}
            <Route path="/dashboard/members" element={<Members />} />

            {/* Tier-gated group — must also pass RequireTier */}
            <Route element={<RequireTier />}>
              <Route path="/dashboard/portfolio" element={<Portfolio />} />
              <Route path="/dashboard/assets" element={<Assets />} />
              <Route path="/dashboard/statements" element={<Statements />} />
              <Route path="/dashboard/reports" element={<Reports />} />

              <Route path="/dashboard/voting" element={<Voting />} />
              <Route path="/dashboard/payouts" element={<Payouts />} />
              <Route path="/dashboard/meetings" element={<Meetings />} />
              <Route path="/dashboard/roles" element={<RolesPermissions />} />
            </Route>
          </Route>

          {/* Rewards */}
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/rewards/points" element={<Points />} />
          <Route path="/rewards/plans" element={<TierComparison />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}