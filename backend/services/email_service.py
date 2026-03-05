"""
Email Service for FRAMES.
Sends password reset emails via SMTP (Gmail or any SMTP provider).

Environment variables required:
  SMTP_EMAIL       - Sender email address (e.g., frames.capstone@gmail.com)
  SMTP_PASSWORD    - App password (NOT regular password — use Gmail App Password)
  SMTP_HOST        - SMTP server hostname (default: smtp.gmail.com)
  SMTP_PORT        - SMTP server port (default: 587 for TLS)
  FRONTEND_URL     - Frontend base URL for constructing reset links
"""
import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

# SMTP configuration — loaded from environment
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def is_email_configured() -> bool:
    """Check whether SMTP credentials are set."""
    return bool(SMTP_EMAIL and SMTP_PASSWORD)


def send_password_reset_email(recipient_email: str, recipient_name: str, reset_token: str) -> bool:
    """
    Send a password reset email with a one-time link.

    Args:
        recipient_email: The user's email address.
        recipient_name: The user's display name.
        reset_token: JWT reset token to embed in the link.

    Returns:
        True if sent successfully, False otherwise.
    """
    if not is_email_configured():
        logger.error("SMTP not configured — SMTP_EMAIL and SMTP_PASSWORD env vars are required")
        return False

    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"

    subject = "FRAMES — Password Reset Request"
    html_body = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
        <div style="background: linear-gradient(135deg, #1a2332, #1e3a5f); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #4fc3f7; margin: 0; font-size: 28px; letter-spacing: 2px;">FRAMES</h1>
            <p style="color: #b0bec5; margin: 4px 0 0; font-size: 13px;">Smart Campus Management System</p>
        </div>
        <div style="background: #ffffff; padding: 32px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #333; font-size: 15px; margin-top: 0;">Hi <strong>{recipient_name}</strong>,</p>
            <p style="color: #555; font-size: 14px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password.
                This link expires in <strong>1 hour</strong>.
            </p>
            <div style="text-align: center; margin: 28px 0;">
                <a href="{reset_link}"
                   style="background: #1e88e5; color: #fff; padding: 12px 32px; border-radius: 8px;
                          text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
                    Reset Password
                </a>
            </div>
            <p style="color: #888; font-size: 12px; line-height: 1.5;">
                If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="color: #aaa; font-size: 11px; text-align: center;">
                FRAMES &mdash; Facial Recognition Attendance &amp; Monitoring System<br>
                Technological University of the Philippines &mdash; Manila
            </p>
        </div>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"FRAMES System <{SMTP_EMAIL}>"
    msg["To"] = recipient_email

    # Plain-text fallback
    plain_body = (
        f"Hi {recipient_name},\n\n"
        f"We received a request to reset your FRAMES password.\n"
        f"Click this link to reset (expires in 1 hour):\n\n"
        f"{reset_link}\n\n"
        f"If you didn't request this, ignore this email.\n\n"
        f"— FRAMES System"
    )
    msg.attach(MIMEText(plain_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, recipient_email, msg.as_string())

        logger.info("Password reset email sent to %s", recipient_email)
        return True
    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP authentication failed — check SMTP_EMAIL and SMTP_PASSWORD")
        return False
    except smtplib.SMTPException as e:
        logger.exception("Failed to send password reset email to %s", recipient_email)
        return False
    except Exception:
        logger.exception("Unexpected error sending email to %s", recipient_email)
        return False
