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
          className="rounded-full border border-line px-2.5 py-1 text-[.74rem] font-medium text-ink-soft"
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
      className={`rounded-2xl border border-line bg-card p-6 transition-colors duration-200 hover:border-forest/40 ${className}`}
    >
      <div className={wide ? 'lg:grid lg:grid-cols-2 lg:items-center lg:gap-10' : ''}>
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-forest/10 text-forest">
              <Icon size={19} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <h3 className="font-display text-[1.08rem] font-semibold text-navy">{title}</h3>
          </div>
          <p className="mt-3 max-w-[46ch] text-[.9rem] leading-relaxed text-ink-soft">{desc}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Features() {
  return (
    <section id="features" className="py-20 sm:py-24">
      <div className="wrap">
        <Reveal className="max-w-[52ch]">
          <h2 className="font-display text-[1.9rem] font-bold leading-tight tracking-tight text-navy sm:text-[2.4rem]">
            Six modules. One connected ledger.
          </h2>
          <p className="mt-3 text-[1rem] leading-relaxed text-ink-soft">
            Every contribution, loan, expense and investment flows through the same ledger, so nothing needs
            reconciling by hand.
          </p>
        </Reveal>

        <Reveal className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Tile
            icon={FiPercent}
            title="Contributions"
            desc="Weekly, monthly or custom cycles, reconciled automatically against M-Pesa, bank or cash."
            className="lg:col-span-3"
          >
            <div className="mt-5 overflow-hidden rounded-xl border border-line">
              {CONTRIBUTIONS.map(([name, amount, status], i) => (
                <div
                  key={name}
                  className={`flex items-center justify-between gap-3 px-4 py-3 text-[.84rem] ${
                    i > 0 ? 'border-t border-line' : ''
                  }`}
                >
                  <span className="min-w-0 truncate font-medium text-navy">{name}</span>
                  <span className="flex items-center gap-3">
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
            <div className="mt-5 rounded-xl border border-line p-4">
              <div className="flex items-center justify-between text-[.84rem]">
                <span className="font-medium text-navy">LN-102 &middot; Mary Wanjiku</span>
                <span className="font-mono text-ink-soft">KSh 100,000</span>
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
              <div className="mt-2.5 flex items-center justify-between text-[.76rem] text-ink-soft">
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
            <div className="mt-5 rounded-xl border border-line bg-paper p-4 lg:mt-0 lg:justify-self-end lg:w-full lg:max-w-[380px]">
              <div className="flex items-center justify-between text-[.78rem] text-ink-soft">
                <span>Member statement &middot; Jane Achieng</span>
                <span>September</span>
              </div>
              {[
                ['Contribution', '+ KSh 5,000'],
                ['Welfare', '+ KSh 500'],
                ['Loan repayment', '- KSh 8,000'],
              ].map(([label, amount]) => (
                <div key={label} className="mt-2.5 flex items-center justify-between text-[.84rem]">
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