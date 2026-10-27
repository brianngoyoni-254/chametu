# app/services/notification_service.py
import logging
from datetime import datetime

from app import db
from app.models.notification import (
    Notification, NotificationPreference, NotificationReadReceipt,
)

logger = logging.getLogger(__name__)

VALID_TYPES = ('info', 'success', 'warning', 'critical')

DEFAULT_PREFS = {
    'events': {
        'loanApplications': True,
        'loanApprovals': True,
        'payments': True,
        'unmatchedPayments': True,
        'memberChanges': True,
        'welfareClaims': True,
        'contributionReminders': True,
        'paymentConfirmations': True,
        'meetingReminders': True,
        'system': True,
    },
    'delivery': {'inApp': True, 'sound': False},
    'quietHours': {'enabled': False, 'from': '22:00', 'to': '07:00'},
}


def _serialize(n, is_read, include_user=False):
    data = {
        'id': n.id,
        'type': n.type,
        'event': n.event,
        'title': n.title,
        'desc': n.body or '',
        'time': n.created_at.isoformat(),
        'link': n.link,
        'read': is_read,
    }
    if include_user:
        data['userId'] = n.user_id
    return data


def _is_read(n, user_id):
    if n.user_id == user_id:
        return bool(n.read)
    receipt = NotificationReadReceipt.query.filter_by(
        notification_id=n.id, user_id=user_id,
    ).first()
    return bool(receipt)


def list_for_user(chama_id, user_id, include_read=True, limit=100):
    q = Notification.query.filter(
        Notification.chama_id == chama_id,
        db.or_(
            Notification.user_id == user_id,
            Notification.user_id.is_(None),
        ),
    ).order_by(Notification.created_at.desc()).limit(limit)

    rows = q.all()
    return [_serialize(n, _is_read(n, user_id), include_user=True) for n in rows]


def create_notification(chama_id, user_id, type, event, title, body=None, link=None):
    if type not in VALID_TYPES:
        raise ValueError('Invalid notification type')

    n = Notification(
        chama_id=chama_id,
        user_id=user_id,
        type=type,
        event=event,
        title=title,
        body=body,
        link=link,
    )
    db.session.add(n)
    db.session.commit()
    logger.info('notification created: chama=%s user=%s event=%s', chama_id, user_id, event)
    return n


def mark_read(chama_id, notification_id, user_id):
    n = Notification.query.filter_by(id=notification_id, chama_id=chama_id).first()
    if not n:
        raise ValueError('Notification not found')

    if n.user_id == user_id:
        n.read = True
        n.read_at = datetime.utcnow()
    else:
        existing = NotificationReadReceipt.query.filter_by(
            notification_id=n.id, user_id=user_id,
        ).first()
        if not existing:
            db.session.add(NotificationReadReceipt(
                notification_id=n.id, user_id=user_id,
            ))
    db.session.commit()
    return True


def mark_all_read(chama_id, user_id):
    Notification.query.filter_by(
        chama_id=chama_id, user_id=user_id, read=False,
    ).update({'read': True, 'read_at': datetime.utcnow()}, synchronize_session=False)

    broadcast_ids = [
        row.id for row in Notification.query.filter_by(
            chama_id=chama_id, user_id=None,
        ).all()
    ]
    if broadcast_ids:
        already = {
            r.notification_id for r in NotificationReadReceipt.query.filter(
                NotificationReadReceipt.user_id == user_id,
                NotificationReadReceipt.notification_id.in_(broadcast_ids),
            ).all()
        }
        for nid in broadcast_ids:
            if nid not in already:
                db.session.add(NotificationReadReceipt(
                    notification_id=nid, user_id=user_id,
                ))

    db.session.commit()
    return True


def dismiss(chama_id, notification_id, user_id):
    n = Notification.query.filter_by(id=notification_id, chama_id=chama_id).first()
    if not n:
        raise ValueError('Notification not found')

    if n.user_id == user_id:
        db.session.delete(n)
    else:
        existing = NotificationReadReceipt.query.filter_by(
            notification_id=n.id, user_id=user_id,
        ).first()
        if not existing:
            db.session.add(NotificationReadReceipt(
                notification_id=n.id, user_id=user_id,
            ))
    db.session.commit()
    return True


def clear_all(chama_id, user_id):
    Notification.query.filter_by(chama_id=chama_id, user_id=user_id).delete(
        synchronize_session=False,
    )

    broadcast_ids = [
        row.id for row in Notification.query.filter_by(
            chama_id=chama_id, user_id=None,
        ).all()
    ]
    if broadcast_ids:
        already = {
            r.notification_id for r in NotificationReadReceipt.query.filter(
                NotificationReadReceipt.user_id == user_id,
                NotificationReadReceipt.notification_id.in_(broadcast_ids),
            ).all()
        }
        for nid in broadcast_ids:
            if nid not in already:
                db.session.add(NotificationReadReceipt(
                    notification_id=nid, user_id=user_id,
                ))
    db.session.commit()
    return True


def get_prefs(user_id):
    p = NotificationPreference.query.filter_by(user_id=user_id).first()
    if not p:
        return DEFAULT_PREFS
    merged = {**DEFAULT_PREFS}
    for section, values in (p.prefs or {}).items():
        if isinstance(values, dict):
            merged[section] = {**merged.get(section, {}), **values}
        else:
            merged[section] = values
    return merged


def save_prefs(user_id, prefs):
    if not isinstance(prefs, dict):
        raise ValueError('Preferences must be an object')

    p = NotificationPreference.query.filter_by(user_id=user_id).first()
    if not p:
        p = NotificationPreference(user_id=user_id, prefs=prefs)
        db.session.add(p)
    else:
        p.prefs = prefs
    db.session.commit()
    return get_prefs(user_id)
# ============================================================
# CONVENIENCE HELPERS — called from route handlers
# ============================================================

def notify_chama_admins(chama_id, type, event, title, body=None, link=None):
    """Broadcast to every admin role in the chama (Chairman/Treasurer/Secretary).
    Creates one private notification per admin so read-state is per-user."""
    from app.models.chama import Member

    admin_roles = ('Chairman', 'Treasurer', 'Secretary')
    admins = (
        Member.query
        .filter(Member.chama_id == chama_id, Member.role.in_(admin_roles))
        .all()
    )
    if not admins:
        # Fallback: broadcast (no admin found — rare)
        return [create_notification(chama_id, None, type, event, title, body, link)]

    created = []
    for m in admins:
        n = create_notification(
            chama_id=chama_id,
            user_id=m.user_id,
            type=type,
            event=event,
            title=title,
            body=body,
            link=link,
        )
        created.append(n)
    return created


def notify_member(chama_id, user_id, type, event, title, body=None, link=None):
    """Send one private notification to a specific user."""
    return create_notification(chama_id, user_id, type, event, title, body, link)


def notify_member_by_id(chama_id, member_id, type, event, title, body=None, link=None):
    """Send a notification to the user behind a member row."""
    from app.models.chama import Member
    m = Member.query.filter_by(id=member_id, chama_id=chama_id).first()
    if not m:
        return None
    return notify_member(chama_id, m.user_id, type, event, title, body, link)