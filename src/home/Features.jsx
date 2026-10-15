import {
  FiUsers,
  FiPercent,
  FiRepeat,
  FiTrendingUp,
  FiCalendar,
  FiFileText,
} from 'react-icons/fi'
import Reveal from './Reveal'

/* Small, static product previews so each module shows what it looks like. */

const CONTRIBUTIONS = [
  ['Kevin Otieno', 'KSh 5,000', 'Matched'],
  ['Mary Wanjiku', 'KSh 5,000', 'Matched'],
  ['Peter Kamau', 'KSh 5,000', 'Due Friday'],
]

function Pill({ tone = 'ok', children }) {
  const tones = {
    ok: 'bg-forest/10 text-forest',
    due: 'bg-gold/20 text-[#8A5A00]',
  }
  return (
    <span className={`rounded-full px-2.5 py-1 text-[.64rem] font-bold uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  )
}

function Chips({ items }) {
  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-line bg-paper px-2.5 py-1 text-[.72rem] font-medium text-ink-soft transition-colors hover:border-forest/40 hover:text-forest sm:text-[.74rem]"
        >
          {item}
        </span>
      ))}
    </div>
  )
}

function Tile({ icon: Icon, title, desc, className = '', wide = false, children }) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-line bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-forest/40 hover:shadow-[0_18px_40px_-20px_rgba(11,122,90,0.25)] sm:p-6 ${className}`}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-forest/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
      />
      <div className={`relative ${wide ? 'lg:grid lg:grid-cols-2 lg:items-center lg:gap-10' : ''}`}>
        <div>
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-forest/10 text-forest transition-transform duration-300 group-hover:scale-110">
              <Icon size={19} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <h3 className="min-w-0 font-display text-[1.02rem] font-semibold text-navy sm:text-[1.08rem]">
              {title}
            </h3>
          </div>
          <p className="mt-3 max-w-[46ch] text-[0.88rem] leading-relaxed text-ink-soft sm:text-[.9rem]">
            {desc}
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Features() {
  return (
    <section id="features" className="py-16 sm:py-20 md:py-24">
      <div className="wrap">
        <Reveal className="max-w-[52ch]">
          <h2 className="font-display text-[clamp(1.6rem,5vw,2.4rem)] font-bold leading-tight tracking-tight text-navy">
            Six modules. One connected ledger.
          </h2>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft sm:text-[1rem]">
            Every contribution, loan, expense and investment flows through the same ledger, so nothing needs
            reconciling by hand.
          </p>
        </Reveal>

        <Reveal className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 md:grid-cols-2 lg:grid-cols-6">
          <Tile
            icon={FiPercent}
            title="Contributions"
            desc="Weekly, monthly or custom cycles, reconciled automatically against M-Pesa, bank or cash."
            className="lg:col-span-3"
          >
            <div className="mt-5 overflow-hidden rounded-xl border border-line bg-paper/40">
              {CONTRIBUTIONS.map(([name, amount, status], i) => (
                <div
                  key={name}
                  className={`flex items-center justify-between gap-3 px-3.5 py-3 text-[0.82rem] sm:px-4 sm:text-[.84rem] ${
                    i > 0 ? 'border-t border-line' : ''
                  }`}
                >
                  <span className="min-w-0 truncate font-medium text-navy">{name}</span>
                  <span className="flex items-center gap-2.5 sm:gap-3">
                    <span className="font-mono text-ink-soft">{amount}</span>
                    <Pill tone={status === 'Matched' ? 'ok' : 'due'}>{status}</Pill>
                  </span>
                </div>
              ))}
            </div>
          </Tile>

          <Tile
            icon={FiRepeat}
            title="Loans"
            desc="Application, guarantors, approval and repayment, with interest calculated for you."
            className="lg:col-span-3"
          >
            <div className="mt-5 rounded-xl border border-line bg-paper/40 p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-3 text-[0.82rem] sm:text-[.84rem]">
                <span className="min-w-0 truncate font-medium text-navy">
                  LN-102 &middot; Mary Wanjiku
                </span>
                <span className="whitespace-nowrap font-mono text-ink-soft">KSh 100,000</span>
              </div>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-forest/10"
                role="progressbar"
                aria-valuenow={62}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Loan repaid"
              >
                <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-forest to-emerald" />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[0.74rem] text-ink-soft sm:text-[.76rem]">
                <span>62% repaid</span>
                <span>2 of 2 guarantors approved</span>
              </div>
            </div>
          </Tile>

          <Tile
            icon={FiUsers}
            title="Members"
            desc="Roles and permissions from day one, with a private profile for every member."
            className="lg:col-span-2"
          >
            <Chips items={['Chairperson', 'Treasurer', 'Secretary', 'Member']} />
          </Tile>

          <Tile
            icon={FiTrendingUp}
            title="Investments"
            desc="A real portfolio ledger for every asset your chama holds."
            className="lg:col-span-2"
          >
            <Chips items={['MMFs', 'Land', 'Shares', 'Business ventures']} />
          </Tile>

          <Tile
            icon={FiCalendar}
            title="Meetings & voting"
            desc="Agendas, attendance, locked minutes, and proposals members vote on from their phones."
            className="lg:col-span-2"
          />

          <Tile
            icon={FiFileText}
            title="Reports"
            desc="Member statements and financial reports, ready for your next AGM."
            className="md:col-span-2 lg:col-span-6"
            wide
          >
            <div className="mt-5 rounded-xl border border-line bg-paper/40 p-3.5 sm:p-4 lg:mt-0 lg:w-full lg:max-w-[380px] lg:justify-self-end">
              <div className="flex items-center justify-between text-[0.76rem] text-ink-soft sm:text-[.78rem]">
                <span>Member statement &middot; Jane Achieng</span>
                <span>September</span>
              </div>
              {[
                ['Contribution', '+ KSh 5,000'],
                ['Welfare', '+ KSh 500'],
                ['Loan repayment', '- KSh 8,000'],
              ].map(([label, amount]) => (
                <div
                  key={label}
                  className="mt-2.5 flex items-center justify-between text-[0.82rem] sm:text-[.84rem]"
                >
                  <span className="text-navy">{label}</span>
                  <span className="font-mono text-ink-soft">{amount}</span>
                </div>
              ))}
            </div>
          </Tile>
        </Reveal>
      </div>
    </section>
  )
}