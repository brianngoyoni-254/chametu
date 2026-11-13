# app/services/support_service.py
import logging
from datetime import datetime

from app import db
from app.models.support import Ticket, TicketMessage, TicketReadState
from app.models.user import User

logger = logging.getLogger(__name__)

VALID_STATUSES = ('open', 'pending', 'resolved', 'closed')
VALID_PRIORITIES = ('low', 'normal', 'high', 'urgent')
VALID_CATEGORIES = ('billing', 'technical', 'account', 'feature', 'other')


def _iso_utc(dt):
    """Appends 'Z' to naive datetimes so browsers parse them as UTC."""
    if not dt:
        return None
    s = dt.isoformat()
    if s.endswith('Z') or '+' in s:
        return s
    return s + 'Z'


def _serialize_message(m, include_internal=True):
    data = {
        'id': m.id,
        'author': m.author_name,
        'role': m.role,
        'body': m.body,
        'at': _iso_utc(m.created_at),
    }
    if include_internal:
        data['internal'] = bool(m.internal)
    return data


def _get_unread_count(ticket, user_id, is_superadmin=False):
    if not user_id:
        return 0
    state = TicketReadState.query.filter_by(ticket_id=ticket.id, user_id=user_id).first()
    cutoff = state.last_read_at if state else datetime.min
    
    target_role = 'requester' if is_superadmin else 'agent'
    
    count = 0
    for m in ticket.messages:
        if m.role == target_role and not m.internal and m.created_at > cutoff:
            count += 1
    return count


def _serialize_ticket(t, include_internal=False, requester_info=None, viewer_user_id=None, is_superadmin=False):
    messages = [m for m in t.messages if include_internal or not m.internal]
    return {
        'id': t.id,
        'subject': t.subject,
        'description': t.description,
        'requester': requester_info or (t.user.name if t.user else 'Unknown'),
        'requesterId': t.user_id,
        'category': t.category,
        'priority': t.priority,
        'status': t.status,
        'createdAt': _iso_utc(t.created_at),
        'updatedAt': _iso_utc(t.updated_at),
        'resolvedAt': _iso_utc(t.resolved_at),
        'messages': [_serialize_message(m, include_internal) for m in messages],
        'unreadCount': _get_unread_count(t, viewer_user_id, is_superadmin),
    }


def list_chama_tickets(chama_id, include_internal=True, viewer_user_id=None):
    rows = (
        Ticket.query
        .filter_by(chama_id=chama_id)
        .order_by(Ticket.updated_at.desc())
        .all()
    )
    return [_serialize_ticket(t, include_internal=include_internal, viewer_user_id=viewer_user_id) for t in rows]


def list_my_tickets(chama_id, user_id):
    rows = (
        Ticket.query
        .filter_by(chama_id=chama_id, user_id=user_id)
        .order_by(Ticket.updated_at.desc())
        .all()
    )
    return [_serialize_ticket(t, include_internal=False, viewer_user_id=user_id) for t in rows]


def get_ticket(chama_id, ticket_id, include_internal=True, viewer_user_id=None):
    t = Ticket.query.filter_by(id=ticket_id, chama_id=chama_id).first()
    if not t:
        return None
    return _serialize_ticket(t, include_internal=include_internal, viewer_user_id=viewer_user_id)


def create_ticket(chama_id, user_id, subject, description, category, priority):
    if not subject or not description:
        raise ValueError('Subject and description are required')
    if category not in VALID_CATEGORIES:
        raise ValueError('Invalid category')
    if priority not in VALID_PRIORITIES:
        raise ValueError('Invalid priority')

    user = User.query.get(user_id)
    if not user:
        raise ValueError('User not found')

    ticket = Ticket(
        chama_id=chama_id,
        user_id=user_id,
        subject=subject.strip()[:150],
        description=description.strip(),
        category=category,
        priority=priority,
        status='open',
    )
    db.session.add(ticket)
    db.session.flush()

    db.session.add(TicketMessage(
        ticket_id=ticket.id,
        author_user_id=user_id,
        author_name=user.name,
        role='requester',
        body=description.strip(),
        internal=False,
    ))
    db.session.commit()

    logger.info('ticket created: id=%s chama=%s user=%s', ticket.id, chama_id, user_id)
    return _serialize_ticket(ticket, include_internal=True, viewer_user_id=user_id)


def add_message(chama_id, ticket_id, user_id, body, internal=False, as_agent=False):
    if not body or not body.strip():
        raise ValueError('Message body cannot be empty')

    t = Ticket.query.filter_by(id=ticket_id, chama_id=chama_id).first()
    if not t:
        raise ValueError('Ticket not found')

    user = User.query.get(user_id)
    if not user:
        raise ValueError('User not found')

    if not as_agent and t.user_id != user_id:
        raise ValueError('You cannot reply to this ticket')

    msg = TicketMessage(
        ticket_id=t.id,
        author_user_id=user_id,
        author_name=user.name,
        role='agent' if as_agent else 'requester',
        body=body.strip(),
        internal=bool(internal) and as_agent,
    )
    db.session.add(msg)

    if t.status == 'resolved':
        t.status = 'open'
    t.updated_at = datetime.utcnow()

    db.session.commit()
    logger.info(
        'message added: ticket=%s author=%s role=%s internal=%s',
        ticket_id, user_id, msg.role, msg.internal,
    )
    return _serialize_message(msg, include_internal=True)


def update_status(chama_id, ticket_id, new_status, actor_user_id=None):
    if new_status not in VALID_STATUSES:
        raise ValueError('Invalid status')

    t = Ticket.query.filter_by(id=ticket_id, chama_id=chama_id).first()
    if not t:
        raise ValueError('Ticket not found')

    old = t.status
    t.status = new_status
    if new_status == 'resolved':
        t.resolved_at = datetime.utcnow()
    elif new_status in ('open', 'pending'):
        t.resolved_at = None

    db.session.commit()
    logger.info('ticket status: id=%s %s -> %s actor=%s', ticket_id, old, new_status, actor_user_id)
    return _serialize_ticket(t, include_internal=True, viewer_user_id=actor_user_id)


def mark_read(chama_id, ticket_id, user_id):
    t = Ticket.query.filter_by(id=ticket_id, chama_id=chama_id).first()
    if not t:
        raise ValueError('Ticket not found')

    now = datetime.utcnow()
    state = TicketReadState.query.filter_by(ticket_id=ticket_id, user_id=user_id).first()
    if state:
        state.last_read_at = now
    else:
        db.session.add(TicketReadState(ticket_id=ticket_id, user_id=user_id, last_read_at=now))
    db.session.commit()
    return True


def delete_ticket(chama_id, ticket_id, user_id):
    t = Ticket.query.filter_by(id=ticket_id, chama_id=chama_id, user_id=user_id).first()
    if not t:
        raise ValueError('Ticket not found or unauthorized')
    db.session.delete(t)
    db.session.commit()
    return True