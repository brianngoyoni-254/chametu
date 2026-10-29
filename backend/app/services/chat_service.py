# app/services/chat_service.py
import logging
from datetime import datetime

from app import db
from app.models.chat import ChatSession, ChatMessage
from app.services import chat_kb as kb

logger = logging.getLogger(__name__)


def _serialize_message(m):
    return {
        'id': m.id,
        'sender': m.sender,
        'body': m.body,
        'link': m.link,
        'linkText': m.link_text,
        'matchedEntry': m.matched_entry,
        'feedback': m.feedback,
        'at': m.created_at.isoformat(),
    }


def _serialize_session(s, include_messages=True):
    data = {
        'id': s.id,
        'status': s.status,
        'startedAt': s.started_at.isoformat(),
        'endedAt': s.ended_at.isoformat() if s.ended_at else None,
        'lastActivityAt': s.last_activity_at.isoformat(),
    }
    if include_messages:
        data['messages'] = [_serialize_message(m) for m in s.messages]
    return data


def _touch(session):
    session.last_activity_at = datetime.utcnow()


def _welcome_message(session_id):
    return ChatMessage(
        session_id=session_id,
        sender='bot',
        body=kb.WELCOME,
        matched_entry=None,
        feedback=None,
    )


def start_session(chama_id, user_id):
    """Always returns a fresh session with the welcome message.
    Ends any previous open session for this user first."""
    if user_id:
        prev = ChatSession.query.filter_by(
            chama_id=chama_id, user_id=user_id, status='open',
        ).all()
        for s in prev:
            s.status = 'ended'
            s.ended_at = datetime.utcnow()
        db.session.commit()

    session = ChatSession(
        chama_id=chama_id,
        user_id=user_id,
        status='open',
    )
    db.session.add(session)
    db.session.flush()

    db.session.add(_welcome_message(session.id))
    db.session.commit()

    db.session.refresh(session)
    logger.info('chat session started: id=%s chama=%s user=%s', session.id, chama_id, user_id)
    return session


def get_open_session(chama_id, user_id):
    """Return the current open session for this user, or create one."""
    if not user_id:
        return None
    s = ChatSession.query.filter_by(
        chama_id=chama_id, user_id=user_id, status='open',
    ).order_by(ChatSession.started_at.desc()).first()
    if s:
        return s
    return start_session(chama_id, user_id)


def get_session(chama_id, session_id, user_id=None, is_admin=False):
    q = ChatSession.query.filter_by(id=session_id, chama_id=chama_id)
    if not is_admin:
        q = q.filter_by(user_id=user_id)
    return q.first()


def send_message(chama_id, session_id, user_id, text):
    if not text or not text.strip():
        raise ValueError('Message cannot be empty')

    session = get_session(chama_id, session_id, user_id=user_id)
    if not session:
        raise ValueError('Chat session not found')
    if session.status == 'ended':
        raise ValueError('This chat has ended. Start a new chat.')

    user_msg = ChatMessage(
        session_id=session.id,
        sender='user',
        body=text.strip(),
    )
    db.session.add(user_msg)

    # Match against the KB
    match = kb.find_answer(text)
    if match:
        bot_body = match['body']
        bot_title = match['title']
        link = match.get('link')
        link_text = match.get('link_text')
        matched_id = match['id']
    else:
        bot_body = kb.FALLBACK['body']
        bot_title = kb.FALLBACK['title']
        link = None
        link_text = None
        matched_id = None

    # Prefix the title if present
    full_body = f"{bot_title}\n\n{bot_body}" if bot_title else bot_body

    bot_msg = ChatMessage(
        session_id=session.id,
        sender='bot',
        body=full_body,
        link=link,
        link_text=link_text,
        matched_entry=matched_id,
    )
    db.session.add(bot_msg)

    _touch(session)
    db.session.commit()

    return {
        'user': _serialize_message(user_msg),
        'bot': _serialize_message(bot_msg),
        'suggestions': kb.SUGGESTIONS if user_msg.id and not match else None,
    }


def set_feedback(chama_id, message_id, user_id, feedback):
    if feedback not in ('up', 'down', None):
        raise ValueError('Feedback must be up, down or null')

    msg = ChatMessage.query.get(message_id)
    if not msg:
        raise ValueError('Message not found')
    session = ChatSession.query.filter_by(id=msg.session_id, chama_id=chama_id).first()
    if not session or session.user_id != user_id:
        raise ValueError('Not your chat')
    if msg.sender != 'bot':
        raise ValueError('Feedback only applies to bot messages')

    msg.feedback = feedback
    db.session.commit()
    return _serialize_message(msg)


def end_session(chama_id, session_id, user_id):
    session = get_session(chama_id, session_id, user_id=user_id)
    if not session:
        raise ValueError('Session not found')
    if session.status == 'ended':
        return _serialize_session(session)

    session.status = 'ended'
    session.ended_at = datetime.utcnow()

    db.session.add(ChatMessage(
        session_id=session.id,
        sender='bot',
        body=kb.END_MESSAGE,
        matched_entry='__end__',
    ))
    db.session.commit()
    return _serialize_session(session)


# ---------- Admin views ----------

def list_chama_sessions(chama_id, limit=100):
    """Every chat in the chama, newest first — admin view."""
    rows = (
        ChatSession.query
        .filter_by(chama_id=chama_id)
        .order_by(ChatSession.last_activity_at.desc())
        .limit(limit)
        .all()
    )
    return [_serialize_session(s) for s in rows]


def end_session_as_admin(chama_id, session_id):
    session = ChatSession.query.filter_by(id=session_id, chama_id=chama_id).first()
    if not session:
        raise ValueError('Session not found')
    session.status = 'ended'
    session.ended_at = datetime.utcnow()
    db.session.commit()
    return _serialize_session(session)