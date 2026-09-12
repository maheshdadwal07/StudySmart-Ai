import logging

import resend
from resend.exceptions import ResendError

from app.config import settings

logger = logging.getLogger(__name__)


def _send_email(to_email: str, subject: str, content: str, message_type: str):
    if not settings.resend_api_key:
        logger.error("Cannot send %s email: RESEND_API_KEY is not configured", message_type)
        return

    resend.api_key = settings.resend_api_key
    params = {
        "from": f"{settings.email_from_name} <{settings.resend_from_email}>",
        "to": [to_email],
        "subject": subject,
        "text": content.strip(),
    }

    try:
        response = resend.Emails.send(params)
        logger.info("%s email accepted by Resend for %s (id=%s)", message_type, to_email, response.get("id", "unknown"))
    except ResendError as error:
        logger.error("Resend rejected %s email for %s: %s", message_type, to_email, error)
    except Exception:
        logger.exception("Unexpected failure sending %s email for %s", message_type, to_email)

def send_verification_email(to_email: str, otp: str):
    """
    Sends a 6-digit OTP to the specified email address for verification.
    Uses the Resend HTTPS API. Blocks synchronously, so should be called via BackgroundTasks.
    """
    content = f"""
Hello,

Thank you for signing up for StudySmart AI.

Please use the following 6-digit code to verify your email address. This code will expire in 10 minutes.

{otp}

Do not share this code with anyone.

Best regards,
The StudySmart AI Team
    """
    _send_email(to_email, "Verify your StudySmart account", content, "verification")

def send_password_reset_email(to_email: str, otp: str):
    """
    Sends a 6-digit OTP to the specified email address for password reset.
    Uses the Resend HTTPS API. Blocks synchronously, so should be called via BackgroundTasks.
    """
    content = f"""
Hello,

You recently requested to reset your password for your StudySmart account.

Please use the following 6-digit code to reset your password. This code will expire in 10 minutes.

{otp}

If you did not request a password reset, please ignore this email. Do not share this code with anyone.

Best regards,
The StudySmart AI Team
    """
    _send_email(to_email, "Reset your StudySmart password", content, "password reset")
