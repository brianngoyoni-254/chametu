# app/services/email_service.py
import logging
import requests
from flask import current_app

logger = logging.getLogger(__name__)

def send_email(to_email, subject, html_content):
    """
    Sends an email using the Brevo API.
    Requires BREVO_API_KEY and BREVO_SENDER_EMAIL in .env
    """
    api_key = current_app.config.get('BREVO_API_KEY')
    # Updated default fallback to your new Gmail address
    sender_email = current_app.config.get('BREVO_SENDER_EMAIL', 'chametu.co.ke@gmail.com')

    if not api_key:
        logger.warning("BREVO_API_KEY is not set. Skipping email to %s", to_email)
        return False

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": api_key
    }
    payload = {
        "sender": {"name": "Chametu", "email": sender_email},
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html_content
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 201:
            logger.info("Email sent successfully to %s", to_email)
            return True
        else:
            logger.error("Brevo API error: %s - %s", response.status_code, response.text)
            return False
    except Exception as e:
        logger.exception("Failed to send email to %s: %s", to_email, str(e))
        return False