import { Link } from 'react-router-dom'

export default function ForgotPassword() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 text-center">
        <h1 className="font-display text-xl text-navy">Reset your password</h1>
        <p className="mt-2 text-sm text-ink-soft">This page isn&rsquo;t built yet — coming soon.</p>
        <Link to="/" className="mt-5 inline-block text-sm font-semibold text-forest">
          ← Back to home
        </Link>
      </div>
    </div>
  )
}