"""Outgoing mail through the local sendmail binary (msmtp on the VPS).

Disabled (logged no-op) when SENDMAIL_PATH is empty, so dev and tests never
send anything. Failures are logged, never raised: a lost notification must not
break a login.
"""

import logging
import subprocess
from email.message import EmailMessage

from app.config import get_settings

log = logging.getLogger("mxster.mail")


def send(to: str, subject: str, text: str) -> bool:
    s = get_settings()
    if not s.sendmail_path:
        log.info("mail disabled, not sent: %r", subject)
        return False
    msg = EmailMessage()
    msg["From"] = s.mail_from
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text)
    try:
        subprocess.run([s.sendmail_path, "-t", "-i"], input=msg.as_bytes(), check=True, timeout=30)
        return True
    except Exception:
        log.exception("sendmail failed for %r", subject)
        return False


def notify_new_request(name: str, email: str) -> bool:
    s = get_settings()
    return send(
        s.notify_email,
        f"mxster: {name or email} möchte mitspielen",
        f"Neue Anfrage auf mxster:\n\n  {name}\n  {email}\n\n"
        f"Freischalten: {s.public_url.rstrip('/')}/admin\n",
    )
