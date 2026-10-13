import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { setMemberSession, getChama } from '../lib/chametuStorage'

export default function DemoMemberEntry() {
  const navigate = useNavigate()

  useEffect(() => {
    let chama = null
    try {
      chama = getChama()
    } catch {}

    const session = {
      id: 'demo_member',
      name: 'Mary Achieng',
      email: 'mary@chametu.co.ke',
      role: 'Member',
      chamaCode: chama?.code || 'CHM-8F3K2P',
      joinedAt: Date.now(),
    }

    try {
      setMemberSession(session)
    } catch (e) {
      console.error('Could not set member session', e)
    }

    navigate('/member', { replace: true })
  }, [navigate])

  return (
    <div className="grid min-h-screen place-items-center text-sm text-ink-soft">
      Preparing member preview…
    </div>
  )
}