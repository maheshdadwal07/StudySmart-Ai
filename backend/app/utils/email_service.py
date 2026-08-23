import smtplib
from email.message import EmailMessage
import logging
from app.config import settings

logger = logging.getLogger(__name__)

def send_verification_email(to_email: str, otp: str):
    """
    Sends a 6-digit OTP to the specified email address for verification.
    Uses standard smtplib. Blocks synchronously, so should be called via BackgroundTasks.
    """
    if not settings.email_host:
        logger.warning("Email configuration missing. Simulating sending OTP to %s: %s", to_email, otp)
        return

    msg = EmailMessage()
    msg['Subject'] = 'Verify your StudySmart account'
    msg['From'] = f"{settings.email_from_name} <{settings.email_from}>"
    msg['To'] = to_email

    content = f"""
Hello,

Thank you for signing up for StudySmart AI.

Please use the following 6-digit code to verify your email address. This code will expire in 10 minutes.

{otp}

Do not share this code with anyone.

Best regards,
The StudySmart AI Team
    """
    msg.set_content(content)

    try:
        with smtplib.SMTP(settings.email_host, settings.email_port) as server:
            # Note: Many SMTP servers require EHLO/HELO before starttls, smtplib usually handles it
            server.starttls()
            if settings.email_username and settings.email_password:
                server.login(settings.email_username, settings.email_password)
            server.send_message(msg)
            logger.info("Verification email sent to %s", to_email)
    except Exception as e:
        logger.error("Failed to send verification email to %s: %s", to_email, str(e))
        # We do not raise the exception to prevent failing the entire request if email fails.
        # The user can request a resend later.

def send_password_reset_email(to_email: str, otp: str):
    """
    Sends a 6-digit OTP to the specified email address for password reset.
    Uses standard smtplib. Blocks synchronously, so should be called via BackgroundTasks.
    """
    if not settings.email_host:
        logger.warning("Email configuration missing. Simulating sending password reset OTP to %s: %s", to_email, otp)
        return

    msg = EmailMessage()
    msg['Subject'] = 'Reset your StudySmart password'
    msg['From'] = f"{settings.email_from_name} <{settings.email_from}>"
    msg['To'] = to_email

    content = f"""
Hello,

You recently requested to reset your password for your StudySmart account.

Please use the following 6-digit code to reset your password. This code will expire in 10 minutes.

{otp}

If you did not request a password reset, please ignore this email. Do not share this code with anyone.

Best regards,
The StudySmart AI Team
    """
    msg.set_content(content)

    try:
        with smtplib.SMTP(settings.email_host, settings.email_port) as server:
            server.starttls()
            if settings.email_username and settings.email_password:
                server.login(settings.email_username, settings.email_password)
            server.send_message(msg)
            logger.info("Password reset email sent to %s", to_email)
    except Exception as e:
        logger.error("Failed to send password reset email to %s: %s", to_email, str(e))
