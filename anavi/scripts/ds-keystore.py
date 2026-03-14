#!/usr/bin/env python3
import os, sys, getpass, base64, json
try:
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    from cryptography.fernet import Fernet
except ImportError:
    print("Error: 'cryptography' package is missing. Install with 'pip install cryptography'.", file=sys.stderr)
    sys.exit(1)

KEY_FILE = os.path.expanduser("~/.config/ds-agent/key.enc")

def get_fernet(passphrase: str, salt: bytes) -> Fernet:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=390000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(passphrase.encode()))
    return Fernet(key)

def set_key():
    api_key = getpass.getpass("DeepSeek API Key: ")
    passphrase = getpass.getpass("Passphrase to encrypt key: ")
    salt = os.urandom(16)
    f = get_fernet(passphrase, salt)
    token = f.encrypt(api_key.encode())
    os.makedirs(os.path.dirname(KEY_FILE), exist_ok=True)
    with open(KEY_FILE, "wb") as out:
        out.write(salt + b"::" + token)
    os.chmod(KEY_FILE, 0o600)
    print("Key encrypted and saved to", KEY_FILE)

def get_key():
    if not os.path.exists(KEY_FILE):
        print("Key file not found.", file=sys.stderr)
        sys.exit(1)
    passphrase = getpass.getpass("Passphrase: ")
    with open(KEY_FILE, "rb") as inp:
        data = inp.read()
    if b"::" not in data:
        print("Invalid key file format.", file=sys.stderr)
        sys.exit(1)
    salt, token = data.split(b"::", 1)
    f = get_fernet(passphrase, salt)
    try:
        api_key = f.decrypt(token).decode()
        print(api_key)
    except Exception:
        print("Invalid passphrase.", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: ds-keystore.py [set|get]")
        sys.exit(1)
    if sys.argv[1] == "set":
        set_key()
    elif sys.argv[1] == "get":
        get_key()
