import { Routes, Route, Navigate } from 'react-router-dom'

import Home from '../home/Home'
import Login from '../auth/Login'
import Register from '../auth/Register'
import ForgotPassword from '../auth/ForgotPassword'
import HowRewardsWork from '../home/HowRewardsWork'

import ProtectedRoute from './ProtectedRoute'
import DashboardLayout from '../dashboard/DashboardLayout'

import Rewards from '../rewards/Rewards'
import Points from '../rewards/Points'
import TierComparison from '../rewards/TierComparison'

import Members from '../dashboard/admin/Members'
import Statements from '../dashboard/admin/Statements'
import Reports from '../dashboard/admin/Reports'
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

const Soon = ({ title }) => (
  <div className="max-w-[1180px] mx-auto">
    <h1 className="font-display font-bold text-2xl text-navy">{title}</h1>
    <p className="mt-2 text-ink-soft">Coming soon.</p>
  </div>
)

export default function AppRoutes() {
  return (
    <Routes>

      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/rewards/how-it-works" element={<HowRewardsWork />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Soon title="Dashboard" />} />
          <Route path="/dashboard/invite" element={<Soon title="Invite Members" />} />
          <Route path="/dashboard/chama" element={<Soon title="My Chama" />} />
          {/* <Route path="/dashboard/payments" element={<Soon title="Payments Tracker" />} /> */}
          {/* <Route path="/dashboard/transactions" element={<Soon title="Transactions" />} />
          <Route path="/dashboard/contributions" element={<Soon title="Contributions" />} />
          <Route path="/dashboard/savings" element={<Soon title="Savings" />} />
          <Route path="/dashboard/loans" element={<Soon title="Loans" />} />
          <Route path="/dashboard/welfare" element={<Soon title="Welfare" />} />
          <Route path="/dashboard/portfolio" element={<Soon title="Portfolio" />} />
          <Route path="/dashboard/assets" element={<Soon title="Assets" />} />
          <Route path="/dashboard/payouts" element={<Soon title="Payout Rotation" />} />
          <Route path="/dashboard/meetings" element={<Soon title="Meetings" />} />
          <Route path="/dashboard/voting" element={<Soon title="Voting" />} /> */}

          <Route path="/dashboard/members" element={<Members />} />


          {/* Finance */}
          <Route path="/dashboard/payments" element={<Payments />} />
          <Route path="/dashboard/transactions" element={<Transactions />} />
          <Route path="/dashboard/contributions" element={<Contributions />} />
          <Route path="/dashboard/savings" element={<Savings />} />
          <Route path="/dashboard/loans" element={<Loans />} />
          <Route path="/dashboard/welfare" element={<Welfare />} />

          {/* Investments */}
          <Route path="/dashboard/portfolio" element={<Portfolio />} />
          <Route path="/dashboard/assets" element={<Assets />} />

          {/* Governance */}
          <Route path="/dashboard/payouts" element={<Payouts />} />
          <Route path="/dashboard/meetings" element={<Meetings />} />
          <Route path="/dashboard/voting" element={<Voting />} />

          <Route path="/dashboard/members" element={<Soon title="Members" />} />
          <Route path="/dashboard/roles" element={<Soon title="Roles & Permissions" />} />
          <Route path="/dashboard/statements" element={<Statements />} />
          <Route path="/dashboard/reports" element={<Reports />} />

      
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/rewards/points" element={<Points />} />
          <Route path="/rewards/plans" element={<TierComparison />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}