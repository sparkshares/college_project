from ninja import Schema
from typing import Optional

class SignupIn(Schema):
    username: str
    email: str
    password: str

class LoginIn(Schema):
    email: str
    password: str

class TokenOut(Schema):
    access: str
    refresh: str

class FileUploadIn(Schema):
    file_title: str

class UserFileOut(Schema):
    id: int
    file_title: str
    file_name: str
    uploaded_at: str
    file_url: str
