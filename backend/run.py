# run.py
from dotenv import load_dotenv
load_dotenv()

import logging
import os

from app import create_app

app = create_app()
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "5000"))
    logger.info(
        "Starting Chametu dev server on http://%s:%s (debug=%s)",
        host, port, app.debug,
    )
    app.run(host=host, port=port, debug=True)