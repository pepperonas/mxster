"""Password hashing with the standard library (scrypt), no extra dependency.

Stored as ``scrypt$n$r$p$salt$hash`` (salt and hash base64), so the cost can
be raised later without breaking existing hashes.
"""

import base64
import hashlib
import hmac
import secrets

N, R, P = 2**14, 8, 1
MIN_LEN = 8
MAX_LEN = 200


def _b64(raw: bytes) -> str:
    return base64.b64encode(raw).decode()


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=N, r=R, p=P, dklen=32)
    return f"scrypt${N}${R}${P}${_b64(salt)}${_b64(digest)}"


def verify_password(password: str, stored: str | None) -> bool:
    if not stored:
        return False
    try:
        algo, n, r, p, salt, digest = stored.split("$")
        if algo != "scrypt":
            return False
        want = base64.b64decode(digest)
        got = hashlib.scrypt(password.encode(), salt=base64.b64decode(salt), n=int(n), r=int(r), p=int(p), dklen=len(want))
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(got, want)


# Checked against when an address is unknown, so a miss costs as much time as a hit
DUMMY_HASH = hash_password(secrets.token_urlsafe(16))


def fingerprint(stored: str | None) -> str:
    """Short digest of the stored hash: a reset link carries it and dies once
    the password changes (single use without a token table)."""
    return hashlib.sha256((stored or "").encode()).hexdigest()[:16]
