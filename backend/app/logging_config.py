# app/logging_config.py
"""
Central logging configuration for the Chametu backend.

Two output modes, controlled by FLASK_ENV / LOG_FORMAT:

    development (default)
        - Human-readable, colored (if tty), to stdout
        - DEBUG for `app.*`, INFO for everything else
        - SQLAlchemy engine logs muted to WARNING

    production (LOG_FORMAT=json or FLASK_ENV=production)
        - One JSON object per line, to stdout
        - INFO for everything, WARNING+ includes `exc_info`
        - Compatible with CloudWatch / Loki / Datadog ingestion
"""
import json
import logging
import os
import sys
from datetime import datetime, timezone
from logging.handlers import RotatingFileHandler


# ------------------------------------------------------------------ formatters
class HumanFormatter(logging.Formatter):
    """Readable single-line log for local dev."""

    COLORS = {
        'DEBUG':    '\033[36m',   # cyan
        'INFO':     '\033[32m',   # green
        'WARNING':  '\033[33m',   # yellow
        'ERROR':    '\033[31m',   # red
        'CRITICAL': '\033[35m',   # magenta
    }
    RESET = '\033[0m'

    def __init__(self, use_color: bool = True):
        super().__init__()
        self.use_color = use_color

    def format(self, record):
        ts = datetime.fromtimestamp(record.created, tz=timezone.utc).strftime(
            '%Y-%m-%dT%H:%M:%S'
        )
        level = record.levelname.ljust(8)
        if self.use_color and record.levelname in self.COLORS:
            level = f'{self.COLORS[record.levelname]}{level}{self.RESET}'

        name = record.name
        msg = record.getMessage()

        # Request-scoped context (set by before_request)
        ctx = ''
        for key in ('request_id', 'chama_id', 'user_id', 'method', 'path', 'status',
                    'duration_ms'):
            val = getattr(record, key, None)
            if val is not None:
                ctx += f' {key}={val}'

        line = f'{ts} [{level}] {name}: {msg}{ctx}'
        if record.exc_info:
            line += '\n' + self.formatException(record.exc_info)
        return line


class JsonFormatter(logging.Formatter):
    """One JSON object per line — production-ready."""

    def format(self, record):
        payload = {
            'ts': datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'msg': record.getMessage(),
        }
        for key in ('request_id', 'chama_id', 'user_id', 'method', 'path',
                    'status', 'duration_ms', 'route'):
            val = getattr(record, key, None)
            if val is not None:
                payload[key] = val
        if record.exc_info:
            payload['exception'] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


# ------------------------------------------------------------------ setup
_CONFIGURED = False


def configure_logging(app=None):
    """Idempotent — safe to call from create_app()."""
    global _CONFIGURED
    if _CONFIGURED:
        return

    env = (os.environ.get('FLASK_ENV') or 'development').lower()
    log_format = os.environ.get('LOG_FORMAT', '').lower()
    is_prod = env == 'production' or log_format == 'json'
    level = os.environ.get('LOG_LEVEL') or ('INFO' if is_prod else 'DEBUG')

    root = logging.getLogger()
    root.setLevel(level)

    # Remove any default handlers Flask pre-installed
    for h in list(root.handlers):
        root.removeHandler(h)

    # ---- console handler ----
    console = logging.StreamHandler(sys.stdout)
    if is_prod:
        console.setFormatter(JsonFormatter())
    else:
        use_color = sys.stdout.isatty()
        console.setFormatter(HumanFormatter(use_color=use_color))
    console.setLevel(level)
    root.addHandler(console)

    # ---- rotating file handler (optional, enabled by LOG_FILE) ----
    log_file = os.environ.get('LOG_FILE')
    if log_file:
        os.makedirs(os.path.dirname(log_file) or '.', exist_ok=True)
        file_handler = RotatingFileHandler(
            log_file, maxBytes=10 * 1024 * 1024, backupCount=5, encoding='utf-8',
        )
        file_handler.setFormatter(JsonFormatter() if is_prod else HumanFormatter(False))
        file_handler.setLevel(level)
        root.addHandler(file_handler)

    # ---- quiet noisy libraries ----
    logging.getLogger('werkzeug').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy.pool').setLevel(logging.WARNING)
    logging.getLogger('alembic').setLevel(logging.WARNING)
    logging.getLogger('urllib3').setLevel(logging.WARNING)

    # ---- our own packages ----
    logging.getLogger('app').setLevel(logging.DEBUG if not is_prod else logging.INFO)

    _CONFIGURED = True