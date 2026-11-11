// src/member/MemberContributions.jsx
import { useState } from 'react'
import { Smartphone, Check, Clock, Info, Loader2, X, Send, Copy, Building, Wallet } from 'lucide-react'
import { useMember } from '../context/MemberContext'
import { api } from '../lib/api'
import { toast } from 'sonner'

function fmt(n) {
  return 'KSh ' + Math.round(Number(n) || 0).toLocaleString('en-KE')
}

function fmtDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch {
    return '—'
  }
}

const badge = {
  done: 'bg-emerald/10 text-forest ring-1 ring-emerald/20',
  pending: 'bg-gold/15 text-[#8A6417] ring-1 ring-gold/25',
  overdue: 'bg-red-50 text-red-600 ring-1 ring-red-100',
}
const label = { done: 'Paid', pending: 'Pending', overdue: 'Overdue' }

export default function MemberContributions() {
  const { chama, contributions, isLoading, refetch } = useMember()

  const [showPayModal, setShowPayModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [mpesaCode, setMpesaCode] = useState('')
  const [sendingConfirm, setSendingConfirm] = useState(false)

  const expected = Number(chama?.monthly_contribution || 0)
  const paid = contributions.reduce((s, c) => s + Number(c.amount || 0), 0)
  const pct = expected ? Math.min(100, Math.round((paid / expected) * 100)) : 0
  const isPaid = expected > 0 && paid >= expected
  const balance = Math.max(0, expected - paid)

  // Fetch the payment method set by the admin
  const method = chama?.contribution_method || 'paybill'
  const number = chama?.contribution_number || '400200'
  const accountRef = chama?.contribution_account_ref || 'CHAMETU'

  // ---- Handle "Confirm Payment" submission ----
  const submitConfirmation = async (e) => {
    e.preventDefault()
    if (!mpesaCode.trim() || mpesaCode.length < 6) {
      return toast.error('Enter a valid M-Pesa code (e.g. SJC4XYZ12A)')
    }

    setSendingConfirm(true)
    try {
      // We send this as a support ticket to the admins so they can record it manually.
      await api('/api/support/', {
        method: 'POST',
        body: {
          subject: `Contribution Payment from ${chama.name}`,
          description: `Hello Admin, I have sent my contribution of ${fmt(balance)} via M-Pesa. My confirmation code is: ${mpesaCode.toUpperCase()}. Please verify and record this payment on my account.`,
          category: 'billing',
          priority: 'high',
        },
      })
      toast.success('Confirmation sent! Your admin will record the payment shortly.')
      setShowConfirmModal(false)
      setShowPayModal(false)
      setMpesaCode('')
      // Optionally refetch so UI updates if the admin happened to already record it
      refetch()
    } catch (err) {
      toast.error(err.message || 'Failed to send confirmation.')
    } finally {
      setSendingConfirm(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-navy">Contributions</h1>
        <p className="mt-1 text-[0.86rem] text-ink-soft">
          {chama?.name || 'Your chama'} / due on the {chama?.due_day || 30}th each month
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-sm">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full opacity-50"
          style={{
            background:
              'radial-gradient(circle, rgba(16,185,129,0.18), transparent 70%)',
          }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[0.7rem] font-semibold uppercase tracking-widest text-ink-soft">
              This month
            </div>
            <div className="mt-1.5 font-display font-mono text-3xl font-bold tracking-tight text-navy">
              {fmt(expected)}
            </div>
            <div className="mt-1 text-[0.78rem] text-ink-soft">
              {isPaid ? 'Fully settled' : `${fmt(paid)} paid so far`}
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[0.68rem] font-bold uppercase tracking-widest ${
              isPaid ? badge.done : badge.pending
            }`}
          >
            {isPaid ? label.done : label.pending}
          </span>
        </div>

        <div className="relative mt-5">
          <div className="h-2 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-gradient-to-r from-forest to-emerald transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[0.7rem] text-ink-soft">
            <span>{pct}% complete</span>
            <span>Balance {fmt(balance)}</span>
          </div>
        </div>

        {!isPaid && expected > 0 ? (
          <button
            onClick={() => setShowPayModal(true)}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-forest to-emerald py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(11,122,90,0.25)] transition hover:-translate-y-0.5"
          >
            <Smartphone size={15} />
            Pay {fmt(balance)} via M-Pesa
          </button>
        ) : isPaid ? (
          <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-emerald/10 py-3.5 text-sm font-semibold text-forest ring-1 ring-emerald/20">
            <Check size={16} />
            Paid for this month
          </div>
        ) : (
          <div className="mt-5 flex items-center justify-center rounded-2xl bg-paper py-3.5 text-sm text-ink-soft">
            No contribution schedule configured
          </div>
        )}
      </div>

      <div className="flex items-start gap-2.5 rounded-xl bg-emerald/[0.06] px-4 py-3 text-[0.8rem] text-navy ring-1 ring-emerald/10">
        <Info size={15} className="mt-0.5 flex-none text-forest" />
        <span>
          Payments made after the due date attract a small late fee, as agreed by your chama. If
          you have already paid and this has not updated, tap "I've Paid" to notify the admin.
        </span>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-navy">
          <Clock size={14} className="text-ink-soft" />
          Payment history
        </h3>

        {isLoading && contributions.length === 0 ? (
          <div className="py-10 text-center">
            <Loader2 className="mx-auto animate-spin text-forest" size={22} />
          </div>
        ) : contributions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line py-10 text-center">
            <Clock size={20} className="mx-auto text-ink-soft/60" />
            <p className="mt-2 text-sm text-ink-soft">No payments recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper/60 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-ink-soft">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Reference</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-line last:border-none transition hover:bg-forest/[0.02]"
                  >
                    <td className="px-4 py-3 text-ink-soft">{fmtDate(c.created_at)}</td>
                    <td className="px-4 py-3 text-navy">{c.reference || '—'}</td>
                    <td className="px-4 py-3 font-mono text-navy">
                      {Number(c.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-block rounded-full bg-emerald/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-forest">
                        Paid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Show M-Pesa Instructions */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowPayModal(false)}>
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#00A651] text-white shadow-sm">
                  <Smartphone size={20} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-navy">Pay Contribution</h3>
                  <p className="text-[0.74rem] text-ink-soft">Via M-Pesa {method.replace('_', ' ')}</p>
                </div>
              </div>
              <button onClick={() => setShowPayModal(false)} className="rounded-lg p-1.5 text-ink-soft hover:bg-paper">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="rounded-2xl bg-[#F8FAFC] p-5 border border-line shadow-inner">
                <div className="space-y-4">
                  
                  {/* Step 1 */}
                  <div className="flex items-start gap-3">
                    <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-forest/10 text-[0.7rem] font-bold text-forest mt-0.5">1</span>
                    <div>
                      <p className="text-[0.86rem] font-semibold text-navy">Go to M-Pesa Menu</p>
                      <p className="text-[0.78rem] text-ink-soft">Select <b>Lipa na M-Pesa</b></p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3">
                    <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-forest/10 text-[0.7rem] font-bold text-forest mt-0.5">2</span>
                    <div>
                      <p className="text-[0.86rem] font-semibold text-navy">
                        {method === 'send_money' ? 'Select Send Money' : method === 'paybill' ? 'Select Pay Bill' : 'Select Buy Goods and Services'}
                      </p>
                    </div>
                  </div>

                  {/* Step 3 - The actual numbers */}
                  <div className="flex items-start gap-3">
                    <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-forest/10 text-[0.7rem] font-bold text-forest mt-0.5">3</span>
                    <div className="flex-1 space-y-2.5">
                      <p className="text-[0.86rem] font-semibold text-navy">Enter Payment Details</p>
                      
                      <div className="flex items-center justify-between rounded-xl bg-white border border-line px-3 py-2.5">
                        <div>
                          <p className="text-[0.66rem] font-semibold uppercase tracking-widest text-ink-soft">
                            {method === 'send_money' ? 'Phone Number' : method === 'paybill' ? 'Business Number' : 'Till Number'}
                          </p>
                          <p className="font-mono text-base font-bold text-navy">{number}</p>
                        </div>
                        <button onClick={() => copyToClipboard(number)} className="rounded-lg bg-paper p-2 text-navy hover:bg-line transition">
                          <Copy size={14} />
                        </button>
                      </div>

                      {method === 'paybill' && (
                        <div className="flex items-center justify-between rounded-xl bg-white border border-line px-3 py-2.5">
                          <div>
                            <p className="text-[0.66rem] font-semibold uppercase tracking-widest text-ink-soft">Account Number</p>
                            <p className="font-mono text-base font-bold text-navy">{accountRef}</p>
                          </div>
                          <button onClick={() => copyToClipboard(accountRef)} className="rounded-lg bg-paper p-2 text-navy hover:bg-line transition">
                            <Copy size={14} />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between rounded-xl bg-white border border-line px-3 py-2.5">
                        <div>
                          <p className="text-[0.66rem] font-semibold uppercase tracking-widest text-ink-soft">Amount (KSh)</p>
                          <p className="font-mono text-base font-bold text-navy">{balance.toLocaleString()}</p>
                        </div>
                        <button onClick={() => copyToClipboard(String(balance))} className="rounded-lg bg-paper p-2 text-navy hover:bg-line transition">
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-line bg-paper/50 px-6 py-4 flex gap-3">
              <button 
                onClick={() => setShowPayModal(false)}
                className="flex-1 rounded-xl border border-line bg-white py-2.5 text-[0.84rem] font-semibold text-navy hover:border-navy transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowConfirmModal(true)}
                className="flex-1 rounded-xl bg-gradient-to-br from-forest to-emerald py-2.5 text-[0.84rem] font-semibold text-white shadow-sm hover:-translate-y-0.5 transition"
              >
                I've Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Confirm M-Pesa Code */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)}>
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <form onSubmit={submitConfirmation}>
              <div className="flex items-center justify-between border-b border-line px-6 py-4">
                <div className="flex items-center gap-2">
                  <Send size={18} className="text-forest" />
                  <h3 className="font-display text-[1.05rem] font-bold text-navy">Confirm Payment</h3>
                </div>
                <button type="button" onClick={() => setShowConfirmModal(false)} className="rounded-lg p-1.5 text-ink-soft hover:bg-paper">
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6">
                <p className="text-[0.84rem] text-ink-soft mb-4">
                  Please enter the M-Pesa confirmation code you received via SMS so the admin can verify and record your payment.
                </p>
                <label className="block">
                  <span className="mb-1.5 block text-[0.78rem] font-semibold text-navy">M-Pesa Code</span>
                  <input 
                    value={mpesaCode}
                    onChange={e => setMpesaCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SJC4XYZ12A"
                    autoFocus
                    className="w-full rounded-xl border border-line px-4 py-3 font-mono text-base uppercase tracking-widest text-navy outline-none focus:border-forest focus:ring-4 focus:ring-forest/10 transition"
                  />
                </label>
              </div>

              <div className="border-t border-line bg-paper/50 px-6 py-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 rounded-xl border border-line bg-white py-2.5 text-[0.84rem] font-semibold text-navy hover:border-navy transition"
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  disabled={sendingConfirm || !mpesaCode}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-forest py-2.5 text-[0.84rem] font-semibold text-white shadow-sm disabled:opacity-50 transition"
                >
                  {sendingConfirm ? <Loader2 size={15} className="animate-spin" /> : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}