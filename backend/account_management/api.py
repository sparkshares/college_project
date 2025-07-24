import os
import random
import string
from ninja import File, Form, NinjaAPI
from django.contrib.auth import authenticate, get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from ninja.files import UploadedFile
from ninja_jwt.authentication import JWTAuth
from project_main import settings
from .models import UserFiles, FileDownloadTransaction
from .schemas import SignupIn, LoginIn, TokenOut, FileUploadIn, UserFileOut
from .utils.encryption import encrypt_file_content, decrypt_file_content, AES_KEY, random_filename
from typing import List
from django.http import FileResponse, Http404, StreamingHttpResponse

api = NinjaAPI()
User = get_user_model()

#added signup api
@api.post("/signup")
def signup(request, data: SignupIn):
    if User.objects.filter(email=data.email).exists():
        return api.create_response(request, {"detail": "Email already exists"}, status=400)
    if User.objects.filter(username=data.username).exists():
        return api.create_response(request, {"detail": "Username already exists"}, status=400)
    user = User.objects.create_user(
        username=data.username,
        email=data.email,
        password=data.password
    )
    return {"detail": "User created successfully"}


#login api for authentication
@api.post("/login", response=TokenOut)
def login(request, data: LoginIn):
    try:
        user = User.objects.get(email=data.email)
    except User.DoesNotExist:
        return api.create_response(request, {"detail": "Invalid credentials"}, status=401)
    user = authenticate(username=user.username, password=data.password)
    if user is not None:
        refresh = RefreshToken.for_user(user)
        return {"access": str(refresh.access_token), "refresh": str(refresh)}
    else:
        return api.create_response(request, {"detail": "Invalid credentials"}, status=401)

@api.post("/upload-file", auth=JWTAuth())
def upload_file(
    request,
    file_title: str = Form(...),
    file: UploadedFile = File(...)
):
    user = request.user
    if not user.is_authenticated:
        return api.create_response(request, {"detail": "Authentication required"}, status=401)

    original_filename = file.name
    ext = os.path.splitext(original_filename)[1]
    new_file_name = random_filename(ext)

    # Read and encrypt file content
    file_bytes = file.read()
    encrypted_bytes = encrypt_file_content(file_bytes, AES_KEY)
    file_size = str(len(file_bytes))  # Record file size in bytes as string

    # Save encrypted content to a file in MEDIA_ROOT/user_files/
    encrypted_path = os.path.join('user_files', new_file_name)
    full_path = os.path.join(settings.MEDIA_ROOT, encrypted_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'wb') as f:
        f.write(encrypted_bytes)

    # Save DB record (using Django's FileField, you can use the relative path)
    user_file = UserFiles.objects.create(
        file_title=file_title,
        user=user,
        file=encrypted_path,  # Save relative path
        file_name=os.path.basename(original_filename),
        file_size=file_size
    )

    return {
        "detail": "File uploaded and encrypted successfully",
        "file_id": user_file.id,
        "file_name": user_file.file_name,
        "stored_file_path": user_file.file.url
    }

@api.get("/my-files", response=List[UserFileOut], auth=JWTAuth())
def list_user_files(request):
    user = request.user
    files = UserFiles.objects.filter(user=user).order_by('-uploaded_at')
    return [
        UserFileOut(
            id=f.id,
            file_title=f.file_title,
            file_name=f.file_name,
            uploaded_at=f.uploaded_at.isoformat(),
            file_url=request.build_absolute_uri(f.file.url)
        )
        for f in files
    ]

@api.get("/download-file/{file_id}", auth=JWTAuth())
def download_file(request, file_id: int):
    user = request.user
    print(f"Download requested: file_id={file_id}, user={user}")
    try:
        user_file = UserFiles.objects.get(id=file_id, user=user)
    except UserFiles.DoesNotExist:
        print(f"No file found in DB for file_id={file_id} and user={user}")
        raise Http404("File not found")

    encrypted_path = os.path.join(settings.MEDIA_ROOT, str(user_file.file))
    print(f"Resolved encrypted_path: {encrypted_path}")
    if not os.path.exists(encrypted_path):
        print(f"File does not exist on disk: {encrypted_path}")
        raise Http404(f"File not found on disk: {encrypted_path}")

    # Record the download transaction
    ip_address = request.META.get('REMOTE_ADDR')
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    FileDownloadTransaction.objects.create(
        file=user_file,
        user=user,
        ip_address=ip_address,
        user_agent=user_agent
    )

    def decrypted_file_generator():
        chunk_size = 8192  # 8KB
        with open(encrypted_path, "rb") as f:
            encrypted_bytes = f.read()
            try:
                decrypted_bytes = decrypt_file_content(encrypted_bytes, AES_KEY)
            except Exception as e:
                print(f"Decryption failed: {e}")
                raise Http404("Decryption failed")
            for i in range(0, len(decrypted_bytes), chunk_size):
                yield decrypted_bytes[i:i+chunk_size]

    response = StreamingHttpResponse(
        decrypted_file_generator(),
        content_type='application/octet-stream'
    )
    response['Content-Disposition'] = f'attachment; filename="{user_file.file_name}"'
    return response

@api.get("/account-stats", auth=JWTAuth())
def account_stats(request):
    user = request.user
    files = UserFiles.objects.filter(user=user)
    total_files = files.count()
    total_size = 0
    total_downloads = 0
    for f in files:
        try:
            total_size += int(f.file_size)
        except Exception:
            pass
        total_downloads += f.downloads.count()
    return {
        "total_files": total_files,
        "total_file_size": total_size,  # bytes
        "total_downloads": total_downloads
    }

@api.get("/download-reports", auth=JWTAuth())
def download_reports(request):
    user = request.user
    files = UserFiles.objects.filter(user=user)
    report = []
    for f in files:
        downloads = f.downloads.all()
        browser_counts = {}
        for d in downloads:
            agent = d.user_agent or "Unknown"
            # Simple browser extraction (can be improved)
            if "Chrome" in agent:
                browser = "Chrome"
            elif "Firefox" in agent:
                browser = "Firefox"
            elif "Safari" in agent and "Chrome" not in agent:
                browser = "Safari"
            elif "Edge" in agent:
                browser = "Edge"
            elif "MSIE" in agent or "Trident" in agent:
                browser = "Internet Explorer"
            else:
                browser = "Other"
            browser_counts[browser] = browser_counts.get(browser, 0) + 1
        report.append({
            "file_id": f.id,
            "file_title": f.file_title,
            "total_downloads": downloads.count(),
            "browsers": browser_counts
        })
    return report