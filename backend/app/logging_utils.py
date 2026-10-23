# app/logging_utils.py
"""
Request-scoped logging helpers.

- `set_context(**kw)` attaches fields to the current request's log records.
  Values flow into every log line emitted from this request.
- `@log_call` decorator logs entry + exit + duration for a route/service fn.
- `@log_writes` decorator logs success/failure of write endpoints.
"""
import functools
import logging
import time
import uuid
from contextvars import ContextVar

from flask import g, request, has_request_context

# ContextVars are per-request in Flask (flask.g is per-request too, but
# ContextVars survive across threads spawned inside the request).
_request_id_var: ContextVar[str | None] = ContextVar('request_id', default=None)
_chama_id_var: ContextVar[str | None] = ContextVar('chama_id', default=None)
_user_id_var: ContextVar[str | None] = ContextVar('user_id', default=None)


def get_request_id() -> str | None:
    return _request_id_var.get()


def set_context(**kwargs):
    """
    Set per-request log context.

    Recognised keys:
        request_id, chama_id, user_id
    Any other keyword is ignored to keep the surface small.
    """
    if 'request_id' in kwargs:
        _request_id_var.set(kwargs['request_id'])
    if 'chama_id' in kwargs:
        _chama_id_var.set(kwargs['chama_id'])
    if 'user_id' in kwargs:
        _user_id_var.set(kwargs['user_id'])


def _base_fields():
    fields = {}
    rid = _request_id_var.get()
    if rid:
        fields['request_id'] = rid
    cid = _chama_id_var.get()
    if cid:
        fields['chama_id'] = cid
    uid = _user_id_var.get()
    if uid:
        fields['user_id'] = uid
    return fields


def log_call(logger: logging.Logger):
    """
    Decorator that logs entry, exit and duration of a function.

    On exception, logs with `exc_info=True` and re-raises so Flask's error
    handler still produces the HTTP response.
    """

    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            fn_logger = logger
            start = time.perf_counter()
            entry_extra = _base_fields()

            if has_request_context():
                entry_extra['method'] = request.method
                entry_extra['path'] = request.path

            fn_logger.debug(f'-> {fn.__name__}', extra=entry_extra)

            try:
                result = fn(*args, **kwargs)
                elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

                exit_extra = _base_fields()
                exit_extra['duration_ms'] = elapsed_ms
                if has_request_context():
                    exit_extra['method'] = request.method
                    exit_extra['path'] = request.path

                fn_logger.debug(f'<- {fn.__name__} ({elapsed_ms}ms)', extra=exit_extra)
                return result

            except Exception as exc:
                elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
                err_extra = _base_fields()
                err_extra['duration_ms'] = elapsed_ms
                err_extra['error_class'] = type(exc).__name__
                if has_request_context():
                    err_extra['method'] = request.method
                    err_extra['path'] = request.path
                fn_logger.exception(
                    f'!! {fn.__name__} failed after {elapsed_ms}ms: {exc}',
                    extra=err_extra,
                )
                raise

        return wrapper
    return decorator


def log_writes(logger: logging.Logger, action: str):
    """
    Decorator for write endpoints. Logs success at INFO with any `extra`
    payload the route wants to publish, and logs failure with traceback.

    Usage:
        @bp.route('/x', methods=['POST'])
        @jwt_required()
        @log_writes(logger, 'contribution.create')
        def create_x(): ...
    """

    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            start = time.perf_counter()
            extra = _base_fields()
            extra['action'] = action
            if has_request_context():
                extra['method'] = request.method
                extra['path'] = request.path

            try:
                result = fn(*args, **kwargs)
                elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
                done_extra = {**extra, 'duration_ms': elapsed_ms, 'result': 'ok'}
                logger.info(f'{action} succeeded in {elapsed_ms}ms', extra=done_extra)
                return result

            except Exception as exc:
                elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
                fail_extra = {
                    **extra, 'duration_ms': elapsed_ms,
                    'result': 'fail', 'error_class': type(exc).__name__,
                }
                logger.warning(f'{action} failed: {exc}', extra=fail_extra)
                raise

        return wrapper
    return decorator


def attach_request_id():
    """Called from before_request. Ensures every request has an ID."""
    rid = request.headers.get('X-Request-ID') or str(uuid.uuid4())
    _request_id_var.set(rid)
    if has_request_context():
        g.request_id = rid
    return rid