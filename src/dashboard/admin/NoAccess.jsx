import { Link, useLocation } from 'react-router-dom'
import { Lock, ArrowLeft } from 'lucide-react'
import { useChama } from '../../context/ChamaContext'
import { PERMISSIONS } from '../../lib/permissions'

export default function NoAccess() {
  const { currentMember } = useChama()
  const location = useLocation()
  const needed = location.state?.needed
  const perm = PERMISSIONS.find((p) => p.key === needed)

  return (
    <div className="max-w-[560px] mx-auto mt-16 text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-gold/15 text-[#8A6112] grid place-items-center mb-4">
        <Lock size={22} strokeWidth={2} />
      </div>
      <h1 className="font-display font-bold text-2xl text-navy">You don&rsquo;t have access</h1>
      <p className="mt-2 text-ink-soft">
        Your role (<b className="text-navy">{currentMember?.role || 'Unknown'}</b>) does not include
        {perm ? <> <b className="text-navy">{perm.label.toLowerCase()}</b></> : ' this permission'}.
        Ask your chairman or treasurer to grant you access.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-sm font-semibold hover:bg-forest-dark transition"
      >
        <ArrowLeft size={15} strokeWidth={2} />
        Back to dashboard
      </Link>
    </div>
  )
}