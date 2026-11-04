# app/utils/db_retry.py
"""Retry helper for transient Neon / PostgreSQL connection drops.

Neon's pooler occasionally kills an in-flight SSL connection, which
psycopg surfaces as `OperationalError: ... SSL connection has been
closed unexpectedly`. The statement has NOT executed server-side, so
retrying once after discarding the dead session connection is safe.

Usage:
    from app.utils.db_retry import retry_db
    member = retry_db(lambda: Member.query.filter_by(
        user_id=user_id, chama_id=chama_id).first())
"""
import logging

from sqlalchemy.exc import OperationalError

from app import db

logger = logging.getLogger(__name__)

# Message fragments that identify a "connection died, retry is safe" error.
# We deliberately do NOT retry on uniqueness / constraint / syntax errors.
_RETRY_MARKERS = (
    "SSL connection has been closed",
    "server closed the connection unexpectedly",
    "consuming input failed",
    "connection already closed",
    "connection is closed",
)


def _is_retryable(exc: OperationalError) -> bool:
    msg = str(getattr(exc, "orig", exc)).lower()
    return any(marker.lower() in msg for marker in _RETRY_MARKERS)


def retry_db(fn, *, attempts: int = 2):
    """Run `fn()` up to `attempts` times on retryable OperationalError.

    Between attempts we discard the dead session so SQLAlchemy pulls a
    fresh connection from the pool on the next query.
    """
    last_exc = None
    for n in range(attempts):
        try:
            return fn()
        except OperationalError as exc:
            last_exc = exc
            if n == attempts - 1 or not _is_retryable(exc):
                raise
            logger.warning(
                "db_retry: transient connection drop (attempt %s/%s): %s",
                n + 1, attempts, exc,
            )
            # Remove the broken connection so the retry gets a live one.
            try:
                db.session.remove()
            except Exception:
                logger.exception("db_retry: session.remove() failed")
    raise last_exc  # unreachable, but keeps the type checker happy
