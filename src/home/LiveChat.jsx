// src/components/LiveChat.jsx
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiMessageCircle, FiX, FiSend, FiMail, FiPhone, FiArrowRight,
  FiCheckCircle, FiClock, FiUsers, FiThumbsUp, FiThumbsDown,
  FiTrash2, FiRotateCcw, FiStar, FiLoader,
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const WHATSAPP_NUMBER = '254110279735'
const WHATSAPP_DISPLAY = '+254 110 279 735'
const PHONE_DISPLAY = '+254 110 279 735'
const EMAIL = 'support@chametu.co.ke'

export default function LiveChat() {
  const { isAuthenticated } = useAuth()

  const [open, setOpen] = useState(false)
  const [dismissedTeaser, setDismissedTeaser] = useState(false)
  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [ended, setEnded] = useState(false)
  const rootRef = useRef(null)
  const bodyRef = useRef(null)

  // Load or create the session when the chat opens
  useEffect(() => {
    if (!open || !isAuthenticated) return
    if (session) return

    let cancelled = false
    setLoading(true)
    setError(null)

    ;(async () => {
      try {
        const data = await api('/api/chat/session')
        if (cancelled) return
        setSession(data)
        setMessages(data.messages || [])
        setSuggestions(data.suggestions || [])
        setEnded(data.status === 'ended')
      } catch (err) {
        if (cancelled) return
        setError(err.message || 'Could not load chat')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, isAuthenticated, session])

  // Close on Escape / outside click
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  // Auto scroll
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages, sending])

  async function sendMessage(text) {
    const q = (text || '').trim()
    if (!q || sending || ended || !session) return

    setSending(true)
    setError(null)
    setInput('')

    // Optimistic user message
    const tempUser = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      body: q,
      at: new Date().toISOString(),
    }
    setMessages((m) => [...m, tempUser])

    try {
      const res = await api(`/api/chat/session/${session.id}/message`, {
        method: 'POST',
        body: { text: q },
      })

      // Replace optimistic user msg with the server's version + append bot reply
      setMessages((m) => {
        const withoutTemp = m.filter((x) => x.id !== tempUser.id)
        return [...withoutTemp, res.user, res.bot]
      })

      if (Array.isArray(res.suggestions)) {
        setSuggestions(res.suggestions)
      } else {
        setSuggestions([])
      }
    } catch (err) {
      setError(err.message || 'Message failed')
      // Revert optimistic on failure
      setMessages((m) => m.filter((x) => x.id !== tempUser.id))
    } finally {
      setSending(false)
    }
  }

  async function sendFeedback(messageId, feedback) {
    setMessages((m) =>
      m.map((x) => (x.id === messageId ? { ...x, feedback } : x))
    )
    try {
      await api(`/api/chat/message/${messageId}/feedback`, {
        method: 'POST',
        body: { feedback },
      })
    } catch {
      // Silently ignore — feedback is not critical
    }
  }

  async function endChat() {
    if (!session) return
    try {
      const res = await api(`/api/chat/session/${session.id}/end`, {
        method: 'POST',
      })
      setMessages((m) => [
        ...m,
        {
          id: `end-${Date.now()}`,
          sender: 'bot',
          body:
            'Thanks for chatting with us. If you need anything else, start a new chat any time — a human is always one tap away.',
          isEnd: true,
          at: new Date().toISOString(),
        },
      ])
      setEnded(true)
      void res
    } catch (err) {
      setError(err.message || 'Could not end chat')
    }
  }

  async function startNew() {
    setLoading(true)
    setError(null)
    setMessages([])
    setSession(null)
    setEnded(false)
    setSuggestions([])
    try {
      const data = await api('/api/chat/session', { method: 'POST' })
      setSession(data)
      setMessages(data.messages || [])
      setSuggestions(data.suggestions || [])
      setEnded(data.status === 'ended')
    } catch (err) {
      setError(err.message || 'Could not start chat')
    } finally {
      setLoading(false)
    }
  }

  function submit(e) {
    e.preventDefault()
    sendMessage(input)
  }

  function dismissTeaser() {
    setDismissedTeaser(true)
    try {
      sessionStorage.setItem('chametu_chat_teaser', 'dismissed')
    } catch {}
  }

  // Load teaser preference once
  useEffect(() => {
    try {
      if (sessionStorage.getItem('chametu_chat_teaser') === 'dismissed') {
        setDismissedTeaser(true)
      }
    } catch {}
  }, [])

  /* ---------- Render ---------- */

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
        {!open && !dismissedTeaser && (
          <div className="relative mb-3 hidden max-w-[280px] rounded-2xl border border-line bg-white p-3.5 shadow-[0_20px_50px_-20px_rgba(11,31,51,0.35)] sm:block">
            <button
              onClick={dismissTeaser}
              className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full border border-line bg-white text-ink-soft transition hover:bg-paper"
              aria-label="Dismiss"
            >
              <FiX size={11} />
            </button>
            <div className="flex items-start gap-2.5">
              <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-forest/10 text-forest">
                <FiMessageCircle size={15} />
              </span>
              <div className="min-w-0">
                <p className="text-[0.82rem] font-semibold text-navy">
                  Questions? Ask us.
                </p>
                <p className="mt-0.5 text-[0.74rem] leading-snug text-ink-soft">
                  Instant answers about Chametu. Human help one tap away.
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close support chat' : 'Open support chat'}
          aria-expanded={open}
          className={`group relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-forest to-emerald text-white shadow-[0_18px_40px_-12px_rgba(11,122,90,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-12px_rgba(11,122,90,0.65)] ${
            open ? 'rotate-90' : ''
          }`}
        >
          {!open && (
            <span className="absolute inset-0 rounded-full bg-forest/40 animate-ping opacity-40" />
          )}
          <span className="relative">
            {open ? (
              <FiX size={20} strokeWidth={2.6} />
            ) : (
              <FiMessageCircle size={22} strokeWidth={2.4} />
            )}
          </span>
        </button>
      </div>

      {/* Panel */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 hidden bg-black/25 backdrop-blur-sm sm:block"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div
            ref={rootRef}
            role="dialog"
            aria-label="Support chat"
            aria-modal="true"
            className="
              chat-panel fixed z-50 flex flex-col overflow-hidden bg-white shadow-[0_40px_80px_-24px_rgba(11,31,51,0.55)]
              inset-x-0 bottom-0 w-full rounded-t-3xl border-t border-line
              sm:inset-auto sm:right-6 sm:bottom-24 sm:w-[400px] sm:rounded-3xl sm:border
            "
            style={{
              height: 'min(85svh, 620px)',
              maxHeight: 'calc(100svh - 1rem)',
            }}
          >
            {/* Header */}
            <div className="relative flex-none overflow-hidden bg-gradient-to-br from-[#0B7A5A] via-[#0A6B4E] to-[#065C42] px-4 pb-4 pt-4 text-white sm:px-5 sm:pb-5 sm:pt-5">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.15]"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 90% 0%, rgba(255,255,255,0.6), transparent 45%), radial-gradient(circle at 0% 100%, rgba(245,185,66,0.5), transparent 45%)',
                }}
              />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="relative grid h-10 w-10 flex-none place-items-center rounded-2xl bg-white/15 backdrop-blur sm:h-11 sm:w-11">
                    <FiMessageCircle size={18} />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#7CF0C0] ring-2 ring-[#0A6B4E]" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-[0.95rem] font-bold leading-tight sm:text-[1rem]">
                      Chametu Assistant
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[0.68rem] text-white/75 sm:text-[0.72rem]">
                      <span className="relative flex h-1.5 w-1.5 flex-none">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7CF0C0] opacity-70" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#7CF0C0]" />
                      </span>
                      <span className="truncate">
                        Instant answers. Escalate anytime.
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {session && messages.length > 1 && (
                    <button
                      onClick={startNew}
                      className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
                      aria-label="Start new chat"
                      title="Start new chat"
                    >
                      <FiRotateCcw size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
                    aria-label="Close"
                  >
                    <FiX size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={bodyRef}
              className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4"
            >
              {!isAuthenticated && (
                <div className="rounded-xl bg-paper p-4 text-center text-sm text-ink-soft">
                  Please log in to start a chat. Or reach us on WhatsApp.
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center py-8">
                  <FiLoader className="animate-spin text-forest" size={20} />
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[0.78rem] text-red-700">
                  {error}
                </div>
              )}

              {messages.map((m) => (
                <div key={m.id}>
                  {m.sender === 'bot' ? (
                    <div className="flex items-start gap-2.5">
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-forest/10 text-forest">
                        <FiMessageCircle size={14} />
                      </span>
                      <div className="min-w-0 max-w-[85%]">
                        <div className="rounded-2xl rounded-tl-md bg-paper px-3.5 py-2.5">
                          <p className="whitespace-pre-wrap text-[0.8rem] leading-relaxed text-ink-soft">
                            {m.body}
                          </p>
                        </div>
                        {m.link && (
                          <Link
                            to={m.link}
                            onClick={() => setOpen(false)}
                            className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-forest/10 px-2.5 py-1 text-[0.72rem] font-semibold text-forest transition hover:bg-forest/15"
                          >
                            {m.linkText || 'Open'} <FiArrowRight size={11} />
                          </Link>
                        )}
                        {m.matchedEntry && m.matchedEntry !== '__end__' && !m.isEnd && (
                          <div className="mt-1.5 flex items-center gap-1">
                            <button
                              onClick={() => sendFeedback(m.id, 'up')}
                              aria-label="Helpful"
                              className={`grid h-6 w-6 place-items-center rounded-md transition ${
                                m.feedback === 'up'
                                  ? 'bg-forest/15 text-forest'
                                  : 'text-ink-soft/60 hover:bg-paper hover:text-forest'
                              }`}
                            >
                              <FiThumbsUp size={11} />
                            </button>
                            <button
                              onClick={() => sendFeedback(m.id, 'down')}
                              aria-label="Not helpful"
                              className={`grid h-6 w-6 place-items-center rounded-md transition ${
                                m.feedback === 'down'
                                  ? 'bg-red-500/15 text-red-600'
                                  : 'text-ink-soft/60 hover:bg-paper hover:text-red-600'
                              }`}
                            >
                              <FiThumbsDown size={11} />
                            </button>
                            {m.feedback && (
                              <span className="text-[0.66rem] text-ink-soft">
                                Thanks for the feedback
                              </span>
                            )}
                          </div>
                        )}
                        {m.isEnd && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            <button
                              onClick={startNew}
                              className="inline-flex items-center gap-1 rounded-lg bg-forest px-2.5 py-1 text-[0.72rem] font-semibold text-white transition hover:bg-forest-dark"
                            >
                              <FiRotateCcw size={11} /> Start new chat
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-forest px-3.5 py-2.5 text-[0.82rem] leading-relaxed text-white">
                        {m.body}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {suggestions.length > 0 && !ended && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      disabled={sending}
                      className="rounded-full border border-line bg-white px-2.5 py-1 text-[0.72rem] font-medium text-navy transition hover:border-forest/40 hover:bg-forest/[0.04] disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {sending && (
                <div className="flex items-start gap-2.5">
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-forest/10 text-forest">
                    <FiMessageCircle size={14} />
                  </span>
                  <div className="rounded-2xl rounded-tl-md bg-paper px-3.5 py-3">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-soft/60" />
                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-soft/60"
                        style={{ animationDelay: '120ms' }}
                      />
                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-soft/60"
                        style={{ animationDelay: '240ms' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {ended && (
                <div className="pt-1 text-center text-[0.7rem] font-semibold uppercase tracking-wider text-ink-soft">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1">
                    <FiStar size={10} /> Chat ended
                  </span>
                </div>
              )}
            </div>

            {/* Escalation strip */}
            <div className="flex-none border-t border-line bg-paper/60 px-3 py-2.5 sm:px-4">
              <p className="text-[0.62rem] font-bold uppercase tracking-wider text-ink-soft">
                Need a human?
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                    'Hi Chametu team, I need help with'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-2.5 py-1.5 text-[0.7rem] font-semibold text-white transition hover:bg-[#1EB857] sm:px-3 sm:text-[0.72rem]"
                >
                  <FaWhatsapp size={11} /> WhatsApp
                </a>
                <a
                  href={`tel:${PHONE_DISPLAY.replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1.5 text-[0.7rem] font-semibold text-navy transition hover:border-forest/40 sm:px-3 sm:text-[0.72rem]"
                >
                  <FiPhone size={11} /> Call
                </a>
                <a
                  href={`mailto:${EMAIL}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1.5 text-[0.7rem] font-semibold text-navy transition hover:border-forest/40 sm:px-3 sm:text-[0.72rem]"
                >
                  <FiMail size={11} /> Email
                </a>
              </div>
            </div>

            {/* Input */}
            <form
              onSubmit={submit}
              className="flex-none border-t border-line bg-white px-3 py-2.5 sm:px-3"
            >
              <div className="flex items-end gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    ended
                      ? 'Chat ended. Tap New chat above.'
                      : !isAuthenticated
                      ? 'Log in to chat'
                      : 'Ask a question'
                  }
                  disabled={ended || !isAuthenticated || sending}
                  className={`w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[0.84rem] text-navy outline-none focus:border-forest ${
                    ended || !isAuthenticated ? 'cursor-not-allowed opacity-60' : ''
                  }`}
                  aria-label="Ask a question"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || ended || !isAuthenticated || sending}
                  className={`grid h-10 w-10 flex-none place-items-center rounded-xl text-white transition ${
                    input.trim() && !ended && isAuthenticated && !sending
                      ? 'bg-forest hover:bg-forest-dark'
                      : 'cursor-not-allowed bg-line'
                  }`}
                  aria-label="Send"
                >
                  {sending ? (
                    <FiLoader size={14} className="animate-spin" />
                  ) : (
                    <FiSend size={14} />
                  )}
                </button>
              </div>
              <p className="mt-1.5 flex items-center justify-between gap-2 text-[0.62rem] text-ink-soft">
                <span className="flex items-center gap-1">
                  <FiCheckCircle size={9} className="text-forest" />
                  Never share your M-Pesa PIN.
                </span>
                {session && messages.length > 1 && !ended && (
                  <button
                    type="button"
                    onClick={endChat}
                    className="flex items-center gap-1 text-forest hover:underline"
                  >
                    <FiCheckCircle size={9} /> End chat
                  </button>
                )}
              </p>
            </form>
          </div>
        </>
      )}
    </>
  )
}