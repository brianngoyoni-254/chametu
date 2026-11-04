# backend/app/routes/superadmin.py
import logging
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt
from werkzeug.security import check_password_hash
from datetime import datetime, timedelta

from app import db
from app.models.user import SuperAdmin, User
from app.models.chama import Chama, Member
from app.models.ledger import Payment, AuditLogEntry
from app.models.billing import SubscriptionPayment
from app.models.support import Ticket, TicketMessage
from app.models.settings import PlatformSettings
from app.models.chat import ChatSession
from app.services.email_service import send_email
from app.services.intasend import send_stk_push, generate_checkout_link

superadmin_bp = Blueprint('superadmin', __name__)
logger = logging.getLogger(__name__)


def _require_superadmin():
    """Return None if authorized, or a (json, status) tuple if not."""
    if not get_jwt().get('is_superadmin'):
        return jsonify({"message": "Unauthorized"}), 403
    return None


# ---------------------------------------------------------------------
# AUTH
# ---------------------------------------------------------------------
@superadmin_bp.route('/login', methods=['POST'])
def superadmin_login():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').lower().strip()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    admin = SuperAdmin.query.filter_by(email=email).first()

    if not admin or not check_password_hash(admin.password_hash, password):
        logger.warning('superadmin login failed: %s', email)
        return jsonify({"message": "Invalid developer credentials"}), 401

    token = create_access_token(
        identity=admin.id,
        additional_claims={
            "is_superadmin": True,
            "name": admin.name,
            "role": "SuperAdmin",
        }
    )

    logger.info('superadmin login ok: %s', admin.email)

    return jsonify({
        "token": token,
        "user": {
            "id": admin.id,
            "name": admin.name,
            "email": admin.email,
            "role": "SuperAdmin",
        }
    }), 200


@superadmin_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_superadmin():
    guard = _require_superadmin()
    if guard:
        return guard

    claims = get_jwt()
    return jsonify({
        "user": {
            "id": claims.get('sub'),
            "name": claims.get('name'),
            "role": "SuperAdmin",
        }
    }), 200


# ---------------------------------------------------------------------
# OVERVIEW
# ---------------------------------------------------------------------
@superadmin_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_overview():
    guard = _require_superadmin()
    if guard:
        return guard

    try:
        total_chamas = Chama.query.count()
        total_members = Member.query.filter_by(status='active').count()

        try:
            unmatched_payments = Payment.query.filter_by(status='unmatched').count()
        except Exception as e:
            logger.warning("Could not fetch unmatched payments: %s", e)
            unmatched_payments = 0

        settings = PlatformSettings.query.first()
        tier_prices = settings.prices if settings and settings.prices else {
            'Starter': 500, 'Growth': 1000, 'Business': 2000, 'Gold': 3000,
        }

        mrr = 0
        for c in Chama.query.all():
            mrr += tier_prices.get(c.base_tier, 500)

        return jsonify({
            'totalChamas': total_chamas,
            'totalMembers': total_members,
            'unmatchedPayments': unmatched_payments,
            'mrr': mrr,
        }), 200
    except Exception as e:
        logger.error("Error fetching overview metrics: %s", e)
        return jsonify({"message": "Failed to load overview data"}), 500


# ---------------------------------------------------------------------
# CHAMAS
# ---------------------------------------------------------------------
@superadmin_bp.route('/chamas', methods=['GET'])
@jwt_required()
def get_all_chamas():
    guard = _require_superadmin()
    if guard:
        return guard

    try:
        chamas = Chama.query.all()
        result = []

        for c in chamas:
            active_members = Member.query.filter_by(chama_id=c.id, status='active').count()
            total_members = Member.query.filter_by(chama_id=c.id).count()
            chair_member = Member.query.filter_by(chama_id=c.id, role='Chairman').first()

            chair_name = '—'
            chair_phone = '—'
            if chair_member:
                if chair_member.user:
                    chair_name = chair_member.user.name
                    chair_phone = chair_member.user.phone or chair_member.phone or '—'
                else:
                    chair_phone = chair_member.phone or '—'

            result.append({
                'id': c.id,
                'name': c.name,
                'code': c.code,
                'loc': 'Nairobi, Kenya',
                'chair': chair_name,
                'chair_phone': chair_phone,
                'tier': c.base_tier,
                'm': total_members,
                'active': active_members,
                'col': 100 if active_members > 0 else 0,
                'od': 0,
                'sav': 0,
                'status': 'active',
            })

        return jsonify(result), 200
    except Exception as e:
        logger.error("Error fetching chamas list: %s", e)
        return jsonify({"message": "Failed to load chamas list"}), 500


# ---------------------------------------------------------------------
# PAYMENTS
# ---------------------------------------------------------------------
@superadmin_bp.route('/payments', methods=['GET'])
@jwt_required()
def get_all_payments():
    guard = _require_superadmin()
    if guard:
        return guard

    try:
        payments = Payment.query.order_by(Payment.occurred_at.desc()).all()
        status_map = {'matched': 'paid', 'unmatched': 'pending', 'failed': 'failed'}
        result = []

        # Tier-subscription payments made through IntaSend
        sub_status = {
            'complete': 'paid', 'pending': 'pending', 'processing': 'pending',
            'failed': 'failed', 'expired': 'failed', 'review': 'failed',
        }
        for sp in SubscriptionPayment.query.order_by(SubscriptionPayment.created_at.desc()).limit(500).all():
            sp_chama = Chama.query.get(sp.chama_id)
            sp_user = User.query.get(sp.user_id)
            result.append({
                'id': sp.id,
                'channel': 'mpesa',
                'ref': sp.invoice_id or sp.api_ref,
                'chama': sp_chama.name if sp_chama else 'Unknown Chama',
                'tier': sp.tier,
                'payer': sp_user.name if sp_user else 'Unknown',
                'phone': sp.phone,
                'amount': sp.amount,
                'time': (sp.completed_at or sp.created_at).isoformat(),
                'status': sub_status.get(sp.status, 'pending'),
            })

        for p in payments:
            chama = Chama.query.get(p.chama_id)
            result.append({
                'id': p.id,
                'channel': p.channel,
                'ref': p.reference or '—',
                'chama': chama.name if chama else 'Unknown Chama',
                'tier': chama.base_tier if chama else 'Starter',
                'payer': p.payer_name or 'Unknown',
                'phone': p.phone,
                'amount': p.amount,
                'time': p.occurred_at.isoformat(),
                'status': status_map.get(p.status, 'pending'),
            })

        result.sort(key=lambda r: r['time'], reverse=True)
        return jsonify(result), 200
    except Exception as e:
        logger.error("Error fetching payments: %s", e)
        return jsonify({"message": "Failed to load payments"}), 500


# ---------------------------------------------------------------------
# BILLING
# ---------------------------------------------------------------------
@superadmin_bp.route('/billing', methods=['GET'])
@jwt_required()
def get_billing():
    guard = _require_superadmin()
    if guard:
        return guard

    try:
        settings = PlatformSettings.query.first()
        tier_prices = settings.prices if settings and settings.prices else {
            'Starter': 500, 'Growth': 1000, 'Business': 2000, 'Gold': 3000,
        }

        invoices = []
        paid_recently = {
            row[0] for row in db.session.query(SubscriptionPayment.chama_id).filter(
                SubscriptionPayment.status == 'complete',
                SubscriptionPayment.completed_at >= datetime.utcnow() - timedelta(days=30),
            ).all()
        }
        for c in Chama.query.all():
            if c.id in paid_recently:
                continue
            days_since_creation = (datetime.utcnow() - c.created_at).days
            is_overdue = days_since_creation > 30

            if c.is_blocked:
                status = 'Blocked'
                days_overdue = max(0, days_since_creation - 30)
            elif is_overdue:
                status = 'Overdue'
                days_overdue = days_since_creation - 30
            else:
                continue

            chair = Member.query.filter_by(chama_id=c.id, role='Chairman').first()
            owner_name = chair.user.name if chair and chair.user else '—'

            invoices.append({
                'id': c.id,
                'name': c.name,
                'owner': owner_name,
                'tier': c.base_tier,
                'daysOverdue': days_overdue,
                'amount': tier_prices.get(c.base_tier, 500),
                'status': status,
            })

        return jsonify(invoices), 200
    except Exception as e:
        logger.error("Error fetching billing: %s", e)
        return jsonify({"message": "Failed to load billing"}), 500


@superadmin_bp.route('/billing/remind', methods=['POST'])
@jwt_required()
def send_reminder():
    guard = _require_superadmin()
    if guard:
        return guard

    data = request.get_json() or {}
    chama_id = data.get('chama_id')

    if not chama_id:
        return jsonify({"message": "Chama ID required"}), 400

    chama = Chama.query.get(chama_id)
    chair = Member.query.filter_by(chama_id=chama_id, role='Chairman').first()

    if not chama or not chair or not chair.user or not chair.user.email:
        return jsonify({"message": "Could not find chama or chair email"}), 404

    email = chair.user.email
    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
    pay_link = f"{frontend_url}/dashboard/upgrade"

    subject = f"Action Required: Outstanding Invoice for {chama.name}"
    html_content = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; color: #0B1F33; padding: 20px;">
        <h2 style="color: #B4232A; margin-top: 0;">Outstanding Payment Reminder</h2>
        <p>Hi {chair.user.name},</p>
        <p>This is a reminder that your subscription invoice for <b>{chama.name}</b> is currently overdue.</p>
        <p>Please settle the outstanding balance to ensure uninterrupted access to your Chametu dashboard and member data.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{pay_link}" style="display: inline-block; background-color: #0B7A5A; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">
                Pay Invoice Now
            </a>
        </div>
        <p style="font-size: 13px; color: #64748B;">
            If the button above doesn't work, copy and paste this link into your browser:<br>
            <a href="{pay_link}" style="color: #0B7A5A; word-break: break-all;">{pay_link}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #E3E9EF; margin: 20px 0;">
        <p>Thank you,<br/>Chametu Billing Team</p>
    </div>
    """

    send_email(email, subject, html_content)
    return jsonify({"message": f"Reminder sent to {email}"}), 200


@superadmin_bp.route('/billing/action', methods=['POST'])
@jwt_required()
def billing_action():
    guard = _require_superadmin()
    if guard:
        return guard

    data = request.get_json() or {}
    chama_id = data.get('chama_id')
    action = data.get('action')

    if not chama_id:
        return jsonify({"message": "Chama ID required"}), 400

    chama = Chama.query.get(chama_id)
    if not chama:
        return jsonify({"message": "Chama not found"}), 404

    if action == 'block':
        chama.is_blocked = True
        chama.blocked_at = datetime.utcnow()
        db.session.commit()
        logger.warning("Chama %s (%s) blocked by SuperAdmin", chama.code, chama.name)
        return jsonify({"message": f"Chama {chama.name} has been blocked"}), 200

    if action == 'unblock':
        chama.is_blocked = False
        chama.blocked_at = None
        db.session.commit()
        logger.info("Chama %s (%s) unblocked by SuperAdmin", chama.code, chama.name)
        return jsonify({"message": f"Chama {chama.name} has been unblocked"}), 200

    if action == 'mark_paid':
        logger.info("Chama %s invoice marked paid", chama.code)
        return jsonify({"message": f"Invoice for {chama.name} cleared"}), 200

    return jsonify({"message": "Invalid action"}), 400


@superadmin_bp.route('/payments/request-mpesa', methods=['POST'])
@jwt_required()
def request_mpesa():
    guard = _require_superadmin()
    if guard:
        return guard

    data = request.get_json() or {}
    chama_id = data.get('chama_id')
    phone = data.get('phone')
    amount = data.get('amount')
    method = data.get('method', 'stk')

    if not chama_id or not amount:
        return jsonify({"message": "Chama ID and amount are required"}), 400

    if method == 'stk' and not phone:
        return jsonify({"message": "Phone number is required for STK Push"}), 400

    chama = Chama.query.get(chama_id)
    if not chama:
        return jsonify({"message": "Chama not found"}), 404

    chair = Member.query.filter_by(chama_id=chama_id, role='Chairman').first()
    chair_email = chair.user.email if chair and chair.user else "support@chametu.co.ke"
    chair_name = chair.user.name if chair and chair.user else chama.name

    if method == 'stk':
        result = send_stk_push(
            phone_number=phone,
            amount=amount,
            api_ref=f"CHAMETU-SA-{chama_id[:8]}",
            name=chama.name,
            email=chair_email,
        )
        if result['status'] == 'success':
            return jsonify({"message": f"STK Push sent to {phone}"}), 200
        return jsonify({"message": result.get('message', 'STK Push failed')}), 400

    if method in ('card', 'till'):
        result = generate_checkout_link(
            amount=amount,
            api_ref=f"CHAMETU-{method.upper()}-{chama_id[:8]}",
            name=chair_name,
            email=chair_email,
            method="CARD-PAYMENT" if method == 'card' else "M-PESA",
        )
        if result['status'] == 'success':
            return jsonify({
                "message": "Payment link generated successfully",
                "url": result.get('url'),
            }), 200
        return jsonify({"message": result.get('message', 'Failed to generate link')}), 400

    return jsonify({"message": "Invalid payment method"}), 400


# ---------------------------------------------------------------------
# SUPPORT TICKETS
# ---------------------------------------------------------------------
@superadmin_bp.route('/tickets', methods=['GET'])
@jwt_required()
def get_all_tickets():
    guard = _require_superadmin()
    if guard:
        return guard

    try:
        tickets = Ticket.query.order_by(Ticket.updated_at.desc()).all()
        result = []

        for t in tickets:
            user = User.query.get(t.user_id)
            chama = Chama.query.get(t.chama_id)

            messages = [
                {
                    'id': m.id,
                    'author': m.author_name,
                    'role': m.role,
                    'body': m.body,
                    'internal': m.internal,
                    'at': m.created_at.isoformat(),
                }
                for m in t.messages
            ]

            result.append({
                'id': f"TKT-{t.id[:4].upper()}",
                'subject': t.subject,
                'description': t.description,
                'requester': {
                    'name': user.name if user else 'Unknown',
                    'email': user.email if user else '',
                    'phone': user.phone if user else '',
                    'chama': chama.name if chama else 'Unknown',
                },
                'category': t.category,
                'priority': t.priority,
                'status': t.status,
                'assignee': t.assignee,
                'watchers': [],
                'tags': t.tags or [],
                'createdAt': t.created_at.isoformat(),
                'updatedAt': t.updated_at.isoformat(),
                'slaResponseDue': t.sla_response_due.isoformat() if t.sla_response_due else (t.created_at + timedelta(hours=4)).isoformat(),
                'slaResolveDue': t.sla_resolve_due.isoformat() if t.sla_resolve_due else (t.created_at + timedelta(hours=24)).isoformat(),
                'messages': messages,
            })

        return jsonify(result), 200
    except Exception as e:
        logger.error("Error fetching tickets: %s", e)
        return jsonify({"message": "Failed to load tickets"}), 500


@superadmin_bp.route('/tickets', methods=['POST'])
@jwt_required()
def create_superadmin_ticket():
    guard = _require_superadmin()
    if guard:
        return guard

    data = request.get_json() or {}
    requester = data.get('requester', {})

    user = User.query.filter_by(email=requester.get('email')).first() if requester.get('email') else None
    if not user:
        user = User.query.first()
    if not user:
        return jsonify({"message": "No users exist in the database"}), 400

    chama = Chama.query.filter_by(name=requester.get('chama')).first()
    if not chama:
        chama = Chama.query.first()
    if not chama:
        return jsonify({"message": "No chamas exist in the database"}), 400

    now = datetime.utcnow()
    ticket = Ticket(
        user_id=user.id,
        chama_id=chama.id,
        subject=data.get('subject'),
        description=data.get('description'),
        category=data.get('category', 'technical'),
        priority=data.get('priority', 'normal'),
        status='open',
        assignee=data.get('assignee'),
        tags=data.get('tags', []),
        sla_response_due=now + timedelta(hours=4),
        sla_resolve_due=now + timedelta(hours=24),
    )
    db.session.add(ticket)
    db.session.flush()

    db.session.add(TicketMessage(
        ticket_id=ticket.id,
        author_name=requester.get('name', 'Unknown'),
        role='requester',
        body=data.get('description'),
        internal=False,
    ))
    db.session.commit()

    return jsonify({"message": "Ticket created"}), 201


@superadmin_bp.route('/tickets/<ticket_id>/reply', methods=['POST'])
@jwt_required()
def reply_ticket(ticket_id):
    guard = _require_superadmin()
    if guard:
        return guard

    data = request.get_json() or {}
    body = data.get('body')
    internal = data.get('internal', False)

    if not body:
        return jsonify({"message": "Message body required"}), 400

    real_id = ticket_id.replace('TKT-', '').lower()
    ticket = Ticket.query.filter(Ticket.id.startswith(real_id)).first()
    if not ticket:
        return jsonify({"message": "Ticket not found"}), 404

    db.session.add(TicketMessage(
        ticket_id=ticket.id,
        author_name="You (Super Admin)",
        role="agent",
        body=body,
        internal=internal,
    ))
    ticket.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({"message": "Reply sent"}), 201


@superadmin_bp.route('/tickets/<ticket_id>/status', methods=['PATCH'])
@jwt_required()
def update_ticket_status(ticket_id):
    guard = _require_superadmin()
    if guard:
        return guard

    data = request.get_json() or {}
    real_id = ticket_id.replace('TKT-', '').lower()
    ticket = Ticket.query.filter(Ticket.id.startswith(real_id)).first()
    if not ticket:
        return jsonify({"message": "Ticket not found"}), 404

    if 'status' in data:
        ticket.status = data['status']
    if 'priority' in data:
        ticket.priority = data['priority']
    if 'assignee' in data:
        ticket.assignee = data['assignee']

    if data.get('status') in ('resolved', 'closed'):
        ticket.resolved_at = datetime.utcnow()

    db.session.commit()
    return jsonify({"message": "Ticket updated"}), 200


@superadmin_bp.route('/tickets/<ticket_id>', methods=['DELETE'])
@jwt_required()
def delete_ticket(ticket_id):
    guard = _require_superadmin()
    if guard:
        return guard

    real_id = ticket_id.replace('TKT-', '').lower()
    ticket = Ticket.query.filter(Ticket.id.startswith(real_id)).first()
    if not ticket:
        return jsonify({"message": "Ticket not found"}), 404

    db.session.delete(ticket)
    db.session.commit()
    return jsonify({"message": "Ticket deleted"}), 200


# ---------------------------------------------------------------------
# PLATFORM SETTINGS
# ---------------------------------------------------------------------
@superadmin_bp.route('/settings', methods=['GET'])
@jwt_required()
def get_platform_settings():
    guard = _require_superadmin()
    if guard:
        return guard

    settings = PlatformSettings.query.first()
    if not settings:
        settings = PlatformSettings()
        db.session.add(settings)
        db.session.commit()

    return jsonify({
        'prices': settings.prices,
        'paybill': settings.paybill,
        'accountRef': settings.account_ref,
        'gracePeriod': settings.grace_period,
        'autoBlockDays': settings.auto_block_days,
        'platformName': settings.platform_name,
        'supportEmail': settings.support_email,
        'timezone': settings.timezone,
    }), 200


@superadmin_bp.route('/settings', methods=['PUT'])
@jwt_required()
def update_platform_settings():
    guard = _require_superadmin()
    if guard:
        return guard

    data = request.get_json() or {}
    settings = PlatformSettings.query.first()
    if not settings:
        settings = PlatformSettings()
        db.session.add(settings)

    if 'prices' in data:
        settings.prices = data['prices']
    if 'paybill' in data:
        settings.paybill = data['paybill']
    if 'accountRef' in data:
        settings.account_ref = data['accountRef']
    if 'gracePeriod' in data:
        settings.grace_period = data['gracePeriod']
    if 'autoBlockDays' in data:
        settings.auto_block_days = data['autoBlockDays']
    if 'platformName' in data:
        settings.platform_name = data['platformName']
    if 'supportEmail' in data:
        settings.support_email = data['supportEmail']
    if 'timezone' in data:
        settings.timezone = data['timezone']

    db.session.commit()
    return jsonify({"message": "Settings saved"}), 200


# ---------------------------------------------------------------------
# AUDIT LOG
# ---------------------------------------------------------------------
@superadmin_bp.route('/audit', methods=['GET'])
@jwt_required()
def get_audit_log():
    guard = _require_superadmin()
    if guard:
        return guard

    try:
        entries = AuditLogEntry.query.order_by(AuditLogEntry.created_at.desc()).all()
        result = []

        for e in entries:
            actor_name = 'System'
            if e.actor_user_id:
                user = User.query.get(e.actor_user_id)
                if user:
                    actor_name = user.name

            action_lower = e.action.lower()
            tone = 'blue'
            if any(w in action_lower for w in ('delete', 'remove', 'fail')):
                tone = 'red'
            elif any(w in action_lower for w in ('create', 'add', 'success')):
                tone = 'green'
            elif any(w in action_lower for w in ('update', 'edit', 'change')):
                tone = 'amber'

            result.append({
                'id': e.id,
                'actor': actor_name,
                'action': e.action,
                'target': e.target or '—',
                'tone': tone,
                'time': e.created_at.isoformat(),
                'ip': '—',
            })

        return jsonify(result), 200
    except Exception as e:
        logger.error("Error fetching audit logs: %s", e)
        return jsonify({"message": "Failed to load audit logs"}), 500


# ---------------------------------------------------------------------
# CHAT SESSIONS (superadmin-only)
# ---------------------------------------------------------------------
@superadmin_bp.route('/chat/sessions', methods=['GET'])
@jwt_required()
def superadmin_chat_sessions():
    guard = _require_superadmin()
    if guard:
        return guard

    try:
        rows = (
            ChatSession.query
            .order_by(ChatSession.last_activity_at.desc())
            .all()
        )
        result = []

        for s in rows:
            user = User.query.get(s.user_id) if s.user_id else None
            chama = Chama.query.get(s.chama_id)

            messages = [
                {
                    'id': m.id,
                    'sender': m.sender,
                    'body': m.body,
                    'link': m.link,
                    'linkText': m.link_text,
                    'matchedEntry': m.matched_entry,
                    'feedback': m.feedback,
                    'at': m.created_at.isoformat(),
                }
                for m in s.messages
            ]

            result.append({
                'id': s.id,
                'status': s.status,
                'startedAt': s.started_at.isoformat(),
                'endedAt': s.ended_at.isoformat() if s.ended_at else None,
                'lastActivityAt': s.last_activity_at.isoformat(),
                'user': {
                    'id': user.id if user else None,
                    'name': user.name if user else 'Unknown',
                    'email': user.email if user else '',
                },
                'chama': {
                    'id': chama.id if chama else None,
                    'name': chama.name if chama else 'Unknown',
                    'code': chama.code if chama else '',
                },
                'messages': messages,
            })

        return jsonify(result), 200
    except Exception as e:
        logger.error("Error fetching chat sessions: %s", e)
        return jsonify({"message": "Failed to load chat sessions"}), 500


@superadmin_bp.route('/chat/sessions', methods=['DELETE'])
@jwt_required()
def superadmin_clear_chat_sessions():
    guard = _require_superadmin()
    if guard:
        return guard

    data = request.get_json(silent=True) or {}
    q = ChatSession.query

    if data.get('all'):
        statuses = data.get('statuses')
        if statuses:
            q = q.filter(ChatSession.status.in_(statuses))
    else:
        ids = data.get('ids') or []
        if not ids:
            return jsonify({'message': 'No session ids provided'}), 400
        q = q.filter(ChatSession.id.in_(ids))

    sessions = q.all()
    if not sessions:
        return jsonify({'deleted': 0}), 200

    count = len(sessions)
    for s in sessions:
        db.session.delete(s)
    db.session.commit()

    logger.info("superadmin cleared chat sessions: count=%s", count)
    return jsonify({'deleted': count}), 200


@superadmin_bp.route('/chat/session/<session_id>/end', methods=['POST'])
@jwt_required()
def superadmin_end_chat_session(session_id):
    guard = _require_superadmin()
    if guard:
        return guard

    s = ChatSession.query.get(session_id)
    if not s:
        return jsonify({"message": "Session not found"}), 404

    if s.status != 'ended':
        s.status = 'ended'
        s.ended_at = datetime.utcnow()
        db.session.commit()

    return jsonify({'message': 'Session ended', 'id': s.id}), 200