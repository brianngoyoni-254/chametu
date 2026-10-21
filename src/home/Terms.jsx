import { Link } from 'react-router-dom'
import {
  FiFileText, FiArrowLeft, FiUsers, FiPercent, FiShield,
  FiAlertTriangle, FiCreditCard, FiMail,
} from 'react-icons/fi'
import Reveal from './Reveal'

const SECTIONS = [
  {
    icon: FiUsers,
    title: '1. Your account',
    body: 'You must be at least 18 years old and authorised by your chama to create an account. You are responsible for the accuracy of member data you enter and for keeping your sign-in credentials secure.',
    points: [
      'One account per person. Do not share credentials.',
      'Notify us immediately if you suspect unauthorised access.',
      'You must be the chama\'s elected official or an invited member.',
    ],
  },
  {
    icon: FiCreditCard,
    title: '2. Subscriptions and payments',
    body: 'Chama subscriptions are billed monthly in advance. Members do not pay — only the chama pays for its tier. Prices are shown at sign-up and on your dashboard, and we give 30 days notice for any price change.',
    points: [
      'Subscriptions renew automatically each month.',
      'Cancel anytime from your dashboard. No cancellation fee.',
      'Failed payments may result in account suspension after a grace period.',
      'All prices are in Kenyan Shillings and inclusive of applicable taxes.',
    ],
  },
  {
    icon: FiPercent,
    title: '3. Member contributions and loans',
    body: 'Chametu is a record-keeping platform. We are not a lender, a savings institution, or a party to any agreement between your chama and its members. All contributions, loans and repayments happen between members, not with Chametu.',
    points: [
      'We do not lend, invest, or guarantee any chama transaction.',
      'Disputes between members must be resolved by the chama.',
      'We help you keep accurate records, nothing more.',
    ],
  },
  {
    icon: FiShield,
    title: '4. Acceptable use',
    body: 'You agree to use Chametu only for lawful chama operations. You will not attempt to reverse-engineer, resell, scrape, or disrupt the platform, and you will not use it to launder money or commit fraud.',
    points: [
      'No automated scraping, bots or unauthorised API access.',
      'No uploading malicious code or illegal content.',
      'No impersonating another chama or member.',
      'Violations may result in account termination.',
    ],
  },
  {
    icon: FiAlertTriangle,
    title: '5. Liability',
    body: 'Chametu is provided "as is". While we protect your data with industry-standard security, we are not liable for indirect or consequential losses, or for losses arising from chama-level disputes.',
    points: [
      'Our total liability is capped at the fees you paid in the last 12 months.',
      'We are not responsible for member non-payment.',
      'We are not responsible for M-Pesa or bank outages.',
      'We follow the laws of Kenya and the Data Protection Act 2019.',
    ],
  },
]

export default function Terms() {
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
                <FiFileText size={22} strokeWidth={2.2} />
              </span>
              <div>
                <span className="inline-flex items-center gap-2 text-[.78rem] font-bold tracking-wide text-forest">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  TERMS OF SERVICE
                </span>
                <h1 className="mt-2 max-w-[22ch] text-[clamp(1.75rem,4vw,2.6rem)] font-bold leading-[1.1] text-navy">
                  The rules of using Chametu.
                </h1>
                <p className="mt-3 max-w-[62ch] text-[0.95rem] leading-relaxed text-ink-soft">
                  Short, fair and written for chama officials, not lawyers. These
                  terms were last updated on <b className="text-navy">1 October 2026</b>.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-14">
        <div className="wrap">
          <div className="space-y-4">
            {SECTIONS.map((s, i) => {
              const Icon = s.icon
              return (
                <Reveal key={s.title} delay={i * 60}>
                  <div className="card-v2">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-forest/10 text-forest">
                          <Icon size={16} strokeWidth={2.2} />
                        </span>
                        <h2 className="font-display text-[1.02rem] font-semibold text-navy">
                          {s.title}
                        </h2>
                      </div>
                    </div>

                    <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-soft">
                      {s.body}
                    </p>

                    <ul className="mt-3 space-y-1.5">
                      {s.points.map((p) => (
                        <li
                          key={p}
                          className="flex items-start gap-2 text-[0.86rem] text-ink-soft"
                        >
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-forest" />
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
                    Need clarification?
                  </h3>
                  <p className="mt-1 max-w-[52ch] text-[0.86rem] text-white/70">
                    Email{' '}
                    <a
                      href="mailto:legal@chametu.co.ke"
                      className="font-semibold text-gold underline decoration-gold/40 underline-offset-2 hover:text-[#FFC857]"
                    >
                      legal@chametu.co.ke
                    </a>{' '}
                    and our team will respond within 2 working days.
                  </p>
                </div>
              </div>
              <Link
                to="/privacy"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-[0.85rem] font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/[0.16]"
              >
                Read the privacy policy
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}