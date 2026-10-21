import { Link } from 'react-router-dom'
import {
  FiShield, FiLock, FiEye, FiUserCheck, FiDownload, FiMail,
  FiArrowLeft, FiCheckCircle,
} from 'react-icons/fi'
import Reveal from './Reveal'

const SECTIONS = [
  {
    id: 'what-we-collect',
    icon: FiEye,
    title: 'What we collect',
    body: 'We collect only the information required to run your chama: your name, phone number, email, member role, contribution history, and M-Pesa transaction references. We never collect your M-Pesa PIN, ID number, or any payment credentials.',
    points: [
      'Account data: name, phone, email, chama code, role.',
      'Financial data: contributions, loans, repayments, welfare claims.',
      'Activity data: sign-ins, edits, approvals — written to an audit log.',
      'Device data: browser type and IP address, used only for fraud prevention.',
    ],
  },
  {
    id: 'how-we-use',
    icon: FiUserCheck,
    title: 'How we use it',
    body: 'Your data powers the ledger your chama relies on. We use it to reconcile M-Pesa payments, calculate loan eligibility, send contribution reminders, and generate statements and reports for your officials.',
    points: [
      'Never sold to third parties. Ever.',
      'Never used to train external AI models.',
      'Only shared with your chama officials, per their role.',
      'Retained for 7 years for financial record-keeping, then deleted.',
    ],
  },
  {
    id: 'security',
    icon: FiLock,
    title: 'How we protect it',
    body: 'All traffic is encrypted in transit (TLS 1.3) and at rest (AES-256). Access to production data is role-scoped, logged, and reviewed monthly. Every entry your officials make to the ledger creates an immutable audit event.',
    points: [
      'Encrypted at rest and in transit.',
      'Role-based access enforced at sign-in.',
      'Every write is logged. No silent overwrites.',
      'Backups tested every week.',
    ],
  },
  {
    id: 'your-rights',
    icon: FiDownload,
    title: 'Your rights',
    body: 'Under the Kenya Data Protection Act (2019), you have the right to access, correct, export or delete the data we hold about you. You can also ask us to explain any processing that affects you.',
    points: [
      'Export everything as CSV, Excel or PDF, any time.',
      'Request correction of inaccurate entries.',
      'Request deletion (subject to legal retention limits).',
      'Object to processing by contacting support@chametu.co.ke.',
    ],
  },
]

export default function Privacy() {
  return (
    <main className="bg-paper">
      <section className="pt-[100px] pb-14">
        <div className="wrap">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-forest hover:text-forest-dark transition"
          >
            <FiArrowLeft size={14} />
            Back to home
          </Link>

          <Reveal>
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-forest/10 text-forest">
                <FiShield size={22} strokeWidth={2.2} />
              </span>
              <div>
                <span className="inline-flex items-center gap-2 text-[.78rem] font-bold tracking-wide text-forest">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  PRIVACY POLICY
                </span>
                <h1 className="mt-2 max-w-[22ch] text-[clamp(1.75rem,4vw,2.6rem)] font-bold leading-[1.1] text-navy">
                  How Chametu protects your chama's data.
                </h1>
                <p className="mt-3 max-w-[62ch] text-[0.95rem] leading-relaxed text-ink-soft">
                  Plain English. No small print. Just what we collect, why, and how
                  you stay in control. This policy was last updated on{' '}
                  <b className="text-navy">1 October 2026</b>.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-16">
        <div className="wrap">
          <div className="grid gap-5 lg:grid-cols-2">
            {SECTIONS.map((s, i) => {
              const Icon = s.icon
              return (
                <Reveal key={s.id} delay={i * 60}>
                  <div
                    id={s.id}
                    className="card-v2 flex h-full flex-col gap-4 scroll-mt-24"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-forest/10 text-forest">
                        <Icon size={16} strokeWidth={2.2} />
                      </span>
                      <h2 className="font-display text-[1.02rem] font-semibold text-navy">
                        {s.title}
                      </h2>
                    </div>
                    <p className="text-[0.9rem] leading-relaxed text-ink-soft">
                      {s.body}
                    </p>
                    <ul className="mt-auto space-y-1.5 pt-2">
                      {s.points.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-[0.86rem] text-ink-soft">
                          <FiCheckCircle
                            size={13}
                            className="mt-0.5 shrink-0 text-forest"
                          />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="wrap">
          <Reveal>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-[#0B1F33] p-6 text-white sm:p-8">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-white/10 text-gold">
                  <FiMail size={18} />
                </span>
                <div>
                  <h3 className="font-display text-[1.05rem] font-semibold text-white">
                    Questions about your data?
                  </h3>
                  <p className="mt-1 max-w-[52ch] text-[0.86rem] text-white/70">
                    Reach our Data Protection Officer at{' '}
                    <a
                      href="mailto:privacy@chametu.co.ke"
                      className="font-semibold text-gold underline decoration-gold/40 underline-offset-2 hover:text-[#FFC857]"
                    >
                      privacy@chametu.co.ke
                    </a>
                    . We respond within 48 hours.
                  </p>
                </div>
              </div>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[0.85rem] font-semibold text-navy transition hover:-translate-y-0.5 hover:bg-white/90"
              >
                Contact us
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}