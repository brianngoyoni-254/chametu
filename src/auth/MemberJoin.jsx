import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  User, Mail, Lock, ArrowLeft, ArrowRight,
  Eye, EyeOff, BadgeCheck, AlertCircle, Loader2, XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import logo from '../assets/logos.png'
import { api } from '../lib/api'

export default function MemberJoin() {
  const { chamaCode, token } = useParams()
  const navigate = useNavigate()
  
  const [invite, setInvite] = useState(null)
  const [chama, setChama] = useState(null)
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState({ ok: false })
  
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    async function verify() {
      try {
        // Updated to match the new auth.py route
        const res = await api(`/api/auth/invites/${chamaCode}/${token}`)
        setInvite(res.invite)
        setChama(res.chama)
        setContact(res.invite.contact || '')
        setResult({ ok: true })
      } catch (err) {
        setResult({ ok: false, reason: err.message })
      } finally {
        setLoading(false)
      }
    }
    verify()
  }, [chamaCode, token])

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper">
        <Loader2 className="animate-spin text-forest" size={28} />
      </div>
    )
  }

  if (!result.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F8FA] p-6">
        <div className="w-full max-w-sm rounded-3xl border border-line bg-white p-8 text-center shadow-sm">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
            <XCircle size={24} strokeWidth={2} />
          </span>
          <h1 className="mt-4 font-display text-xl font-bold text-navy">Invite not valid</h1>
          <p className="mt-2 text-[0.88rem] leading-relaxed text-ink-soft">
            {result.reason || 'This invite link is not valid.'}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link to="/login" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-forest to-emerald py-3 text-sm font-semibold text-white shadow-sm">
              Go to login <ArrowRight size={14} />
            </Link>
            <Link to="/" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-white py-3 text-sm font-semibold text-navy">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  async function submitCreate(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Enter your full name.')
    if (!password || password.length < 6) return setError('Choose a password with at least 6 characters.')

    setBusy(true)
    try {
      // Direct API call replaces useMemberAuth
      const data = await api('/api/auth/accept-invite', {
        method: 'POST',
        body: {
          email: contact.trim().toLowerCase(),
          name: name.trim(),
          password,
          chamaCode,
          role: invite.role || 'Member',
        }
      })
      
      // Save token and user to storage
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))
      if (data.chama) {
        localStorage.setItem('chama_data', JSON.stringify(data.chama))
      }
      
      // Notify the app that auth changed so contexts refresh
      window.dispatchEvent(new Event('auth-changed'))

      toast.success(`Welcome to ${chama.name}, ${name.split(' ')[0]}!`)
      navigate(data.user.portal === 'member' ? '/member' : '/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#F6F8FA] lg:grid-cols-[1fr_1.05fr]">
      <aside className="relative hidden flex-col overflow-hidden bg-navy p-10 text-white lg:flex lg:p-14">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(700px 500px at 0% 0%, rgba(16,185,129,0.32), transparent 60%), radial-gradient(600px 500px at 100% 100%, rgba(245,185,66,0.14), transparent 60%), linear-gradient(160deg, #0B1F33 0%, #0A2A3E 55%, #08222A 100%)' }} />
        <Link to="/" className="relative flex items-center gap-3 text-white no-underline">
          <img src={logo} alt="Chametu" className="relative h-10 w-10 rounded-xl object-contain ring-1 ring-white/20" />
          <div>
            <div className="font-display text-lg font-bold leading-none tracking-tight">Chametu</div>
            <div className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-emerald/80">Chama Management</div>
          </div>
        </Link>
        <div className="relative mt-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald/30 bg-emerald/10 px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-emerald backdrop-blur">
            <BadgeCheck size={12} /> Verified invite
          </div>
          <h1 className="mt-6 max-w-[520px] font-display text-[2.4rem] font-bold leading-[1.08] tracking-tight">
            You're invited to join <span className="bg-gradient-to-r from-emerald to-[#7CF0C0] bg-clip-text text-transparent">{chama.name}</span>
          </h1>
        </div>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[440px]">
          <div className="mb-8 flex items-center justify-between">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-forest hover:underline">
              <ArrowLeft size={13} strokeWidth={2.2} /> Back to login
            </Link>
          </div>

          <h1 className="font-display text-[1.9rem] font-bold leading-tight tracking-tight text-navy">Create your account</h1>
          <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-soft">
            You're joining {chama.name} as {invite.role}.
          </p>

          <form onSubmit={submitCreate} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-[0.78rem] font-semibold text-navy">Full name</label>
              <div className="group flex items-center gap-3 rounded-2xl border-[1.5px] border-line bg-white px-4 transition focus-within:border-forest">
                <User size={16} className="shrink-0 text-ink-soft group-focus-within:text-forest" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jane Wambui"
                  className="min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.9rem] text-navy outline-none placeholder:text-ink-soft/60"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[0.78rem] font-semibold text-navy">Email</label>
              <div className="group flex items-center gap-3 rounded-2xl border-[1.5px] border-line bg-[#F8FAFC] px-4 transition">
                <Mail size={16} className="shrink-0 text-ink-soft" />
                <input value={contact} disabled className="min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.9rem] text-ink-soft outline-none" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[0.78rem] font-semibold text-navy">Create a password</label>
              <div className="group flex items-center gap-3 rounded-2xl border-[1.5px] border-line bg-white px-4 transition focus-within:border-forest">
                <Lock size={16} className="shrink-0 text-ink-soft group-focus-within:text-forest" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.9rem] text-navy outline-none placeholder:text-ink-soft/60"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="p-1 text-ink-soft hover:text-navy">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 px-3.5 py-3 text-[0.82rem] text-red-700">
                <AlertCircle size={14} className="mt-0.5 flex-none" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-forest to-emerald py-3.5 font-display text-[0.95rem] font-bold text-white shadow-[0_10px_24px_rgba(11,122,90,0.24)] transition hover:-translate-y-0.5 disabled:opacity-55"
            >
              {busy ? 'Creating your account…' : 'Create my account'}
              {!busy && <ArrowRight size={15} />}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}