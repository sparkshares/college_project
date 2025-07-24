import os
import secrets
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend

def random_filename(ext):
    return ''.join(secrets.choice('0123456789') for _ in range(10)) + ext

# WARNING: In production, store this key securely!
AES_KEY = b'0123456789abcdef0123456789abcdef'  # 32 bytes for AES-256

def encrypt_file_content(content: bytes, key: bytes) -> bytes:
    iv = secrets.token_bytes(16)
    padder = padding.PKCS7(128).padder()
    padded_data = padder.update(content) + padder.finalize()
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    encrypted = encryptor.update(padded_data) + encryptor.finalize()
    return iv + encrypted  # Prepend IV for later decryption

def decrypt_file_content(encrypted: bytes, key: bytes) -> bytes:
    iv = encrypted[:16]
    encrypted_data = encrypted[16:]
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    padded_data = decryptor.update(encrypted_data) + decryptor.finalize()
    unpadder = padding.PKCS7(128).unpadder()
    data = unpadder.update(padded_data) + unpadder.finalize()
    return data
