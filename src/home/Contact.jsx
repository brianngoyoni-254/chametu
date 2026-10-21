import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiMail, FiMapPin, FiClock, FiSend, FiCheckCircle, FiArrowLeft,
  FiMessageCircle, FiPhone, FiTwitter, FiLinkedin,
} from 'react-icons/fi'
import { toast } from 'sonner'
import Reveal from './Reveal'

const CHANNELS = [
  {
    icon: FiMail,
    title: 'Email support',
    value: 'support@chametu.co.ke',
    hint: 'Fastest way to reach us',
    href: 'mailto:support@chametu.co.ke',
  },
  {
    icon: FiPhone,
    title: 'Call us',
    value: '+254 700 000 000',
    hint: 'Mon–Fri, 9am–6pm EAT',
    href: 'tel:+254700000000',
  },
  {
    icon: FiMessageCircle,
    title: 'WhatsApp',
    value: '+254 711 000 000',
    hint: 'Quick questions, no forms',
    href: 'https://wa.me/254711000000',
  },
]

const FAQS = [
  {
    q: 'How quickly will I hear back?',
    a: 'Usually within 4 hours during business hours, and always within one business day.',
  },
  {
    q: 'I forgot my chama code. Can you help?',
    a: 'Yes. Email us from the address your chama registered, and we\'ll send it back to you.',
  },
  {
    q: 'Can I book a demo for my SACCO?',
    a: 'Absolutely. Tick "Request a demo" below and we\'ll send you a 30-minute slot.',
  },
]

export default function Contact() {
  const [form, setForm] = useState({
    name: '', email: '', chama: '', topic: 'general',
    message: '', demo: false,
  })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('Enter your name.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) return setError('Enter a valid email address.')
    if (!form.message.trim()) return setError('Tell us how we can help.')
    setSent(true)
    toast.success('Message sent — we\'ll reply shortly.')
  }

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
                <FiMail size={22} strokeWidth={2.2} />
              </span>
              <div>
                <span className="inline-flex items-center gap-2 text-[.78rem] font-bold tracking-wide text-forest">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  CONTACT US
                </span>
                <h1 className="mt-2 max-w-[22ch] text-[clamp(1.75rem,4vw,2.6rem)] font-bold leading-[1.1] text-navy">
                  We're here to help.
                </h1>
                <p className="mt-3 max-w-[62ch] text-[0.95rem] leading-relaxed text-ink-soft">
                  Talk to a real person, not a bot. Pick any channel below, or send
                  us a message and we'll reply within one business day.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Channels */}
      <section className="pb-14">
        <div className="wrap">
          <div className="grid gap-3.5 sm:grid-cols-3">
            {CHANNELS.map((c, i) => {
              const Icon = c.icon
              return (
                <Reveal key={c.title} delay={i * 60}>
                  <a
                    href={c.href}
                    className="card-v2 group flex flex-col gap-3 transition hover:-translate-y-0.5 hover:border-forest/40"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest/10 text-forest transition group-hover:bg-forest group-hover:text-white">
                      <Icon size={17} strokeWidth={2.2} />
                    </span>
                    <div>
                      <h3 className="font-display text-[0.98rem] font-semibold text-navy">
                        {c.title}
                      </h3>
                      <p className="mt-1 font-mono text-[0.88rem] text-navy">
                        {c.value}
                      </p>
                      <p className="mt-0.5 text-[0.78rem] text-ink-soft">
                        {c.hint}
                      </p>
                    </div>
                  </a>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* Form + side panel */}
      <section className="pb-14">
        <div className="wrap">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
            {/* Form */}
            <Reveal>
              <div className="card-v2">
                {sent ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald/10 text-forest">
                      <FiCheckCircle size={22} />
                    </span>
                    <h3 className="mt-4 font-display text-[1.05rem] font-semibold text-navy">
                      Thanks, {form.name.split(' ')[0]}.
                    </h3>
                    <p className="mt-1 max-w-[40ch] text-[0.88rem] text-ink-soft">
                      Your message is on its way. We'll reply to{' '}
                      <b className="text-navy">{form.email}</b> within one business
                      day{form.demo ? ', including your demo slot.' : '.'}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={submit} className="space-y-4">
                    <div>
                      <h2 className="font-display text-[1.05rem] font-semibold text-navy">
                        Send us a message
                      </h2>
                      <p className="mt-1 text-[0.84rem] text-ink-soft">
                        All fields marked * are required.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1.5 block text-[0.76rem] font-semibold text-navy">
                          Your name *
                        </span>
                        <input
                          value={form.name}
                          onChange={(e) => update('name', e.target.value)}
                          className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-navy outline-none focus:border-forest"
                          placeholder="e.g. Ann Wanjiru"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-[0.76rem] font-semibold text-navy">
                          Email *
                        </span>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => update('email', e.target.value)}
                          className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-navy outline-none focus:border-forest"
                          placeholder="you@example.com"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-[0.76rem] font-semibold text-navy">
                          Chama name (optional)
                        </span>
                        <input
                          value={form.chama}
                          onChange={(e) => update('chama', e.target.value)}
                          className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-navy outline-none focus:border-forest"
                          placeholder="e.g. Kiambu Land Chama"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-[0.76rem] font-semibold text-navy">
                          Topic
                        </span>
                        <select
                          value={form.topic}
                          onChange={(e) => update('topic', e.target.value)}
                          className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-navy outline-none focus:border-forest"
                        >
                          <option value="general">General question</option>
                          <option value="billing">Billing & payments</option>
                          <option value="technical">Technical support</option>
                          <option value="partnership">Partnership</option>
                          <option value="press">Press inquiry</option>
                        </select>
                      </label>
                    </div>

                    <label className="block">
                      <span className="mb-1.5 block text-[0.76rem] font-semibold text-navy">
                        How can we help? *
                      </span>
                      <textarea
                        rows={5}
                        value={form.message}
                        onChange={(e) => update('message', e.target.value)}
                        className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-navy outline-none focus:border-forest"
                        placeholder="Tell us a bit about what you need…"
                      />
                    </label>

                    <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line bg-paper/60 px-3.5 py-3">
                      <input
                        type="checkbox"
                        checked={form.demo}
                        onChange={(e) => update('demo', e.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-forest"
                      />
                      <span className="text-[0.84rem] text-navy">
                        <b>Request a demo</b> — I'd like a 30-minute walkthrough for
                        my SACCO or chama.
                      </span>
                    </label>

                    {error && (
                      <p className="rounded-lg bg-red-50 px-3 py-2 text-[0.82rem] font-medium text-red-600">
                        {error}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <p className="text-[0.74rem] text-ink-soft">
                        By sending, you agree to our{' '}
                        <Link to="/privacy" className="font-semibold text-forest hover:underline">
                          privacy policy
                        </Link>
                        .
                      </p>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-forest-dark"
                      >
                        <FiSend size={14} /> Send message
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </Reveal>

            {/* Side panel */}
            <div className="space-y-4">
              <Reveal delay={60}>
                <div className="card-v2">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest/10 text-forest">
                      <FiMapPin size={16} />
                    </span>
                    <h3 className="font-display text-[0.98rem] font-semibold text-navy">
                      Our office
                    </h3>
                  </div>
                  <p className="mt-3 text-[0.86rem] leading-relaxed text-ink-soft">
                    Westlands, Nairobi<br />
                    Kenya
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-[0.8rem] text-ink-soft">
                    <FiClock size={12} className="text-forest" />
                    <span>Mon–Fri · 9:00–18:00 EAT</span>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={120}>
                <div className="card-v2">
                  <h3 className="font-display text-[0.98rem] font-semibold text-navy">
                    Follow us
                  </h3>
                  <p className="mt-1 text-[0.82rem] text-ink-soft">
                    Product updates and chama stories.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <a
                      href="#"
                      aria-label="Twitter"
                      className="grid h-9 w-9 place-items-center rounded-xl border border-line text-ink-soft transition hover:border-forest hover:bg-forest/5 hover:text-forest"
                    >
                      <FiTwitter size={15} />
                    </a>
                    <a
                      href="#"
                      aria-label="LinkedIn"
                      className="grid h-9 w-9 place-items-center rounded-xl border border-line text-ink-soft transition hover:border-forest hover:bg-forest/5 hover:text-forest"
                    >
                      <FiLinkedin size={15} />
                    </a>
                    <a
                      href="mailto:support@chametu.co.ke"
                      aria-label="Email"
                      className="grid h-9 w-9 place-items-center rounded-xl border border-line text-ink-soft transition hover:border-forest hover:bg-forest/5 hover:text-forest"
                    >
                      <FiMail size={15} />
                    </a>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-20">
        <div className="wrap">
          <Reveal>
            <h2 className="font-display text-[1.15rem] font-bold text-navy">
              Quick answers
            </h2>
          </Reveal>
          <div className="mt-4 space-y-2.5">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={i * 50}>
                <div className="card-v2">
                  <h3 className="font-display text-[0.92rem] font-semibold text-navy">
                    {f.q}
                  </h3>
                  <p className="mt-1.5 text-[0.86rem] text-ink-soft">{f.a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}