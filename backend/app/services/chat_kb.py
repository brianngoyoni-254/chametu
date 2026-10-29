# app/services/chat_kb.py
"""Rule-based knowledge base for the Chametu live chat.

The KB lives server-side so it can be updated without a frontend deploy,
and so the same answers are available to any channel (web, WhatsApp, email).
"""

WHATSAPP_NUMBER = '254110279735'
WHATSAPP_DISPLAY = '+254 110 279 735'
PHONE_DISPLAY = '+254 110 279 735'
EMAIL = 'support@chametu.co.ke'

SUGGESTIONS = [
    'How do I create a chama?',
    'How much does it cost?',
    'How does M-Pesa work?',
    'I forgot my password',
    'How do loans work?',
]

WELCOME = 'Hi. I am the Chametu assistant. Ask me anything, or pick a topic below.'

END_MESSAGE = (
    'Thanks for chatting with us. If you need anything else, '
    'start a new chat any time — a human is always one tap away.'
)

FOLLOW_UP = 'Anything else I can help with?'

FALLBACK = {
    'title': 'Let me get a person to help',
    'body': (
        'I do not have a ready answer for that one. Our team will help you directly.\n\n'
        f'WhatsApp: {WHATSAPP_DISPLAY}\n'
        f'Phone: {PHONE_DISPLAY}\n'
        f'Email: {EMAIL}'
    ),
}


KB = [
    # ---------- Getting started ----------
    {
        'id': 'create-chama',
        'keywords': ['create', 'register', 'sign up', 'signup', 'start', 'set up', 'setup',
                     'new chama', 'onboard', 'get started'],
        'title': 'Creating your chama',
        'body': (
            'Open the "Create your chama" page and pick a plan. Fill in your chama name, '
            'size, and contribution rules. You can invite members straight after sign-up.\n\n'
            'The whole process takes about 2 minutes. No card is required on the Starter plan.'
        ),
        'link': '/register',
        'link_text': 'Create your chama',
    },
    {
        'id': 'what-is-chametu',
        'keywords': ['what is chametu', 'about chametu', 'who are you',
                     'what do you do', 'explain chametu'],
        'title': 'What Chametu is',
        'body': (
            'Chametu is a secure ledger for Kenyan chamas, SACCOs, and investment groups.\n\n'
            'It replaces WhatsApp groups, notebooks, and spreadsheets with one dashboard for '
            'contributions, M-Pesa payments, loans, savings, welfare, investments, meetings, and reports.\n\n'
            'Every official and every member sees the same numbers.'
        ),
        'link': '/',
        'link_text': 'Learn more',
    },
    {
        'id': 'who-is-it-for',
        'keywords': ['who is it for', 'is it for sacco', 'chama size', 'small group',
                     'large group', 'investment group'],
        'title': 'Who Chametu is for',
        'body': (
            'Chametu works for any savings group in Kenya, from 5 members to 500 or more.\n\n'
            'It is built for merry-go-rounds, investment chamas, welfare groups, '
            'land-buying groups, and SACCOs.\n\n'
            'If your group pools money and makes decisions together, Chametu fits.'
        ),
    },

    # ---------- Pricing ----------
    {
        'id': 'pricing',
        'keywords': ['price', 'pricing', 'cost', 'plan', 'tier', 'subscription',
                     'billing', 'how much', 'starter', 'growth', 'business', 'gold'],
        'title': 'Plans and pricing',
        'body': (
            'Starter is free for up to 10 members.\n'
            'Growth is KSh 500 per month.\n'
            'Business is KSh 1,000 per month.\n'
            'Gold is KSh 2,000 per month for larger groups.\n\n'
            'Only the chama pays. Members never pay to use Chametu. '
            'You can upgrade, downgrade, or cancel anytime from settings.'
        ),
        'link': '/rewards/plans',
        'link_text': 'See all plans',
    },
    {
        'id': 'payment-methods-subscription',
        'keywords': ['pay subscription', 'pay bill', 'how do i pay for chametu',
                     'billing method', 'card', 'mpesa subscription'],
        'title': 'Paying for your subscription',
        'body': (
            'You can pay your Chametu subscription via M-Pesa (Paybill 400200, account CHAMETU), '
            'bank transfer, or card.\n\n'
            'Invoices are sent to the chama chair and treasurer on the 1st of each month, '
            'and payment is due within 7 days.'
        ),
    },
    {
        'id': 'trial',
        'keywords': ['trial', 'try', 'free trial', 'tester', 'test', 'before i pay'],
        'title': 'Free trial',
        'body': (
            'Starter is free forever for up to 10 members. No trial period, no card required.\n\n'
            'For larger chamas, we offer a 14 day trial on Growth and Business. '
            'Contact us to set it up.'
        ),
        'link': '/register',
        'link_text': 'Start free',
    },
    {
        'id': 'upgrade-downgrade',
        'keywords': ['upgrade', 'downgrade', 'change plan', 'switch plan', 'more members'],
        'title': 'Upgrading or downgrading',
        'body': (
            'Open Settings and then Plans. Choose the new tier and confirm.\n\n'
            'If you upgrade mid month, we prorate the difference. If you downgrade, '
            'the change takes effect at the end of the current billing cycle.\n\n'
            'No data is lost when you change plans.'
        ),
        'link': '/dashboard/settings',
        'link_text': 'Open Settings',
    },

    # ---------- Members ----------
    {
        'id': 'invite',
        'keywords': ['invite', 'member', 'add member', 'join', 'link', 'sms', 'onboard member'],
        'title': 'Inviting members',
        'body': (
            'From your dashboard, open Invite Members. Enter a phone number or email and pick a '
            'role: Member, Secretary, Treasurer, or Chairperson.\n\n'
            'We send a unique join link. Each link only works for your chama. '
            'You can also copy the link and share it via WhatsApp.'
        ),
        'link': '/dashboard/invite',
        'link_text': 'Open Invite Members',
    },
    {
        'id': 'member-limit',
        'keywords': ['member limit', 'how many members', 'maximum members', 'cap'],
        'title': 'Member limits',
        'body': (
            'Each plan has a member limit.\n'
            'Starter: up to 10 members.\n'
            'Growth: up to 25 members.\n'
            'Business: up to 50 members.\n'
            'Gold: unlimited.\n\n'
            'Members who are inactive or invited but not yet joined do not count towards the limit.'
        ),
    },
    {
        'id': 'roles',
        'keywords': ['role', 'permission', 'chairman', 'chairperson', 'treasurer',
                     'secretary', 'admin', 'who can'],
        'title': 'Roles and permissions',
        'body': (
            'Chairperson: approves loans, locks meeting minutes, manages settings.\n'
            'Treasurer: records payments, approves welfare claims, runs statements.\n'
            'Secretary: manages meetings, minutes, and voting.\n'
            'Member: sees their own records and votes on proposals.\n\n'
            "You can change anyone's role from the Members page."
        ),
        'link': '/dashboard/members',
        'link_text': 'Open Members',
    },
    {
        'id': 'remove-member',
        'keywords': ['remove member', 'delete member', 'deactivate', 'kick', 'leave chama'],
        'title': 'Removing or deactivating a member',
        'body': (
            "From the Members page, open the member's menu and choose Deactivate. "
            'Their history is kept and they lose access.\n\n'
            'To remove someone permanently, choose Remove from chama. This cannot be undone.'
        ),
        'link': '/dashboard/members',
        'link_text': 'Open Members',
    },
    {
        'id': 'member-leave',
        'keywords': ['i want to leave', 'leave the chama', 'exit chama', 'quit'],
        'title': 'Leaving a chama',
        'body': (
            'If you are a member and want to leave, contact your chama chair or treasurer. '
            'They can deactivate your account.\n\n'
            'Your savings and history remain with the chama until they are settled with you directly.'
        ),
    },

    # ---------- Payments ----------
    {
        'id': 'mpesa',
        'keywords': ['mpesa', 'm-pesa', 'paybill', 'stk', 'payment', 'pay',
                     'contribution', 'deposit'],
        'title': 'M-Pesa payments',
        'body': (
            "Members pay into your chama's Paybill using their own phone. "
            'Our system matches each payment to the right member automatically, '
            'so no spreadsheets are needed.\n\n'
            'If a payment shows as unmatched on your dashboard, tap Match and select the member.'
        ),
        'link': '/dashboard/payments',
        'link_text': 'Open Payments Tracker',
    },
    {
        'id': 'unmatched',
        'keywords': ['unmatched', 'not matched', 'wrong member', 'match payment',
                     'unknown sender'],
        'title': 'Matching an unmatched payment',
        'body': (
            'Open Payments Tracker. Find the payment labelled Unmatched. '
            'Tap Match, pick the member, and confirm.\n\n'
            "From that moment the payment appears in the member's contribution and statement history."
        ),
        'link': '/dashboard/payments',
        'link_text': 'Open Payments Tracker',
    },
    {
        'id': 'bank',
        'keywords': ['bank', 'cash', 'manual payment', 'offline payment'],
        'title': 'Recording bank or cash payments',
        'body': (
            'Open Payments Tracker and choose Record Payment. '
            'Pick the channel (bank or cash), enter the amount and reference, and save.\n\n'
            "The entry appears in the member's statement exactly like an M-Pesa payment."
        ),
        'link': '/dashboard/payments',
        'link_text': 'Open Payments Tracker',
    },
    {
        'id': 'payment-missing',
        'keywords': ['payment missing', 'paid but not showing', 'money not received',
                     'transaction not recorded'],
        'title': 'Paid but payment not showing',
        'body': (
            'M-Pesa payments usually appear within 30 seconds. '
            'If yours is missing after 5 minutes, do these three things.\n\n'
            '1. Check your M-Pesa message for the transaction code.\n'
            '2. Open Payments Tracker and search by that code.\n'
            '3. If it is still missing, contact us with the code and your phone number.\n\n'
            'We will match it manually within 1 working day.'
        ),
    },
    {
        'id': 'refund',
        'keywords': ['refund', 'money back', 'wrong payment', 'sent twice', 'double payment'],
        'title': 'Refunds and reversals',
        'body': (
            'If a payment was sent twice or to the wrong chama, contact us immediately.\n\n'
            'For M-Pesa errors, we can request a reversal with Safaricom. '
            'Reversals usually complete within 3 working days.\n\n'
            'For subscription overpayments, we credit your account automatically.'
        ),
    },

    # ---------- Contributions ----------
    {
        'id': 'contribution-rules',
        'keywords': ['contribution rule', 'amount', 'due date', 'grace period',
                     'cycle', 'weekly', 'monthly'],
        'title': 'Contribution rules',
        'body': (
            'You can set the contribution amount, due day, grace period, and cycle '
            '(weekly, monthly, or custom) when you create the chama.\n\n'
            'To change them later, open Settings and then My Chama.'
        ),
        'link': '/dashboard/settings',
        'link_text': 'Open Settings',
    },
    {
        'id': 'missed-payment',
        'keywords': ['missed payment', 'late', 'overdue', 'arrears', 'penalty', 'late fee'],
        'title': 'Missed or late contributions',
        'body': (
            'Members past the due date appear under Arrears on your dashboard. '
            'We send automatic reminders by SMS and WhatsApp before and after the due date.\n\n'
            'Any late fee is set by your chama, not by Chametu.'
        ),
        'link': '/dashboard/contributions',
        'link_text': 'Open Contributions',
    },

    # ---------- Loans ----------
    {
        'id': 'apply-loan',
        'keywords': ['apply', 'loan', 'borrow', 'request loan', 'credit'],
        'title': 'Applying for a loan',
        'body': (
            'Open My Loan from the member portal. Enter the amount and purpose, and submit. '
            'The committee is notified instantly.\n\n'
            "The available limit is your savings multiplied by your chama's loan multiple (usually 3x)."
        ),
        'link': '/member/loans',
        'link_text': 'Open My Loan',
    },
    {
        'id': 'approve-loan',
        'keywords': ['approve loan', 'review loan', 'committee loan',
                     'treasurer loan', 'reject loan'],
        'title': 'Approving or rejecting a loan',
        'body': (
            'Loan applications appear on the Loans page with a Pending status. '
            'Tap Approve or Reject. The applicant is notified immediately and their balance updates.\n\n'
            "Rejections do not affect the member's available limit."
        ),
        'link': '/dashboard/loans',
        'link_text': 'Open Loans',
    },
    {
        'id': 'repay-loan',
        'keywords': ['repay', 'repayment', 'loan repayment', 'pay back', 'clear loan'],
        'title': 'Repaying a loan',
        'body': (
            'Open My Loan and tap Repay loan. Choose 25 percent, 50 percent, full amount, '
            'or enter your own amount. Pick the payment method (M-Pesa, bank, or cash) and confirm.\n\n'
            'Your balance updates in real time. When you reach zero, the loan is marked repaid.'
        ),
        'link': '/member/loans',
        'link_text': 'Open My Loan',
    },
    {
        'id': 'overdue-loan',
        'keywords': ['overdue loan', 'default', 'missed repayment'],
        'title': 'Overdue loans',
        'body': (
            'Loans past their due date appear under Overdue. '
            'The committee sees them first and contacts the member directly.\n\n'
            'Chametu does not take action against members. This is entirely up to your chama.'
        ),
        'link': '/dashboard/loans',
        'link_text': 'Open Loans',
    },
    {
        'id': 'loan-eligibility',
        'keywords': ['loan limit', 'how much can i borrow', 'loan multiple', 'eligibility'],
        'title': 'Loan eligibility',
        'body': (
            "Your loan limit is your savings multiplied by your chama's loan multiple. "
            'Most chamas use 3x, so KSh 10,000 in savings means a KSh 30,000 limit.\n\n'
            'You can only have one active loan at a time. '
            'Pending and rejected applications do not reduce your available limit.'
        ),
    },
    {
        'id': 'guarantor',
        'keywords': ['guarantor', 'guarantee', 'who guarantees', 'guarantor loan'],
        'title': 'Guarantors',
        'body': (
            'Some chamas require one or more guarantors before a loan is approved. '
            "This is set by your chama's rules, not by Chametu.\n\n"
            'If your chama uses guarantors, they are shown on the loan application and '
            'must approve before the loan is approved.'
        ),
    },

    # ---------- Savings ----------
    {
        'id': 'savings',
        'keywords': ['saving', 'savings', 'withdraw', 'withdrawal', 'balance'],
        'title': 'Member savings',
        'body': (
            "Each member's savings grow with every contribution. "
            'Members can view their savings from My Savings in the portal.\n\n'
            'Withdrawals require approval from the committee. '
            'The request appears on the Savings page for admins.'
        ),
        'link': '/member/savings',
        'link_text': 'Open My Savings',
    },

    # ---------- Welfare ----------
    {
        'id': 'welfare',
        'keywords': ['welfare', 'welfare fund', 'claim', 'support fund',
                     'emergency', 'bereavement'],
        'title': 'Welfare fund',
        'body': (
            'Welfare is a separate community fund, managed by the committee. '
            'Members submit a claim with a reason and amount. The committee approves or rejects.\n\n'
            'Every approved payout appears on a shared ledger that all members can see. '
            'This keeps the fund transparent.'
        ),
        'link': '/member/welfare',
        'link_text': 'Open Welfare',
    },
    {
        'id': 'welfare-transparency',
        'keywords': ['welfare transparency', 'welfare balance', 'who claimed', 'welfare ledger'],
        'title': 'Welfare transparency',
        'body': (
            'Every member can see the total collected, total paid out, current balance, '
            "and the list of approved claims. Only the reviewer's note is private to the claimant.\n\n"
            'Open Welfare from any dashboard to see the full ledger.'
        ),
        'link': '/member/welfare',
        'link_text': 'Open Welfare',
    },

    # ---------- Investments ----------
    {
        'id': 'portfolio',
        'keywords': ['portfolio', 'invest', 'investment', 'asset', 'return', 'gain'],
        'title': 'Investments and assets',
        'body': (
            'Track everything your chama owns in one place. '
            'Add each investment (land, MMF, T-bill, shares) with the amount invested and current value.\n\n'
            "Chametu calculates gains and shows them on the portfolio page. "
            "Members can see the chama's total assets from their portal."
        ),
        'link': '/dashboard/portfolio',
        'link_text': 'Open Portfolio',
    },
    {
        'id': 'asset-register',
        'keywords': ['asset', 'assets', 'register asset', 'property', 'equipment'],
        'title': 'Asset register',
        'body': (
            'The asset register lists every physical asset your chama owns: '
            'land, equipment, vehicles, property.\n\n'
            'For each asset, record the purchase price, current value, ownership percent, '
            'and purchase date. Members can view the register but only admins can edit it.'
        ),
        'link': '/dashboard/assets',
        'link_text': 'Open Assets',
    },

    # ---------- Meetings and voting ----------
    {
        'id': 'meetings',
        'keywords': ['meeting', 'agenda', 'minutes', 'attend', 'schedule', 'lock minutes'],
        'title': 'Meetings and minutes',
        'body': (
            'Admins schedule meetings with a date, time, location, and agenda. '
            'Members see the next meeting on their dashboard.\n\n'
            'After the meeting, the secretary locks the minutes. '
            'Once locked, the record cannot be edited.'
        ),
        'link': '/dashboard/meetings',
        'link_text': 'Open Meetings',
    },
    {
        'id': 'voting',
        'keywords': ['vote', 'voting', 'proposal', 'resolution', 'poll'],
        'title': 'Voting on proposals',
        'body': (
            'The committee opens a proposal with a title, description, and closing date. '
            'Every member sees it in Voting and gets one vote.\n\n'
            'Results update live. Once a member votes, they cannot change it.'
        ),
        'link': '/dashboard/voting',
        'link_text': 'Open Voting',
    },

    # ---------- Payout rotation ----------
    {
        'id': 'rotation',
        'keywords': ['rotation', 'merry-go-round', 'payout', 'turn', 'receive'],
        'title': 'Payout rotation',
        'body': (
            'If your chama runs a merry-go-round, Chametu tracks the order. '
            'Each member sees whose turn it is and the amount they will receive.\n\n'
            'When the treasurer marks a payout as paid, the rotation moves to the next member automatically.'
        ),
        'link': '/dashboard/payouts',
        'link_text': 'Open Payout Rotation',
    },

    # ---------- Reports ----------
    {
        'id': 'statements',
        'keywords': ['statement', 'report', 'pdf', 'download', 'export', 'csv'],
        'title': 'Statements and reports',
        'body': (
            'From Statements you can download a print-ready statement for any member, '
            'for any month. From Reports you can generate income, loans, investments, '
            'attendance, and member activity reports.\n\n'
            'All reports download as PDF and CSV.'
        ),
        'link': '/dashboard/statements',
        'link_text': 'Open Statements',
    },

    # ---------- Support and account ----------
    {
        'id': 'login',
        'keywords': ['login', 'log in', 'sign in', 'password', 'forgot', 'reset',
                     'access', 'cannot log'],
        'title': 'Signing in or resetting your password',
        'body': (
            'Use the same phone number or email you signed up with. '
            'If you have forgotten your password, tap Forgot password on the sign in page and '
            'we will send a reset link.\n\n'
            f'Still stuck? Call us on {PHONE_DISPLAY} or email {EMAIL}.'
        ),
        'link': '/login',
        'link_text': 'Go to sign in',
    },
    {
        'id': 'change-phone',
        'keywords': ['change phone', 'update phone', 'new number', 'change email'],
        'title': 'Changing your phone or email',
        'body': (
            'Open Settings and then Profile. Update your phone or email and save. '
            'Your sign in details change immediately.\n\n'
            'If the change fails, contact us with your old and new details.'
        ),
        'link': '/dashboard/settings',
        'link_text': 'Open Settings',
    },
    {
        'id': 'support-ticket',
        'keywords': ['support', 'ticket', 'issue', 'bug', 'problem', 'not working', 'broken'],
        'title': 'Reporting an issue',
        'body': (
            'From any dashboard, open Support. Describe the issue, pick a category and priority, '
            'and submit. Your ticket goes straight to our team and to your chama\'s superadmin.\n\n'
            'We reply to most tickets within 4 hours during business days.'
        ),
        'link': '/dashboard/support',
        'link_text': 'Open Support',
    },
    {
        'id': 'security',
        'keywords': ['security', 'safe', 'data', 'privacy', 'encrypt', 'backup',
                     'audit', 'gdpr', 'data protection'],
        'title': 'Security and data',
        'body': (
            'Everything is encrypted in transit and at rest. '
            "Only your chama's officials can view your data.\n\n"
            'Every action, including payments, approvals, and settings changes, '
            'is written to an audit log that cannot be silently edited.\n\n'
            'We follow the Kenya Data Protection Act 2019.'
        ),
        'link': '/privacy',
        'link_text': 'Read the privacy policy',
    },
    {
        'id': 'data-export',
        'keywords': ['export data', 'download data', 'my data', 'get my records'],
        'title': 'Exporting your data',
        'body': (
            "Every admin can export the chama's data as CSV, Excel, or PDF from the Reports page.\n\n"
            'Individual members can download their own statements from My Profile. '
            f'If you need a full data export, email {EMAIL} and we will send it within 5 working days.'
        ),
        'link': '/dashboard/reports',
        'link_text': 'Open Reports',
    },
    {
        'id': 'delete-account',
        'keywords': ['delete account', 'close account', 'cancel account', 'remove chama'],
        'title': 'Deleting your chama or account',
        'body': (
            f'To delete your entire chama and all its data, email {EMAIL} '
            'from the address registered to the chama chair.\n\n'
            'We will confirm within 2 working days and delete everything except records '
            'we are legally required to keep for 7 years.'
        ),
    },
    {
        'id': 'offline',
        'keywords': ['offline', 'no internet', 'works offline', 'slow internet'],
        'title': 'Offline and slow connections',
        'body': (
            'Chametu works on any 3G or 4G connection. '
            'Pages load in under 2 seconds on a normal mobile data connection.\n\n'
            'If you use Chametu offline, your actions are queued and synced automatically '
            'when the connection returns.'
        ),
    },
    {
        'id': 'mobile-app',
        'keywords': ['app', 'mobile app', 'android', 'ios', 'iphone', 'install'],
        'title': 'Is there a mobile app',
        'body': (
            'Chametu is a web app, so it works on any phone browser without installing anything.\n\n'
            'You can add it to your home screen for a native app experience. '
            'On Android, tap the menu and choose Add to Home Screen. '
            'On iPhone, tap Share and then Add to Home Screen.'
        ),
    },
    {
        'id': 'multiple-chamas',
        'keywords': ['multiple chama', 'two chamas', 'join another chama',
                     'belong to more than one'],
        'title': 'Belonging to more than one chama',
        'body': (
            'Yes, you can belong to more than one chama. '
            'Sign in once and switch between your chamas from the account menu.\n\n'
            'Each chama has its own dashboard, records, and members.'
        ),
    },
    {
        'id': 'demo',
        'keywords': ['demo', 'sacco', 'walkthrough', 'show me', 'sales', 'call me'],
        'title': 'Requesting a demo',
        'body': (
            'We run 30 minute walkthroughs for SACCOs and larger chamas. '
            f'Use the contact form and tick Request a demo, or call us on {PHONE_DISPLAY}.\n\n'
            'We will send you a slot within one business day.'
        ),
        'link': '/contact',
        'link_text': 'Book a demo',
    },

    # ---------- Human escalation ----------
    {
        'id': 'human',
        'keywords': ['human', 'agent', 'person', 'talk to someone', 'call', 'contact',
                     'phone', 'whatsapp', 'urgent', 'help now', 'speak'],
        'title': 'Talking to a person',
        'body': (
            'You can reach our team directly.\n\n'
            f'WhatsApp: {WHATSAPP_DISPLAY}\n'
            f'Phone: {PHONE_DISPLAY}\n'
            f'Email: {EMAIL}\n\n'
            'We are available Monday to Friday, 9am to 6pm EAT. '
            'For urgent issues, WhatsApp is fastest.'
        ),
    },
]


def find_answer(query):
    """Return the best-matching KB entry, or None if nothing matches."""
    if not query:
        return None
    q = query.strip().lower()
    if not q:
        return None

    best = None
    best_score = 0
    for entry in KB:
        score = 0
        for kw in entry['keywords']:
            if kw in q:
                score += len(kw)
        if score > best_score:
            best_score = score
            best = entry

    return best if best_score > 0 else None