import os
import smtplib
import logging
import requests
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication

logger = logging.getLogger(__name__)

# --- CONFIGURATION (Environment Variables) ---
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://frames-smartattendance.vercel.app")

# SendGrid Config
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
SENDGRID_SENDER = os.getenv("SENDGRID_SENDER", "framessys01@gmail.com")
SUPPORT_EMAIL = "framessys01@gmail.com"


def is_smtp_configured() -> bool:
    """Check if SMTP credentials are set."""
    return bool(SMTP_EMAIL and SMTP_PASSWORD)


def is_sendgrid_configured() -> bool:
    """Check if SendGrid API key is set."""
    return bool(SENDGRID_API_KEY)


def is_email_service_configured() -> bool:
    """Check if any email service (SendGrid or SMTP) is configured."""
    return is_sendgrid_configured() or is_smtp_configured()


# =============================================================================
# 1. PASSWORD RESET (SMTP or SendGrid fallback)
# =============================================================================
def send_password_reset_email(recipient_email: str, recipient_name: str, reset_token: str) -> bool:
    """Sends a password reset email using SendGrid (preferred) or legacy SMTP."""
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    subject = "FRAMES — Password Reset Request"
    
    html_body = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
        <div style="background: linear-gradient(135deg, #1a2332, #1e3a5f); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #4fc3f7; margin: 0; font-size: 28px; letter-spacing: 2px;">FRAMES</h1>
        </div>
        <div style="background: #ffffff; padding: 32px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
            <p>Hi <strong>{recipient_name}</strong>,</p>
            <p>We received a request to reset your password. Click the button below to create a new one. Expires in 1 hour.</p>
            <div style="text-align: center; margin: 28px 0;">
                <a href="{reset_link}" style="background: #1e88e5; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reset Password</a>
            </div>
        </div>
    </div>
    """

    # 1. Try SendGrid first if configured
    if is_sendgrid_configured():
        url = "https://api.sendgrid.com/v3/mail/send"
        headers = {"Authorization": f"Bearer {SENDGRID_API_KEY}", "Content-Type": "application/json"}
        payload = {
            "personalizations": [{"to": [{"email": recipient_email}], "subject": subject}],
            "from": {"email": SENDGRID_SENDER, "name": "FRAMES System"},
            "content": [{"type": "text/html", "value": html_body}]
        }
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=10)
            if resp.status_code in (200, 202):
                logger.info("Password reset email sent via SendGrid to %s", recipient_email)
                return True
            logger.warning("SendGrid failed to send reset email: %s", resp.text)
        except Exception as e:
            logger.error("SendGrid error (reset): %s", str(e))

    # 2. Fallback to SMTP
    if is_smtp_configured():
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"FRAMES System <{SMTP_EMAIL}>"
        msg["To"] = recipient_email
        msg.attach(MIMEText(html_body, "html"))

        try:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                server.ehlo(); server.starttls(); server.ehlo()
                server.login(SMTP_EMAIL, SMTP_PASSWORD)
                server.sendmail(SMTP_EMAIL, recipient_email, msg.as_string())
            logger.info("Password reset email sent via SMTP to %s", recipient_email)
            return True
        except Exception as e:
            logger.error("SMTP failed to send reset email: %s", str(e))
            return False

    logger.error("No email service (SendGrid or SMTP) configured for password reset")
    return False


# =============================================================================
# 2. ACCOUNT APPROVAL (SendGrid)
# =============================================================================
def send_approval_email(email: str, first_name: str, role: str) -> bool:
    """Send an account approval notification email via SendGrid."""
    if not is_sendgrid_configured():
        logger.error("SendGrid not configured for approval emails")
        return False

    url = "https://api.sendgrid.com/v3/mail/send"
    headers = {"Authorization": f"Bearer {SENDGRID_API_KEY}", "Content-Type": "application/json"}
    
    role_display = "Department Head" if role == "HEAD" else role.capitalize()
    
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0F172A; padding: 32px; text-align: center; color: white;">
            <h1>FRAMES</h1>
        </div>
        <div style="padding: 32px;">
            <h2>Account Approved \u2705</h2>
            <p>Hello {first_name},</p>
            <p>Your {role_display} account has been approved. You can now log in.</p>
            <a href="{FRONTEND_URL}" style="display: inline-block; background: #0F172A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Log In</a>
        </div>
    </div>
    """

    payload = {
        "personalizations": [{"to": [{"email": email}], "subject": "Your FRAMES Account has been Approved \u2705"}],
        "from": {"email": SENDGRID_SENDER, "name": "FRAMES System"},
        "content": [{"type": "text/html", "value": html_content}]
    }

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
        return resp.status_code in (200, 202)
    except Exception as e:
        logger.error("SendGrid error (approval): %s", str(e))
        return False


def send_invite_email(email: str, invite_link: str, department_name: str) -> bool:
    """Send a faculty invitation email."""
    subject = f"Invitation to join {department_name} on FRAMES"
    
    html_content = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
        <div style="background: linear-gradient(135deg, #1a2332, #1e3a5f); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #4fc3f7; margin: 0; font-size: 28px; letter-spacing: 2px;">FRAMES</h1>
        </div>
        <div style="background: #ffffff; padding: 32px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
            <p>Hello,</p>
            <p>You have been invited to join the <strong>{department_name}</strong> department as a Faculty Member on FRAMES.</p>
            <p>Click the button below to complete your registration. This link will expire in 48 hours.</p>
            <div style="text-align: center; margin: 28px 0;">
                <a href="{invite_link}" style="background: #1e88e5; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Complete Registration</a>
            </div>
            <p style="color: #666; font-size: 14px;">If the button above doesn't work, copy and paste this link into your browser:</p>
            <p style="color: #1e88e5; font-size: 12px; word-break: break-all;">{invite_link}</p>
        </div>
    </div>
    """

    # 1. Try SendGrid first if configured
    if is_sendgrid_configured():
        url = "https://api.sendgrid.com/v3/mail/send"
        headers = {"Authorization": f"Bearer {SENDGRID_API_KEY}", "Content-Type": "application/json"}
        payload = {
            "personalizations": [{"to": [{"email": email}], "subject": subject}],
            "from": {"email": SENDGRID_SENDER, "name": "FRAMES System"},
            "content": [{"type": "text/html", "value": html_content}]
        }
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=10)
            if resp.status_code in (200, 202):
                logger.info("Invite email sent via SendGrid to %s", email)
                return True
        except Exception as e:
            logger.error("SendGrid error (invite): %s", str(e))

    # 2. Fallback to SMTP
    if is_smtp_configured():
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"FRAMES System <{SMTP_EMAIL}>"
        msg["To"] = email
        msg.attach(MIMEText(html_content, "html"))

        try:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                server.ehlo(); server.starttls(); server.ehlo()
                server.login(SMTP_EMAIL, SMTP_PASSWORD)
                server.sendmail(SMTP_EMAIL, email, msg.as_string())
            logger.info("Invite email sent via SMTP to %s", email)
            return True
        except Exception as e:
            logger.error("SMTP failed to send invite email: %s", str(e))
            return False

    logger.error("No email service configured for invites")
    return False


# =============================================================================
# 3. SUPPORT TICKET (SendGrid with Attachments)
# =============================================================================
def send_support_ticket_email(user_name: str, user_email: str, subject: str, message: str, file_paths: list = None) -> bool:
    """
    Send support ticket details to framessys01@gmail.com via SendGrid.
    Includes evidence files as attachments.
    """
    if not is_sendgrid_configured():
        logger.error("SendGrid not configured for support tickets")
        return False

    url = "https://api.sendgrid.com/v3/mail/send"
    headers = {"Authorization": f"Bearer {SENDGRID_API_KEY}", "Content-Type": "application/json"}

    html_content = f"""
    <div style="font-family: sans-serif;">
        <h2>New Support Ticket Received</h2>
        <p><strong>From:</strong> {user_name} ({user_email})</p>
        <p><strong>Subject:</strong> {subject}</p>
        <hr>
        <p style="white-space: pre-wrap;">{message}</p>
        <hr>
        <p><small>Sent via FRAMES Support Module</small></p>
    </div>
    """

    attachments = []
    if file_paths:
        for path in file_paths:
            # path is relative to 'uploads'
            abs_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", path)
            if os.path.exists(abs_path):
                with open(abs_path, "rb") as f:
                    data = f.read()
                    encoded = base64.b64encode(data).decode()
                
                filename = os.path.basename(abs_path)
                ext = filename.split(".")[-1].lower()
                content_type = "application/pdf" if ext == "pdf" else "image/jpeg"
                
                attachments.append({
                    "content": encoded,
                    "filename": filename,
                    "type": content_type,
                    "disposition": "attachment"
                })

    payload = {
        "personalizations": [{"to": [{"email": SUPPORT_EMAIL}], "subject": f"SUPPORT TICKET: {subject}"}],
        "from": {"email": SENDGRID_SENDER, "name": "FRAMES Support"},
        "reply_to": {"email": user_email, "name": user_name},
        "content": [{"type": "text/html", "value": html_content}],
    }
    
    if attachments:
        payload["attachments"] = attachments

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=20)
        return resp.status_code in (200, 202)
    except Exception as e:
        logger.error("SendGrid error (support): %s", str(e))
        return False
