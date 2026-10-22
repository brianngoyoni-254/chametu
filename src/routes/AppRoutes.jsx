import { Routes, Route, Navigate } from 'react-router-dom'

import Home from '../home/Home'
import Login from '../auth/Login'
import Register from '../auth/Register'
import ForgotPassword from '../auth/ForgotPassword'
import ResetPassword from '../auth/ResetPassword'
import Payment from '../auth/Payment'
import HowRewardsWork from '../home/HowRewardsWork'
import MemberJoin from '../auth/MemberJoin'
import Privacy from '../home/Privacy'
import Terms from '../home/Terms'
import Contact from '../home/Contact'

import ProtectedRoute from './ProtectedRoute'
import DashboardLayout from '../dashboard/DashboardLayout'

import Rewards from '../rewards/Rewards'
import Points from '../rewards/Points'
import TierComparison from '../rewards/TierComparison'

import Overview from '../dashboard/admin/Overview'
import InviteMembers from '../dashboard/admin/InviteMembers'
import MyChama from '../dashboard/admin/MyChama'
import Support from '../dashboard/admin/Support'
import Settings from '../dashboard/admin/Settings'

import Payments from '../dashboard/admin/Payments'
import Transactions from '../dashboard/admin/Transactions'
import Contributions from '../dashboard/admin/Contributions'
import Savings from '../dashboard/admin/Savings'
import Loans from '../dashboard/admin/Loans'
import Welfare from '../dashboard/admin/Welfare'

import Portfolio from '../dashboard/admin/Portfolio'
import Assets from '../dashboard/admin/Assets'

import Payouts from '../dashboard/admin/Payouts'
import Meetings from '../dashboard/admin/Meetings'
import Voting from '../dashboard/admin/Voting'

import Members from '../dashboard/admin/Members'
import Statements from '../dashboard/admin/Statements'
import Reports from '../dashboard/admin/Reports'

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
import MemberSupport from '../member/MemberSupport'
import DemoMemberEntry from '../member/DemoMemberEntry'

import SuperAdminLayout from '../superadmin/SuperAdminLayout'
import SuperAdminOverview from '../superadmin/SuperAdminOverview'
import SuperAdminBilling from '../superadmin/SuperAdminBilling'
import SuperAdminChamas from '../superadmin/SuperAdminChamas'
import SuperAdminPayments from '../superadmin/SuperAdminPayments'
import SuperAdminSupport from '../superadmin/SuperAdminSupport'
import SuperAdminAudit from '../superadmin/SuperAdminAudit'
import SuperAdminSettings from '../superadmin/SuperAdminSettings'
import SuperAdminLogin from '../superadmin/SuperAdminLogin'
import RequireSuperAdmin from './RequireSuperAdmin'

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
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/contact" element={<Contact />} />
      
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
          <Route path="/dashboard/support" element={<Support />} />
          <Route path="/dashboard/settings" element={<Settings />} />

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

      {/* Member portal — protected */}
      <Route element={<ProtectedRoute />}>
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
          <Route path="support" element={<MemberSupport />} />
          <Route path="profile" element={<MemberProfile />} />
        </Route>
      </Route>

      {/* Super Admin — developer portal */}
      <Route path="/superadmin/login" element={<SuperAdminLogin />} />
      <Route element={<RequireSuperAdmin />}>
        <Route path="/superadmin" element={<SuperAdminLayout />}>
          <Route index element={<SuperAdminOverview />} />
          <Route path="chamas" element={<SuperAdminChamas />} />
          <Route path="billing" element={<SuperAdminBilling />} />
          <Route path="payments" element={<SuperAdminPayments />} />
          <Route path="support" element={<SuperAdminSupport />} />
          <Route path="audit" element={<SuperAdminAudit />} />
          <Route path="settings" element={<SuperAdminSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}