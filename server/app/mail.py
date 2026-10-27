"""Outgoing mail: SMTP (implicit TLS) when SMTP_HOST is set, otherwise the
local sendmail binary when SENDMAIL_PATH is set, otherwise a logged no-op
(dev and tests never send anything). Failures are logged, never raised: a lost
notification must not break a login.
"""

import logging
import smtplib
import ssl
import subprocess
import threading
from email.message import EmailMessage

from app.config import get_settings

log = logging.getLogger("mxtape.mail")


def send(to: str, subject: str, text: str) -> bool:
    s = get_settings()
    if not s.smtp_host and not s.sendmail_path:
        log.info("mail disabled, not sent: %r", subject)
        return False
    msg = EmailMessage()
    msg["From"] = s.mail_from
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text)
    try:
        if s.smtp_host:
            with smtplib.SMTP_SSL(s.smtp_host, s.smtp_port, context=ssl.create_default_context(), timeout=20) as smtp:
                smtp.login(s.smtp_user, s.smtp_pass)
                smtp.send_message(msg)
            return True
        subprocess.run([s.sendmail_path, "-t", "-i"], input=msg.as_bytes(), check=True, timeout=30)
        return True
    except Exception:
        log.exception("sendmail failed for %r", subject)
        return False


# Tests switch this off to observe the send synchronously.
BACKGROUND = True


def notify_new_request(name: str, email: str) -> None:
    """Fire and forget: the login redirect must not wait for SMTP."""
    s = get_settings()
    args = (
        s.notify_email,
        f"mxtape: {name or email} möchte mitspielen",
        f"Neue Anfrage auf mxtape:\n\n  {name}\n  {email}\n\n"
        f"Freischalten: {s.public_url.rstrip('/')}/admin\n",
    )
    if BACKGROUND:
        threading.Thread(target=lambda: send(*args), daemon=True).start()
    else:
        send(*args)
