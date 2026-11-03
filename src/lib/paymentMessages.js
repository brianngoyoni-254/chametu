// frontend/src/lib/paymentMessages.js
/**
 * Maps IntaSend/M-Pesa failure reasons and statuses to professional,
 * user-facing copy. Keeps raw technical reasons out of the UI.
 */

const CANCEL_PATTERNS = [
  /cancel/i,
  /user (did )?not (enter|complete)/i,
  /request (was )?cancell?ed/i,
  /transaction (was )?cancell?ed/i,
  /declined/i,
  /timed? ?out/i,
  /timeout/i,
  /no response/i,
  /ds-?\d+.*cancel/i,
  /1037/,
  /1032/,
]

const INSUFFICIENT_PATTERNS = [
  /insufficient/i,
  /balance/i,
  /not enough/i,
  /low funds/i,
]

const INVALID_PATTERNS = [
  /invalid (phone|number|msisdn)/i,
  /wrong number/i,
  /not a safaricom/i,
]

export function friendlyFailureReason(raw, status) {
  const text = String(raw || '').trim()

  if (status === 'expired') {
    return 'We didn’t get a response from M-Pesa in time. No money was taken. Please try again.'
  }
  if (status === 'review') {
    return 'We received a payment that needs a quick manual check. Our team will confirm it shortly — no further action needed from you.'
  }
  if (!text) {
    return 'The payment was not completed and no money was taken. Please try again.'
  }

  if (CANCEL_PATTERNS.some((re) => re.test(text))) {
    return 'You cancelled the M-Pesa request, so no money was taken. You can try again whenever you’re ready.'
  }
  if (INSUFFICIENT_PATTERNS.some((re) => re.test(text))) {
    return 'M-Pesa reported insufficient funds, so the payment did not go through. Please top up and try again.'
  }
  if (INVALID_PATTERNS.some((re) => re.test(text))) {
    return 'That phone number could not receive the M-Pesa request. Please check the number and try again.'
  }

  return 'The payment was not completed and no money was taken. Please try again, or contact support@chametu.co.ke if it keeps failing.'
}