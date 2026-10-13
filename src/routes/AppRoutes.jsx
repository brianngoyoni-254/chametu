import { Routes, Route, Navigate } from 'react-router-dom'

import Home from '../home/Home'
import Login from '../auth/Login'
import Register from '../auth/Register'
import ForgotPassword from '../auth/ForgotPassword'
import ResetPassword from '../auth/ResetPassword'
import Payment from '../auth/Payment'
import HowRewardsWork from '../home/HowRewardsWork'
import MemberJoin from '../auth/MemberJoin'

import ProtectedRoute from './ProtectedRoute'
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
import Statements from '../dashboard/admin/Statements'
import Reports from '../dashboard/admin/Reports'

// Member account
import MemberLayout from '../member/MemberLayout'
import MemberOverview from '../member/MemberOverview'
import MemberLoans from '../member/MemberLoans'
import MemberContributions from '../member/MemberContributions'
import MemberSavings from '../member/MemberSavings'
import MemberWelfare from '../member/MemberWelfare'
import MemberTransactions from '../member/MemberTransactions'
import MemberProfile from '../member/MemberProfile'
import MemberAssets from '../member/MemberAssets'
import MemberMeetings from '../member/MemberMeetings'
import MemberRotation from '../member/MemberRotation'
import MemberVoting from '../member/MemberVoting'
import DemoMemberEntry from '../member/DemoMemberEntry'

const Soon = ({ title }) => (
  <div className="mx-auto max-w-[1180px]">
    <h1 className="font-display text-2xl font-bold text-navy">{title}</h1>
    <p className="mt-2 text-ink-soft">Coming soon.</p>
  </div>
)

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/payment" element={<Payment />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/rewards/how-it-works" element={<HowRewardsWork />} />

      {/* Member invite link */}
      <Route path="/join/:chamaCode/:token" element={<MemberJoin />} />

      {/* Local preview */}
      <Route path="/demo/member" element={<DemoMemberEntry />} />

      {/* Admin — protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Overview />} />
          <Route path="/dashboard/invite" element={<InviteMembers />} />
          <Route path="/dashboard/chama" element={<MyChama />} />

          <Route path="/dashboard/payments" element={<Payments />} />
          <Route path="/dashboard/transactions" element={<Transactions />} />
          <Route path="/dashboard/contributions" element={<Contributions />} />
          <Route path="/dashboard/savings" element={<Savings />} />
          <Route path="/dashboard/loans" element={<Loans />} />
          <Route path="/dashboard/welfare" element={<Welfare />} />

          <Route path="/dashboard/portfolio" element={<Portfolio />} />
          <Route path="/dashboard/assets" element={<Assets />} />

          <Route path="/dashboard/payouts" element={<Payouts />} />
          <Route path="/dashboard/meetings" element={<Meetings />} />
          <Route path="/dashboard/voting" element={<Voting />} />

          <Route path="/dashboard/members" element={<Members />} />
          <Route path="/dashboard/roles" element={<Soon title="Roles & Permissions" />} />
          <Route path="/dashboard/statements" element={<Statements />} />
          <Route path="/dashboard/reports" element={<Reports />} />

          <Route path="/rewards" element={<Rewards />} />
          <Route path="/rewards/points" element={<Points />} />
          <Route path="/rewards/plans" element={<TierComparison />} />
        </Route>
      </Route>

      {/* Member portal */}
      <Route path="/member" element={<MemberLayout />}>
        <Route index element={<MemberOverview />} />
        <Route path="contributions" element={<MemberContributions />} />
        <Route path="savings" element={<MemberSavings />} />
        <Route path="loans" element={<MemberLoans />} />
        <Route path="transactions" element={<MemberTransactions />} />
        <Route path="assets" element={<MemberAssets />} />
        <Route path="meetings" element={<MemberMeetings />} />
        <Route path="rotation" element={<MemberRotation />} />
        <Route path="voting" element={<MemberVoting />} />
        <Route path="welfare" element={<MemberWelfare />} />
        <Route path="profile" element={<MemberProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}