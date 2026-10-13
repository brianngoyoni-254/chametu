import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { User, Mail, Lock, ShieldCheck, XCircle } from 'lucide-react'
import logo from '../assets/logos.png'
import { useAuth } from '../context/AuthContext'
import {
  findValidInvite,
  createMemberFromInvite,
  loginMember,
  findMemberByContact,
  setMemberSession,
} from '../lib/chametuStorage'

export default function MemberJoin() {
  const { chamaCode, token } = useParams()
  const navigate = useNavigate()
  const { register } = useAuth()
  const result = useMemo(() => findValidInvite(chamaCode, token), [chamaCode, token])

  const [mode, setMode] = useState('create')
  const [name, setName] = useState('')
  const [contact, setContact] = useState(result.ok ? result.invite.contact : '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (!result.ok) {
    const messages = {
      'wrong-chama': "This invite link doesn't match any chama on this device.",
      'not-found': 'This invite link is not valid.',
      used: 'This invite has already been used. Try logging in instead.',
      expired: 'This invite has expired. Ask your chama admin to resend it.',
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper p-6">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#FBEAE8] text-red-600">
            <XCircle size={22} />
          </span>
          <h1 className="mt-4 font-display text-lg font-bold text-navy">Invite not valid</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {messages[result.reason] || messages['not-found']}
          </p>
          {result.reason === 'used' && (
            <Link
              to="/login"
              className="mt-5 inline-block rounded-lg bg-forest px-4 py-2.5 text-sm font-semibold text-white"
            >
              Go to login
            </Link>
          )}
        </div>
      </div>
    )
  }

  const { invite, chama } = result

  async function submitCreate(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Enter your full name.')
    if (!contact.trim()) return setError('Enter your email or phone number.')
    if (!password || password.length < 4) {
      return setError('Choose a password with at least 4 characters.')
    }
    if (findMemberByContact(chama.code, contact.trim())) {
      return setError('An account already exists for this contact — try logging in instead.')
    }

    const member = createMemberFromInvite({
      invite,
      chama,
      name: name.trim(),
      contact: contact.trim(),
      password,
    })

    // Register in AuthContext so the main login works for this person too.
    try {
      await register({
        name: name.trim(),
        email: contact.trim().toLowerCase(),
        password,
        role: invite.role || 'Member',
        chamaCode: chama.code,
      })
    } catch (err) {
      console.warn('AuthContext register failed:', err)
    }

    // If they're a member, wire the member-portal session too
    if ((invite.role || 'Member').toLowerCase() === 'member') {
      if (!loginMember(chama.code, contact.trim(), password)) {
        setMemberSession(member)
      }
      navigate('/member', { replace: true })
      return
    }

    // Treasurer / Secretary / Chairman go to the admin dashboard
    navigate('/dashboard', { replace: true })
  }

  async function submitLogin(e) {
    e.preventDefault()
    setError('')
    if (!contact.trim() || !password) return setError('Enter your contact and password.')
    const member = loginMember(chama.code, contact.trim(), password)
    if (!member) return setError('No account found with those details for this chama.')
    navigate('/member', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={logo} alt="Chametu" className="h-10 w-10 rounded-lg object-contain" />
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-forest">
            <ShieldCheck size={13} /> VERIFIED INVITE
          </div>
          <h1 className="mt-2 font-display text-xl font-bold text-navy">
            Join <span className="text-forest">{chama.name}</span>
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            You were invited as <b className="text-navy">{invite.role}</b>
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <div className="mb-5 flex gap-1 rounded-lg border border-line bg-paper p-1">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                mode === 'create' ? 'bg-forest text-white' : 'text-ink-soft'
              }`}
            >
              Create account
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                mode === 'login' ? 'bg-forest text-white' : 'text-ink-soft'
              }`}
            >
              I already have one
            </button>
          </div>

          {mode === 'create' ? (
            <form onSubmit={submitCreate} className="space-y-3.5">
              <Field label="Full name" icon={User}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Wambui"
                  className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm text-navy outline-none placeholder:text-ink-soft/70"
                />
              </Field>
              <Field label="Email or phone" icon={Mail}>
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="jane@email.com"
                  className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm text-navy outline-none placeholder:text-ink-soft/70"
                />
              </Field>
              <Field label="Create a password" icon={Lock}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 4 characters"
                  className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm text-navy outline-none placeholder:text-ink-soft/70"
                />
              </Field>
              {error && <p className="text-xs font-medium text-red-600">{error}</p>}
              <button
                type="submit"
                className="w-full rounded-lg bg-forest py-3 text-sm font-semibold text-white"
              >
                Create my account
              </button>
            </form>
          ) : (
            <form onSubmit={submitLogin} className="space-y-3.5">
              <Field label="Email or phone" icon={Mail}>
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="jane@email.com"
                  className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm text-navy outline-none placeholder:text-ink-soft/70"
                />
              </Field>
              <Field label="Password" icon={Lock}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm text-navy outline-none placeholder:text-ink-soft/70"
                />
              </Field>
              {error && <p className="text-xs font-medium text-red-600">{error}</p>}
              <button
                type="submit"
                className="w-full rounded-lg bg-forest py-3 text-sm font-semibold text-white"
              >
                Log in
              </button>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-ink-soft">
          This link only works for {chama.name} — it can't be used to join any other chama.
        </p>
      </div>
    </div>
  )
}

function Field({ label, icon: Icon, children }) {
  return (
    <label className="block text-xs font-semibold text-navy">
      {label}
      <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-line bg-paper px-3 focus-within:border-forest focus-within:bg-white">
        <Icon size={15} className="flex-none text-ink-soft" />
        {children}
      </div>
    </label>
  )
}