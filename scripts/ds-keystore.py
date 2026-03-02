#!/usr/bin/env python3
"""
Encrypted keystore for DeepSeek API key.
Uses Fernet (AES-128-CBC + HMAC-SHA256) with a passphrase you choose.
The actual API key is NEVER written to disk in plaintext.

Commands:
  python3 ds-keystore.py set    — prompt for key + passphrase, encrypt and store
  python3 ds-keystore.py get    — decrypt and print key (for piping)
  python3 ds-keystore.py check  — verify a key is stored and decryptable

Stored at: ~/.config/ds-agent/key.enc  (encrypted blob + salt, no plaintext)
"""

import sys
import os
import base64
import getpass
import json
from pathlib import Path

try:
    from cryptography.fernet import Fernet, InvalidToken
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    from cryptography.hazmat.primitives import hashes
except ImportError:
    print("ERROR: pip install cryptography", file=sys.stderr)
    sys.exit(1)

STORE_PATH = Path.home() / ".config" / "ds-agent" / "key.enc"
ITERATIONS = 480_000  # OWASP recommended for PBKDF2-SHA256


def _derive_key(passphrase: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=ITERATIONS,
    )
    return base64.urlsafe_b64encode(kdf.derive(passphrase.encode()))


def save_key(api_key: str, passphrase: str):
    salt = os.urandom(32)
    fernet_key = _derive_key(passphrase, salt)
    token = Fernet(fernet_key).encrypt(api_key.encode())
    STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STORE_PATH.write_bytes(
        json.dumps({
            "salt": base64.b64encode(salt).decode(),
            "token": token.decode(),
        }).encode()
    )
    STORE_PATH.chmod(0o600)
    print(f"Key encrypted and stored at {STORE_PATH}")


def load_key(passphrase: str) -> str:
    if not STORE_PATH.exists():
        raise FileNotFoundError(f"No key stored at {STORE_PATH}. Run: python3 ds-keystore.py set")
    data = json.loads(STORE_PATH.read_bytes())
    salt = base64.b64decode(data["salt"])
    token = data["token"].encode()
    fernet_key = _derive_key(passphrase, salt)
    try:
        return Fernet(fernet_key).decrypt(token).decode()
    except InvalidToken:
        raise ValueError("Wrong passphrase or corrupted key file")


def cmd_set():
    api_key = getpass.getpass("DeepSeek API key (input hidden): ").strip()
    if not api_key:
        print("ERROR: empty key", file=sys.stderr)
        sys.exit(1)
    passphrase = getpass.getpass("Choose a passphrase to protect it: ")
    confirm = getpass.getpass("Confirm passphrase: ")
    if passphrase != confirm:
        print("ERROR: passphrases don't match", file=sys.stderr)
        sys.exit(1)
    save_key(api_key, passphrase)


def cmd_get():
    passphrase = getpass.getpass("Passphrase: ")
    print(load_key(passphrase))


def cmd_check():
    passphrase = getpass.getpass("Passphrase: ")
    key = load_key(passphrase)
    masked = key[:8] + "..." + key[-4:]
    print(f"OK — key decrypted successfully: {masked}")


# Public API for other scripts (no passphrase prompt when DEEPSEEK_PASSPHRASE is set)
def get_api_key() -> str:
    """Load the API key. Uses env var DEEPSEEK_PASSPHRASE if set, else prompts."""
    # 1. Plaintext env var takes priority (CI/CD, one-off runs)
    direct = os.environ.get("DEEPSEEK_API_KEY")
    if direct:
        return direct
    # 2. Encrypted store
    passphrase = os.environ.get("DEEPSEEK_PASSPHRASE") or getpass.getpass("Keystore passphrase: ")
    return load_key(passphrase)


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "check"
    if cmd == "set":
        cmd_set()
    elif cmd == "get":
        cmd_get()
    elif cmd == "check":
        cmd_check()
    else:
        print(__doc__)
        sys.exit(1)
