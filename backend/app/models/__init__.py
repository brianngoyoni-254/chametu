# app/models/__init__.py
from .user import User, SuperAdmin
from .chama import Chama, Member, ChamaSettings, Role  # <-- Added Role
from .finance import (
    Loan, Invoice, Transaction, WelfareClaim, Meeting,
    Proposal, MemberVote, Asset, Payout, PayoutOrder,
)
from .invite import Invite
from .support import Ticket, TicketMessage
from .settings import PlatformSettings  # <-- Added PlatformSettings
from .rewards import (
    TierConfig, ChamaSubscription, Reward,
    PointLot, PointLedgerEntry, RewardRedemption,
)
from .ledger import (
    SavingsLedger, Payment, WelfareContribution, AuditLogEntry,
)
from .contribution import Contribution, MemberInvite
from .billing import SubscriptionPayment
from .pending_signup import PendingSignup
from .notification import (
    Notification, NotificationPreference, NotificationReadReceipt,
)