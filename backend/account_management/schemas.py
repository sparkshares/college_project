from ninja import Schema
from typing import Optional
from datetime import date

class SignupIn(Schema):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    bio: Optional[str] = None

class LoginIn(Schema):
    email: str
    password: str

class TokenOut(Schema):
    access: str
    refresh: str

class UserProfileOut(Schema):
    bio: Optional[str] = None
    phone_number: Optional[str] = None
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    created_at: str
    updated_at: str

class UserProfileUpdateIn(Schema):
    bio: Optional[str] = None
    phone_number: Optional[str] = None
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None

class TokenOutWithProfile(Schema):
    access: str
    refresh: str
    profile: Optional[UserProfileOut] = None

class FileUploadIn(Schema):
    file_title: str

class ChunkedUploadInitIn(Schema):
    file_title: str
    file_name: str
    file_size: int  # Total file size in bytes
    total_chunks: int
    chunk_size: int  # Size of each chunk (except possibly the last one)

class ChunkedUploadChunkIn(Schema):
    upload_id: str
    chunk_number: int
    chunk_hash: Optional[str] = None  # MD5 hash for integrity check

class ChunkedUploadCompleteIn(Schema):
    upload_id: str

class ChunkedUploadStatusOut(Schema):
    upload_id: str
    file_title: str
    total_chunks: int
    uploaded_chunks: int
    is_complete: bool
    progress_percentage: float
    missing_chunks: Optional[list] = None

class UserFileOut(Schema):
    id: int
    file_title: str
    file_name: str
    file_size: str
    uploaded_at: str
    file_url: str
    upload_id: Optional[str] = None
    is_upload_complete: bool

class AiSummaryOut(Schema):
    id: int
    file_id: int
    file_title: str
    summary: str
    created_at: str

class GenerateSummaryIn(Schema):
    file_id: int
    max_length: Optional[int] = 200
    force_regenerate: Optional[bool] = False
