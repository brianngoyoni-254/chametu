import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiMessageCircle, FiX, FiSend, FiMail, FiPhone, FiArrowRight,
  FiCheckCircle, FiClock, FiUsers, FiThumbsUp, FiThumbsDown,
  FiTrash2, FiRotateCcw, FiStar,
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'

/* ============================================================
   CONFIG
   ============================================================ */
const WHATSAPP_NUMBER = '254110279735'
const WHATSAPP_DISPLAY = '+254 110 279 735'
const PHONE_DISPLAY = '+254 110 279 735'
const EMAIL = 'support@chametu.co.ke'

const STORAGE_KEY = 'chametu_chat_history_v1'

/* ============================================================
   KNOWLEDGE BASE
   ============================================================ */
const KB = [
  /* ---------- Getting started ---------- */
  {
    id: 'create-chama',
    keywords: ['create', 'register', 'sign up', 'signup', 'start', 'set up', 'setup', 'new chama', 'onboard', 'get started'],
    title: 'Creating your chama',
    body: `Open the "Create your chama" page and pick a plan. Fill in your chama name, size, and contribution rules. You can invite members straight after sign-up.

The whole process takes about 2 minutes. No card is required on the Starter plan.`,
    link: '/register',
    linkText: 'Create your chama',
  },
  {
    id: 'what-is-chametu',
    keywords: ['what is chametu', 'about chametu', 'who are you', 'what do you do', 'explain chametu'],
    title: 'What Chametu is',
    body: `Chametu is a secure ledger for Kenyan chamas, SACCOs, and investment groups.

It replaces WhatsApp groups, notebooks, and spreadsheets with one dashboard for contributions, M-Pesa payments, loans, savings, welfare, investments, meetings, and reports.

Every official and every member sees the same numbers.`,
    link: '/',
    linkText: 'Learn more',
  },
  {
    id: 'who-is-it-for',
    keywords: ['who is it for', 'is it for sacco', 'chama size', 'small group', 'large group', 'investment group'],
    title: 'Who Chametu is for',
    body: `Chametu works for any savings group in Kenya, from 5 members to 500 or more.

It is built for merry-go-rounds, investment chamas, welfare groups, land-buying groups, and SACCOs.

If your group pools money and makes decisions together, Chametu fits.`,
  },

  /* ---------- Pricing ---------- */
  {
    id: 'pricing',
    keywords: ['price', 'pricing', 'cost', 'plan', 'tier', 'subscription', 'billing', 'how much', 'starter', 'growth', 'business', 'gold'],
    title: 'Plans and pricing',
    body: `Starter is free for up to 10 members.
Growth is KSh 500 per month.
Business is KSh 1,000 per month.
Gold is KSh 2,000 per month for larger groups.

Only the chama pays. Members never pay to use Chametu. You can upgrade, downgrade, or cancel anytime from settings.`,
    link: '/rewards/plans',
    linkText: 'See all plans',
  },
  {
    id: 'payment-methods-subscription',
    keywords: ['pay subscription', 'pay bill', 'how do i pay for chametu', 'billing method', 'card', 'mpesa subscription'],
    title: 'Paying for your subscription',
    body: `You can pay your Chametu subscription via M-Pesa (Paybill 400200, account CHAMETU), bank transfer, or card.

Invoices are sent to the chama chair and treasurer on the 1st of each month, and payment is due within 7 days.`,
  },
  {
    id: 'trial',
    keywords: ['trial', 'try', 'free trial', 'tester', 'test', 'before i pay'],
    title: 'Free trial',
    body: `Starter is free forever for up to 10 members. No trial period, no card required.

For larger chamas, we offer a 14 day trial on Growth and Business. Contact us to set it up.`,
    link: '/register',
    linkText: 'Start free',
  },
  {
    id: 'upgrade-downgrade',
    keywords: ['upgrade', 'downgrade', 'change plan', 'switch plan', 'more members'],
    title: 'Upgrading or downgrading',
    body: `Open Settings and then Plans. Choose the new tier and confirm.

If you upgrade mid month, we prorate the difference. If you downgrade, the change takes effect at the end of the current billing cycle.

No data is lost when you change plans.`,
    link: '/dashboard/settings',
    linkText: 'Open Settings',
  },

  /* ---------- Members ---------- */
  {
    id: 'invite',
    keywords: ['invite', 'member', 'add member', 'join', 'link', 'sms', 'onboard member'],
    title: 'Inviting members',
    body: `From your dashboard, open Invite Members. Enter a phone number or email and pick a role: Member, Secretary, Treasurer, or Chairperson.

We send a unique join link. Each link only works for your chama. You can also copy the link and share it via WhatsApp.`,
    link: '/dashboard/invite',
    linkText: 'Open Invite Members',
  },
  {
    id: 'member-limit',
    keywords: ['member limit', 'how many members', 'maximum members', 'cap'],
    title: 'Member limits',
    body: `Each plan has a member limit.
Starter: up to 10 members.
Growth: up to 25 members.
Business: up to 50 members.
Gold: unlimited.

Members who are inactive or invited but not yet joined do not count towards the limit.`,
  },
  {
    id: 'roles',
    keywords: ['role', 'permission', 'chairman', 'chairperson', 'treasurer', 'secretary', 'admin', 'who can'],
    title: 'Roles and permissions',
    body: `Chairperson: approves loans, locks meeting minutes, manages settings.
Treasurer: records payments, approves welfare claims, runs statements.
Secretary: manages meetings, minutes, and voting.
Member: sees their own records and votes on proposals.

You can change anyone's role from the Members page.`,
    link: '/dashboard/members',
    linkText: 'Open Members',
  },
  {
    id: 'remove-member',
    keywords: ['remove member', 'delete member', 'deactivate', 'kick', 'leave chama'],
    title: 'Removing or deactivating a member',
    body: `From the Members page, open the member's menu and choose Deactivate. Their history is kept and they lose access.

To remove someone permanently, choose Remove from chama. This cannot be undone.`,
    link: '/dashboard/members',
    linkText: 'Open Members',
  },
  {
    id: 'member-leave',
    keywords: ['i want to leave', 'leave the chama', 'exit chama', 'quit'],
    title: 'Leaving a chama',
    body: `If you are a member and want to leave, contact your chama chair or treasurer. They can deactivate your account.

Your savings and history remain with the chama until they are settled with you directly.`,
  },

  /* ---------- Payments ---------- */
  {
    id: 'mpesa',
    keywords: ['mpesa', 'm-pesa', 'paybill', 'stk', 'payment', 'pay', 'contribution', 'deposit'],
    title: 'M-Pesa payments',
    body: `Members pay into your chama's Paybill using their own phone. Our system matches each payment to the right member automatically, so no spreadsheets are needed.

If a payment shows as unmatched on your dashboard, tap Match and select the member.`,
    link: '/dashboard/payments',
    linkText: 'Open Payments Tracker',
  },
  {
    id: 'unmatched',
    keywords: ['unmatched', 'not matched', 'wrong member', 'match payment', 'unknown sender'],
    title: 'Matching an unmatched payment',
    body: `Open Payments Tracker. Find the payment labelled Unmatched. Tap Match, pick the member, and confirm.

From that moment the payment appears in the member's contribution and statement history.`,
    link: '/dashboard/payments',
    linkText: 'Open Payments Tracker',
  },
  {
    id: 'bank',
    keywords: ['bank', 'cash', 'manual payment', 'offline payment'],
    title: 'Recording bank or cash payments',
    body: `Open Payments Tracker and choose Record Payment. Pick the channel (bank or cash), enter the amount and reference, and save.

The entry appears in the member's statement exactly like an M-Pesa payment.`,
    link: '/dashboard/payments',
    linkText: 'Open Payments Tracker',
  },
  {
    id: 'payment-missing',
    keywords: ['payment missing', 'paid but not showing', 'money not received', 'transaction not recorded'],
    title: 'Paid but payment not showing',
    body: `M-Pesa payments usually appear within 30 seconds. If yours is missing after 5 minutes, do these three things.

1. Check your M-Pesa message for the transaction code.
2. Open Payments Tracker and search by that code.
3. If it is still missing, contact us with the code and your phone number.

We will match it manually within 1 working day.`,
  },
  {
    id: 'refund',
    keywords: ['refund', 'money back', 'wrong payment', 'sent twice', 'double payment'],
    title: 'Refunds and reversals',
    body: `If a payment was sent twice or to the wrong chama, contact us immediately.

For M-Pesa errors, we can request a reversal with Safaricom. Reversals usually complete within 3 working days.

For subscription overpayments, we credit your account automatically.`,
  },

  /* ---------- Contributions ---------- */
  {
    id: 'contribution-rules',
    keywords: ['contribution rule', 'amount', 'due date', 'grace period', 'cycle', 'weekly', 'monthly'],
    title: 'Contribution rules',
    body: `You can set the contribution amount, due day, grace period, and cycle (weekly, monthly, or custom) when you create the chama.

To change them later, open Settings and then My Chama.`,
    link: '/dashboard/settings',
    linkText: 'Open Settings',
  },
  {
    id: 'missed-payment',
    keywords: ['missed payment', 'late', 'overdue', 'arrears', 'penalty', 'late fee'],
    title: 'Missed or late contributions',
    body: `Members past the due date appear under Arrears on your dashboard. We send automatic reminders by SMS and WhatsApp before and after the due date.

Any late fee is set by your chama, not by Chametu.`,
    link: '/dashboard/contributions',
    linkText: 'Open Contributions',
  },

  /* ---------- Loans ---------- */
  {
    id: 'apply-loan',
    keywords: ['apply', 'loan', 'borrow', 'request loan', 'credit'],
    title: 'Applying for a loan',
    body: `Open My Loan from the member portal. Enter the amount and purpose, and submit. The committee is notified instantly.

The available limit is your savings multiplied by your chama's loan multiple (usually 3x).`,
    link: '/member/loans',
    linkText: 'Open My Loan',
  },
  {
    id: 'approve-loan',
    keywords: ['approve loan', 'review loan', 'committee loan', 'treasurer loan', 'reject loan'],
    title: 'Approving or rejecting a loan',
    body: `Loan applications appear on the Loans page with a Pending status. Tap Approve or Reject. The applicant is notified immediately and their balance updates.

Rejections do not affect the member's available limit.`,
    link: '/dashboard/loans',
    linkText: 'Open Loans',
  },
  {
    id: 'repay-loan',
    keywords: ['repay', 'repayment', 'loan repayment', 'pay back', 'clear loan'],
    title: 'Repaying a loan',
    body: `Open My Loan and tap Repay loan. Choose 25 percent, 50 percent, full amount, or enter your own amount. Pick the payment method (M-Pesa, bank, or cash) and confirm.

Your balance updates in real time. When you reach zero, the loan is marked repaid.`,
    link: '/member/loans',
    linkText: 'Open My Loan',
  },
  {
    id: 'overdue-loan',
    keywords: ['overdue loan', 'default', 'missed repayment'],
    title: 'Overdue loans',
    body: `Loans past their due date appear under Overdue. The committee sees them first and contacts the member directly.

Chametu does not take action against members. This is entirely up to your chama.`,
    link: '/dashboard/loans',
    linkText: 'Open Loans',
  },
  {
    id: 'loan-eligibility',
    keywords: ['loan limit', 'how much can i borrow', 'loan multiple', 'eligibility'],
    title: 'Loan eligibility',
    body: `Your loan limit is your savings multiplied by your chama's loan multiple. Most chamas use 3x, so KSh 10,000 in savings means a KSh 30,000 limit.

You can only have one active loan at a time. Pending and rejected applications do not reduce your available limit.`,
  },
  {
    id: 'guarantor',
    keywords: ['guarantor', 'guarantee', 'who guarantees', 'guarantor loan'],
    title: 'Guarantors',
    body: `Some chamas require one or more guarantors before a loan is approved. This is set by your chama's rules, not by Chametu.

If your chama uses guarantors, they are shown on the loan application and must approve before the loan is approved.`,
  },

  /* ---------- Savings ---------- */
  {
    id: 'savings',
    keywords: ['saving', 'savings', 'withdraw', 'withdrawal', 'balance'],
    title: 'Member savings',
    body: `Each member's savings grow with every contribution. Members can view their savings from My Savings in the portal.

Withdrawals require approval from the committee. The request appears on the Savings page for admins.`,
    link: '/member/savings',
    linkText: 'Open My Savings',
  },

  /* ---------- Welfare ---------- */
  {
    id: 'welfare',
    keywords: ['welfare', 'welfare fund', 'claim', 'support fund', 'emergency', 'bereavement'],
    title: 'Welfare fund',
    body: `Welfare is a separate community fund, managed by the committee. Members submit a claim with a reason and amount. The committee approves or rejects.

Every approved payout appears on a shared ledger that all members can see. This keeps the fund transparent.`,
    link: '/member/welfare',
    linkText: 'Open Welfare',
  },
  {
    id: 'welfare-transparency',
    keywords: ['welfare transparency', 'welfare balance', 'who claimed', 'welfare ledger'],
    title: 'Welfare transparency',
    body: `Every member can see the total collected, total paid out, current balance, and the list of approved claims. Only the reviewer's note is private to the claimant.

Open Welfare from any dashboard to see the full ledger.`,
    link: '/member/welfare',
    linkText: 'Open Welfare',
  },

  /* ---------- Investments ---------- */
  {
    id: 'portfolio',
    keywords: ['portfolio', 'invest', 'investment', 'asset', 'return', 'gain'],
    title: 'Investments and assets',
    body: `Track everything your chama owns in one place. Add each investment (land, MMF, T-bill, shares) with the amount invested and current value.

Chametu calculates gains and shows them on the portfolio page. Members can see the chama's total assets from their portal.`,
    link: '/dashboard/portfolio',
    linkText: 'Open Portfolio',
  },
  {
    id: 'asset-register',
    keywords: ['asset', 'assets', 'register asset', 'property', 'equipment'],
    title: 'Asset register',
    body: `The asset register lists every physical asset your chama owns: land, equipment, vehicles, property.

For each asset, record the purchase price, current value, ownership percent, and purchase date. Members can view the register but only admins can edit it.`,
    link: '/dashboard/assets',
    linkText: 'Open Assets',
  },

  /* ---------- Meetings and voting ---------- */
  {
    id: 'meetings',
    keywords: ['meeting', 'agenda', 'minutes', 'attend', 'schedule', 'lock minutes'],
    title: 'Meetings and minutes',
    body: `Admins schedule meetings with a date, time, location, and agenda. Members see the next meeting on their dashboard.

After the meeting, the secretary locks the minutes. Once locked, the record cannot be edited.`,
    link: '/dashboard/meetings',
    linkText: 'Open Meetings',
  },
  {
    id: 'voting',
    keywords: ['vote', 'voting', 'proposal', 'resolution', 'poll'],
    title: 'Voting on proposals',
    body: `The committee opens a proposal with a title, description, and closing date. Every member sees it in Voting and gets one vote.

Results update live. Once a member votes, they cannot change it.`,
    link: '/dashboard/voting',
    linkText: 'Open Voting',
  },

  /* ---------- Payout rotation ---------- */
  {
    id: 'rotation',
    keywords: ['rotation', 'merry-go-round', 'payout', 'turn', 'receive'],
    title: 'Payout rotation',
    body: `If your chama runs a merry-go-round, Chametu tracks the order. Each member sees whose turn it is and the amount they will receive.

When the treasurer marks a payout as paid, the rotation moves to the next member automatically.`,
    link: '/dashboard/payouts',
    linkText: 'Open Payout Rotation',
  },

  /* ---------- Reports ---------- */
  {
    id: 'statements',
    keywords: ['statement', 'report', 'pdf', 'download', 'export', 'csv'],
    title: 'Statements and reports',
    body: `From Statements you can download a print-ready statement for any member, for any month. From Reports you can generate income, loans, investments, attendance, and member activity reports.

All reports download as PDF and CSV.`,
    link: '/dashboard/statements',
    linkText: 'Open Statements',
  },

  /* ---------- Support and account ---------- */
  {
    id: 'login',
    keywords: ['login', 'log in', 'sign in', 'password', 'forgot', 'reset', 'access', 'cannot log'],
    title: 'Signing in or resetting your password',
    body: `Use the same phone number or email you signed up with. If you have forgotten your password, tap Forgot password on the sign in page and we will send a reset link.

Still stuck? Call us on ${PHONE_DISPLAY} or email ${EMAIL}.`,
    link: '/login',
    linkText: 'Go to sign in',
  },
  {
    id: 'change-phone',
    keywords: ['change phone', 'update phone', 'new number', 'change email'],
    title: 'Changing your phone or email',
    body: `Open Settings and then Profile. Update your phone or email and save. Your sign in details change immediately.

If the change fails, contact us with your old and new details.`,
    link: '/dashboard/settings',
    linkText: 'Open Settings',
  },
  {
    id: 'support-ticket',
    keywords: ['support', 'ticket', 'issue', 'bug', 'problem', 'not working', 'broken'],
    title: 'Reporting an issue',
    body: `From any dashboard, open Support. Describe the issue, pick a category and priority, and submit. Your ticket goes straight to our team and to your chama's superadmin.

We reply to most tickets within 4 hours during business days.`,
    link: '/dashboard/support',
    linkText: 'Open Support',
  },
  {
    id: 'security',
    keywords: ['security', 'safe', 'data', 'privacy', 'encrypt', 'backup', 'audit', 'gdpr', 'data protection'],
    title: 'Security and data',
    body: `Everything is encrypted in transit and at rest. Only your chama's officials can view your data.

Every action, including payments, approvals, and settings changes, is written to an audit log that cannot be silently edited.

We follow the Kenya Data Protection Act 2019.`,
    link: '/privacy',
    linkText: 'Read the privacy policy',
  },
  {
    id: 'data-export',
    keywords: ['export data', 'download data', 'my data', 'get my records'],
    title: 'Exporting your data',
    body: `Every admin can export the chama's data as CSV, Excel, or PDF from the Reports page.

Individual members can download their own statements from My Profile. If you need a full data export, email ${EMAIL} and we will send it within 5 working days.`,
    link: '/dashboard/reports',
    linkText: 'Open Reports',
  },
  {
    id: 'delete-account',
    keywords: ['delete account', 'close account', 'cancel account', 'remove chama'],
    title: 'Deleting your chama or account',
    body: `To delete your entire chama and all its data, email ${EMAIL} from the address registered to the chama chair.

We will confirm within 2 working days and delete everything except records we are legally required to keep for 7 years.`,
  },
  {
    id: 'offline',
    keywords: ['offline', 'no internet', 'works offline', 'slow internet'],
    title: 'Offline and slow connections',
    body: `Chametu works on any 3G or 4G connection. Pages load in under 2 seconds on a normal mobile data connection.

If you use Chametu offline, your actions are queued and synced automatically when the connection returns.`,
  },
  {
    id: 'mobile-app',
    keywords: ['app', 'mobile app', 'android', 'ios', 'iphone', 'install'],
    title: 'Is there a mobile app',
    body: `Chametu is a web app, so it works on any phone browser without installing anything.

You can add it to your home screen for a native app experience. On Android, tap the menu and choose Add to Home Screen. On iPhone, tap Share and then Add to Home Screen.`,
  },
  {
    id: 'multiple-chamas',
    keywords: ['multiple chama', 'two chamas', 'join another chama', 'belong to more than one'],
    title: 'Belonging to more than one chama',
    body: `Yes, you can belong to more than one chama. Sign in once and switch between your chamas from the account menu.

Each chama has its own dashboard, records, and members.`,
  },
  {
    id: 'demo',
    keywords: ['demo', 'sacco', 'walkthrough', 'show me', 'sales', 'call me'],
    title: 'Requesting a demo',
    body: `We run 30 minute walkthroughs for SACCOs and larger chamas. Use the contact form and tick Request a demo, or call us on ${PHONE_DISPLAY}.

We will send you a slot within one business day.`,
    link: '/contact',
    linkText: 'Book a demo',
  },

  /* ---------- Human escalation ---------- */
  {
    id: 'human',
    keywords: ['human', 'agent', 'person', 'talk to someone', 'call', 'contact', 'phone', 'whatsapp', 'urgent', 'help now', 'speak'],
    title: 'Talking to a person',
    body: `You can reach our team directly.

WhatsApp: ${WHATSAPP_DISPLAY}
Phone: ${PHONE_DISPLAY}
Email: ${EMAIL}

We are available Monday to Friday, 9am to 6pm EAT. For urgent issues, WhatsApp is fastest.`,
  },
]

/* Starter suggestions on the welcome message */
const SUGGESTIONS = [
  'How do I create a chama?',
  'How much does it cost?',
  'How does M-Pesa work?',
  'I forgot my password',
  'How do loans work?',
]

/* Follow up prompts shown after each answer */
const FOLLOW_UPS = [
  'Was that helpful?',
  'Anything else?',
  'Ask another question, or close the chat if you are done.',
]

/* Fallback when nothing matches */
const FALLBACK = {
  title: 'Let me get a person to help',
  body: `I do not have a ready answer for that one. Our team will help you directly.

WhatsApp: ${WHATSAPP_DISPLAY}
Phone: ${PHONE_DISPLAY}
Email: ${EMAIL}`,
}

/* ------------------------------------------------------------------
   Matching
------------------------------------------------------------------ */
function findAnswer(query) {
  const q = query.trim().toLowerCase()
  if (!q) return null
  let best = null
  let bestScore = 0
  for (const entry of KB) {
    let score = 0
    for (const kw of entry.keywords) {
      if (q.includes(kw)) score += kw.length
    }
    if (score > bestScore) {
      bestScore = score
      best = entry
    }
  }
  return bestScore > 0 ? best : null
}

/* ------------------------------------------------------------------
   Storage helpers
------------------------------------------------------------------ */
function loadHistory() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistory(messages) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } catch {}
}

function clearStoredHistory() {
  try { sessionStorage.removeItem(STORAGE_KEY) } catch {}
}

/* ============================================================
   COMPONENT
   ============================================================ */
export default function LiveChat() {
  const [open, setOpen] = useState(false)
  const [dismissedTeaser, setDismissedTeaser] = useState(() => {
    try { return sessionStorage.getItem('chametu_chat_teaser') === 'dismissed' } catch { return false }
  })
  const [messages, setMessages] = useState(() => loadHistory())
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [feedback, setFeedback] = useState({})
  const [ended, setEnded] = useState(false)
  const rootRef = useRef(null)
  const bodyRef = useRef(null)

  /* Persist messages */
  useEffect(() => {
    saveHistory(messages)
  }, [messages])

  /* First open: seed welcome if empty */
  useEffect(() => {
    if (open && messages.length === 0 && !ended) {
      setMessages([
        {
          id: 'welcome',
          from: 'bot',
          text: 'Hi. I am the Chametu assistant. Ask me anything, or pick a topic below.',
          showSuggestions: true,
        },
      ])
    }
  }, [open, messages.length, ended])

  /* Escape closes */
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  /* Outside click closes (desktop only) */
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  /* Auto scroll */
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages, typing])

  const dismissTeaser = () => {
    setDismissedTeaser(true)
    try { sessionStorage.setItem('chametu_chat_teaser', 'dismissed') } catch {}
  }

  const ask = (text) => {
    const q = text.trim()
    if (!q || ended) return

    const userMsg = { id: `u-${Date.now()}`, from: 'user', text: q }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setTyping(true)

    /* Log query locally for your own review */
    try {
      const log = JSON.parse(localStorage.getItem('chametu_chat_log') || '[]')
      log.push({ q, matched: !!findAnswer(q), at: Date.now() })
      localStorage.setItem('chametu_chat_log', JSON.stringify(log.slice(-200)))
    } catch {}

    setTimeout(() => {
      const match = findAnswer(q)
      const botMsg = match
        ? {
            id: `b-${Date.now()}`,
            from: 'bot',
            title: match.title,
            text: match.body,
            link: match.link,
            linkText: match.linkText,
            showFollowUp: true,
          }
        : {
            id: `b-${Date.now()}`,
            from: 'bot',
            title: FALLBACK.title,
            text: FALLBACK.body,
            showFollowUp: true,
          }
      setMessages((m) => [...m, botMsg])
      setTyping(false)
    }, 450)
  }

  const submit = (e) => {
    e.preventDefault()
    ask(input)
  }

  const setVote = (id, vote) => {
    setFeedback((f) => ({ ...f, [id]: vote }))
  }

  const endChat = () => {
    setEnded(true)
    setMessages((m) => [
      ...m,
      {
        id: `end-${Date.now()}`,
        from: 'bot',
        text: `Thanks for chatting with us. If you need anything else, tap Clear to start fresh or reach a person using the options below.

Have a great day.`,
        isEnd: true,
      },
    ])
  }

  const continueChat = () => {
    setEnded(false)
    setMessages((m) => [
      ...m,
      {
        id: `cont-${Date.now()}`,
        from: 'bot',
        text: 'Great. What else can I help you with?',
        showSuggestions: true,
      },
    ])
  }

  const clearChat = () => {
    clearStoredHistory()
    setEnded(false)
    setFeedback({})
    setMessages([])
    /* Reseed welcome immediately */
    setTimeout(() => {
      setMessages([
        {
          id: 'welcome',
          from: 'bot',
          text: 'Hi. I am the Chametu assistant. Ask me anything, or pick a topic below.',
          showSuggestions: true,
        },
      ])
    }, 60)
  }

  const replayChat = () => {
    clearChat()
  }

  return (
    <>
      {/* ============ FLOATING BUTTON ============ */}
      <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
        {!open && !dismissedTeaser && (
          <div className="chat-teaser relative mb-3 hidden max-w-[280px] rounded-2xl border border-line bg-white p-3.5 shadow-[0_20px_50px_-20px_rgba(11,31,51,0.35)] sm:block">
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
            {open ? <FiX size={20} strokeWidth={2.6} /> : <FiMessageCircle size={22} strokeWidth={2.4} />}
          </span>
          {!open && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#25D366] px-1 text-[0.58rem] font-bold text-white ring-2 ring-white">
              1
            </span>
          )}
        </button>
      </div>

      {/* ============ CHAT PANEL ============ */}
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
                      <span className="truncate">Instant answers. Escalate anytime.</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={clearChat}
                    className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
                    aria-label="Clear chat"
                    title="Clear chat"
                  >
                    <FiTrash2 size={14} />
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
                    aria-label="Close"
                  >
                    <FiX size={15} />
                  </button>
                </div>
              </div>

              <div className="relative mt-3 flex flex-wrap gap-1.5 sm:mt-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[0.66rem] font-semibold text-white/90 backdrop-blur">
                  <FiClock size={10} /> 24 / 7
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[0.66rem] font-semibold text-white/90 backdrop-blur">
                  <FiUsers size={10} /> 1,284 chamas helped
                </span>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={bodyRef}
              className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4"
            >
              {messages.map((m) => (
                <div key={m.id}>
                  {m.from === 'bot' ? (
                    <div className="flex items-start gap-2.5">
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-forest/10 text-forest">
                        <FiMessageCircle size={14} />
                      </span>
                      <div className="min-w-0 max-w-[85%]">
                        <div className="rounded-2xl rounded-tl-md bg-paper px-3.5 py-2.5">
                          {m.title && (
                            <p className="text-[0.84rem] font-semibold text-navy">
                              {m.title}
                            </p>
                          )}
                          <p className="mt-1 whitespace-pre-wrap text-[0.8rem] leading-relaxed text-ink-soft">
                            {m.text}
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
                        {m.showSuggestions && !ended && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {SUGGESTIONS.map((s) => (
                              <button
                                key={s}
                                onClick={() => ask(s)}
                                className="rounded-full border border-line bg-white px-2.5 py-1 text-[0.72rem] font-medium text-navy transition hover:border-forest/40 hover:bg-forest/[0.04]"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                        {(m.showFollowUp || m.isEnd) && !ended && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <button
                              onClick={endChat}
                              className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-[0.72rem] font-semibold text-navy transition hover:border-forest hover:bg-forest/[0.04]"
                            >
                              <FiCheckCircle size={11} /> End chat
                            </button>
                            <button
                              onClick={continueChat}
                              className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-[0.72rem] font-semibold text-navy transition hover:border-forest hover:bg-forest/[0.04]"
                            >
                              <FiArrowRight size={11} /> Ask another
                            </button>
                          </div>
                        )}
                        {m.isEnd && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            <button
                              onClick={replayChat}
                              className="inline-flex items-center gap-1 rounded-lg bg-forest px-2.5 py-1 text-[0.72rem] font-semibold text-white transition hover:bg-forest-dark"
                            >
                              <FiRotateCcw size={11} /> Start new chat
                            </button>
                          </div>
                        )}
                        {!m.showSuggestions && !m.isEnd && !m.showFollowUp && (
                          <div className="mt-1.5 flex items-center gap-1">
                            <button
                              onClick={() => setVote(m.id, 'up')}
                              aria-label="Helpful"
                              className={`grid h-6 w-6 place-items-center rounded-md transition ${
                                feedback[m.id] === 'up'
                                  ? 'bg-forest/15 text-forest'
                                  : 'text-ink-soft/60 hover:bg-paper hover:text-forest'
                              }`}
                            >
                              <FiThumbsUp size={11} />
                            </button>
                            <button
                              onClick={() => setVote(m.id, 'down')}
                              aria-label="Not helpful"
                              className={`grid h-6 w-6 place-items-center rounded-md transition ${
                                feedback[m.id] === 'down'
                                  ? 'bg-red-500/15 text-red-600'
                                  : 'text-ink-soft/60 hover:bg-paper hover:text-red-600'
                              }`}
                            >
                              <FiThumbsDown size={11} />
                            </button>
                            {feedback[m.id] && (
                              <span className="text-[0.66rem] text-ink-soft">
                                Thanks for the feedback
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-forest px-3.5 py-2.5 text-[0.82rem] leading-relaxed text-white">
                        {m.text}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {typing && (
                <div className="flex items-start gap-2.5">
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-forest/10 text-forest">
                    <FiMessageCircle size={14} />
                  </span>
                  <div className="rounded-2xl rounded-tl-md bg-paper px-3.5 py-3">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-soft/60" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-soft/60" style={{ animationDelay: '120ms' }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-soft/60" style={{ animationDelay: '240ms' }} />
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
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi Chametu team, I need help with')}`}
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
            <form onSubmit={submit} className="flex-none border-t border-line bg-white px-3 py-2.5 sm:px-3">
              <div className="flex items-end gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={ended ? 'Chat ended. Tap Clear or Start new chat' : 'Ask a question'}
                  disabled={ended}
                  className={`w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[0.84rem] text-navy outline-none focus:border-forest ${
                    ended ? 'cursor-not-allowed opacity-60' : ''
                  }`}
                  aria-label="Ask a question"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || ended}
                  className={`grid h-10 w-10 flex-none place-items-center rounded-xl text-white transition ${
                    input.trim() && !ended
                      ? 'bg-forest hover:bg-forest-dark'
                      : 'cursor-not-allowed bg-line'
                  }`}
                  aria-label="Send"
                >
                  <FiSend size={14} />
                </button>
              </div>
              <p className="mt-1.5 flex items-center justify-between gap-2 text-[0.62rem] text-ink-soft">
                <span className="flex items-center gap-1">
                  <FiCheckCircle size={9} className="text-forest" />
                  Never share your M-Pesa PIN.
                </span>
                {messages.length > 1 && (
                  <button
                    type="button"
                    onClick={clearChat}
                    className="flex items-center gap-1 text-forest hover:underline"
                  >
                    <FiTrash2 size={9} /> Clear chat
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