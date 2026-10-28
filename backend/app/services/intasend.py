# backend/app/services/intasend.py
import logging
import requests
from flask import current_app

logger = logging.getLogger(__name__)

def send_stk_push(phone_number, amount, api_ref, name="Chama Member"):
    """
    Sends an M-Pesa STK Push using IntaSend API.
    Requires INTASEND_SECRET_KEY in .env
    """
    secret_key = current_app.config.get('INTASEND_SECRET_KEY')
    
    if not secret_key:
        logger.warning("INTASEND_SECRET_KEY is missing. Skipping STK Push.")
        return {"status": "error", "message": "IntaSend keys not configured"}

    # IntaSend STK Push Endpoint
    url = "https://api.intasend.com/api/v1/payment/mpesa-stk-push/"
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "Authorization": f"Bearer {secret_key}"
    }
    
    payload = {
        "phone_number": phone_number,
        "amount": float(amount),
        "api_ref": str(api_ref),
        "name": name
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        data = response.json()
        
        if response.status_code in (200, 201):
            logger.info(f"IntaSend STK Push sent to {phone_number} for {amount}")
            return {"status": "success", "data": data}
        else:
            logger.error(f"IntaSend error: {data}")
            return {"status": "error", "message": data.get('detail', 'Failed to initiate STK Push')}
    except Exception as e:
        logger.exception(f"IntaSend Exception: {str(e)}")
        return {"status": "error", "message": str(e)}


def generate_checkout_link(amount, api_ref, name, email="support@chametu.co.ke"):
    """
    Generates a payment link for Card or M-Pesa Till using IntaSend Checkout API.
    Requires INTASEND_PUBLISHABLE_KEY in .env
    """
    public_key = current_app.config.get('INTASEND_PUBLISHABLE_KEY')
    
    if not public_key:
        logger.warning("INTASEND_PUBLISHABLE_KEY is missing. Skipping checkout link generation.")
        return {"status": "error", "message": "IntaSend keys not configured"}

    url = "https://api.intasend.com/api/v1/checkout/"
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
    }
    
    payload = {
        "public_key": public_key,
        "currency": "KES",
        "amount": float(amount),
        "email": email,
        "api_ref": str(api_ref),
        "host": current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        data = response.json()
        
        if response.status_code in (200, 201):
            logger.info(f"Checkout link generated for {amount}")
            return {"status": "success", "url": data.get('url')}
        else:
            logger.error(f"IntaSend Checkout error: {data}")
            return {"status": "error", "message": data.get('detail', 'Failed to generate checkout link')}
    except Exception as e:
        logger.exception(f"IntaSend Exception: {str(e)}")
        return {"status": "error", "message": str(e)}