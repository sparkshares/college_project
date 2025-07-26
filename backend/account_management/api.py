import os
import random
import string
import logging
from ninja import File, Form, NinjaAPI
from django.contrib.auth import authenticate, get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from ninja.files import UploadedFile
from ninja_jwt.authentication import JWTAuth
from project_main import settings
from .models import UserFiles, FileDownloadTransaction, AiSummaries, UserProfile, FileChunk
from .schemas import (SignupIn, LoginIn, TokenOut, FileUploadIn, UserFileOut, AiSummaryOut, 
                     GenerateSummaryIn, UserProfileOut, UserProfileUpdateIn, TokenOutWithProfile,
                     ChunkedUploadInitIn, ChunkedUploadChunkIn, ChunkedUploadCompleteIn, ChunkedUploadStatusOut)
from .utils.encryption import encrypt_file_content, decrypt_file_content, AES_KEY, random_filename
from .utils.file_extractor import FileContentExtractor
from .utils.ai_summarizer import get_mistral_summarizer
from .utils.event_publisher import event_publisher
from .utils.celery_event_publisher import celery_event_publisher
from typing import List
from django.http import FileResponse, Http404, StreamingHttpResponse
from django.shortcuts import get_object_or_404
import logging

logger = logging.getLogger(__name__)

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
    
    # Create user profile if additional data is provided in signup
    if data.full_name or data.phone_number or data.bio:
        UserProfile.objects.create(
            user=user,
            full_name=data.full_name,
            phone_number=data.phone_number,
            bio=data.bio
        )
    
    # Publish user registration event to Go backend (using simple HTTP for development)
    try:
        user_data = {
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "registration_timestamp": user.date_joined.isoformat() + 'Z'
        }
        
        # Use simple HTTP event publishing (reliable and easier to debug)
        event_sent = event_publisher.publish_user_registered_event(user_data)
        if event_sent:
            logger.info(f"User registration event sent successfully for user: {user.username}")
        else:
            logger.warning(f"Failed to send user registration event for user: {user.username}")
            
    except Exception as e:
        logger.error(f"Error sending user registration event: {str(e)}")
        # Don't fail the registration if event publishing fails
    
    return {"detail": "User created successfully"}


#login api for authentication
@api.post("/login", response=TokenOutWithProfile)
def login(request, data: LoginIn):
    try:
        user = User.objects.get(email=data.email)
    except User.DoesNotExist:
        return api.create_response(request, {"detail": "Invalid credentials"}, status=401)
    
    user = authenticate(username=user.username, password=data.password)
    if user is not None:
        refresh = RefreshToken.for_user(user)
        
        # Get or create user profile
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        # Prepare profile data
        profile_data = None
        if profile:
            profile_data = UserProfileOut(
                bio=profile.bio,
                phone_number=profile.phone_number,
                full_name=profile.full_name or user.username,
                date_of_birth=profile.date_of_birth,
                created_at=profile.created_at.isoformat(),
                updated_at=profile.updated_at.isoformat()
            )
        
        # Publish user login event to Go backend (using Celery for reliability)
        try:
            from datetime import datetime
            user_data = {
                "user_id": user.id,
                "username": user.username,
                "email": user.email,
                "login_timestamp": datetime.utcnow().isoformat() + 'Z',
                "ip_address": request.META.get('REMOTE_ADDR', 'unknown')
            }
            
            # Use simple HTTP event publishing (reliable and easier to debug)
            event_sent = event_publisher.publish_user_login_event(user_data)
            if event_sent:
                logger.info(f"User login event sent successfully for user: {user.username}")
            else:
                logger.warning(f"Failed to send user login event for user: {user.username}")
                
        except Exception as e:
            logger.error(f"Error sending user login event: {str(e)}")
            # Don't fail the login if event publishing fails
        
        return {
            "access": str(refresh.access_token), 
            "refresh": str(refresh),
            "profile": profile_data
        }
    else:
        return api.create_response(request, {"detail": "Invalid credentials"}, status=401)

@api.get("/profile", response=UserProfileOut, auth=JWTAuth())
def get_user_profile(request):
    """Get current user's profile"""
    user = request.user
    profile, created = UserProfile.objects.get_or_create(user=user)
    
    return UserProfileOut(
        bio=profile.bio,
        phone_number=profile.phone_number,
        full_name=profile.full_name or user.username,
        date_of_birth=profile.date_of_birth,
        created_at=profile.created_at.isoformat(),
        updated_at=profile.updated_at.isoformat()
    )

@api.put("/profile", response=UserProfileOut, auth=JWTAuth())
def update_user_profile(request, data: UserProfileUpdateIn):
    """Update current user's profile"""
    user = request.user
    profile, created = UserProfile.objects.get_or_create(user=user)
    
    # Update only provided fields
    if data.bio is not None:
        profile.bio = data.bio
    if data.phone_number is not None:
        profile.phone_number = data.phone_number
    if data.full_name is not None:
        profile.full_name = data.full_name
    if data.date_of_birth is not None:
        profile.date_of_birth = data.date_of_birth
    
    profile.save()
    
    return UserProfileOut(
        bio=profile.bio,
        phone_number=profile.phone_number,
        full_name=profile.full_name or user.username,
        date_of_birth=profile.date_of_birth,
        created_at=profile.created_at.isoformat(),
        updated_at=profile.updated_at.isoformat()
    )

@api.patch("/profile", response=UserProfileOut, auth=JWTAuth())
def partial_update_user_profile(request, data: UserProfileUpdateIn):
    """Partially update current user's profile (same as PUT but semantically different)"""
    return update_user_profile(request, data)

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

# Chunked Upload Endpoints

@api.post("/upload-chunk/init", auth=JWTAuth())
def init_chunked_upload(request, data: ChunkedUploadInitIn):
    """Initialize a chunked file upload session"""
    import uuid
    
    user = request.user
    
    # Generate unique upload ID
    upload_id = str(uuid.uuid4())
    
    # Create initial UserFiles record
    user_file = UserFiles.objects.create(
        file_title=data.file_title,
        user=user,
        file_name=data.file_name,
        file_size=str(data.file_size),
        upload_id=upload_id,
        total_chunks=data.total_chunks,
        uploaded_chunks=0,
        is_upload_complete=False,
        file=""  # Will be set when upload is complete
    )
    
    return {
        "upload_id": upload_id,
        "file_id": user_file.id,
        "detail": "Chunked upload initialized successfully",
        "total_chunks": data.total_chunks,
        "chunk_size": data.chunk_size
    }


@api.post("/upload-chunk/complete", auth=JWTAuth())
def complete_chunked_upload(request, data: ChunkedUploadCompleteIn):
    """Complete a chunked upload by assembling all chunks"""
    user = request.user
    print(f"[DEBUG] Starting chunked upload completion for upload_id: {data.upload_id}, user: {user.username}")
    
    # Get the UserFiles record
    try:
        user_file = UserFiles.objects.get(upload_id=data.upload_id, user=user)
        print(f"[DEBUG] Found UserFiles record: {user_file.file_title}, total_chunks: {user_file.total_chunks}")
    except UserFiles.DoesNotExist:
        print(f"[DEBUG] ERROR: Upload session not found for upload_id: {data.upload_id}")
        return api.create_response(request, {"detail": "Upload session not found"}, status=404)
    
    if user_file.is_upload_complete:
        print(f"[DEBUG] ERROR: Upload already completed for upload_id: {data.upload_id}")
        return api.create_response(request, {"detail": "Upload already completed"}, status=400)
    
    # Check if all chunks are uploaded
    uploaded_chunks = FileChunk.objects.filter(user_file=user_file, is_uploaded=True).count()
    print(f"[DEBUG] Chunks status - uploaded: {uploaded_chunks}, total: {user_file.total_chunks}")
    
    if uploaded_chunks != user_file.total_chunks:
        missing_chunks = list(range(user_file.total_chunks))
        for chunk in FileChunk.objects.filter(user_file=user_file, is_uploaded=True):
            missing_chunks.remove(chunk.chunk_number)
        
        print(f"[DEBUG] ERROR: Missing chunks found - uploaded: {uploaded_chunks}, missing: {missing_chunks}")
        return api.create_response(request, {
            "detail": "Not all chunks uploaded",
            "uploaded_chunks": uploaded_chunks,
            "total_chunks": user_file.total_chunks,
            "missing_chunks": missing_chunks
        }, status=400)
    
    # Assemble chunks into final file
    chunks_dir = os.path.join(settings.MEDIA_ROOT, 'temp_chunks', data.upload_id)
    print(f"[DEBUG] Chunks directory: {chunks_dir}")
    print(f"[DEBUG] Chunks directory exists: {os.path.exists(chunks_dir)}")
    
    if os.path.exists(chunks_dir):
        chunk_files = os.listdir(chunks_dir)
        print(f"[DEBUG] Files in chunks directory: {chunk_files}")
    
    try:
        # Generate final filename
        ext = os.path.splitext(user_file.file_name)[1]
        final_filename = random_filename(ext)
        print(f"[DEBUG] Generated final filename: {final_filename}")
        
        # Assemble chunks in order
        assembled_data = b''
        total_assembled_size = 0
        
        for chunk_num in range(user_file.total_chunks):
            chunk_file_path = os.path.join(chunks_dir, f"chunk_{chunk_num:04d}")
            print(f"[DEBUG] Processing chunk {chunk_num}, path: {chunk_file_path}")
            
            if os.path.exists(chunk_file_path):
                chunk_size = os.path.getsize(chunk_file_path)
                print(f"[DEBUG] Chunk {chunk_num} size: {chunk_size} bytes")
                
                with open(chunk_file_path, 'rb') as f:
                    chunk_data = f.read()
                    assembled_data += chunk_data
                    total_assembled_size += len(chunk_data)
                    
                print(f"[DEBUG] Chunk {chunk_num} assembled, total size so far: {total_assembled_size} bytes")
            else:
                print(f"[DEBUG] ERROR: Chunk file not found: {chunk_file_path}")
                return api.create_response(request, {
                    "detail": f"Chunk {chunk_num} file not found"
                }, status=500)
        
        print(f"[DEBUG] Assembly complete - total assembled size: {len(assembled_data)} bytes")
        print(f"[DEBUG] Expected file size from DB: {user_file.file_size}")
        
        # Encrypt the assembled file
        print(f"[DEBUG] Starting encryption of assembled data...")
        encrypted_data = encrypt_file_content(assembled_data, AES_KEY)
        print(f"[DEBUG] Encryption complete - encrypted size: {len(encrypted_data)} bytes")
        
        # Save final encrypted file
        final_path = os.path.join('user_files', final_filename)
        full_final_path = os.path.join(settings.MEDIA_ROOT, final_path)
        print(f"[DEBUG] Final file path: {full_final_path}")
        
        os.makedirs(os.path.dirname(full_final_path), exist_ok=True)
        
        with open(full_final_path, 'wb') as f:
            f.write(encrypted_data)
            
        print(f"[DEBUG] Final encrypted file saved successfully")
        
        # Update UserFiles record
        user_file.file = final_path
        user_file.is_upload_complete = True
        user_file.save()
        print(f"[DEBUG] UserFiles record updated - marked as complete")
        
        # Clean up temporary chunk files
        import shutil
        if os.path.exists(chunks_dir):
            print(f"[DEBUG] Cleaning up temporary chunks directory: {chunks_dir}")
            shutil.rmtree(chunks_dir)
            print(f"[DEBUG] Cleanup complete")
        else:
            print(f"[DEBUG] Chunks directory not found for cleanup: {chunks_dir}")
        
        response_data = {
            "detail": "File upload completed successfully",
            "file_id": user_file.id,
            "file_name": user_file.file_name,
            "file_size": user_file.file_size,
            "upload_id": data.upload_id,
            "stored_file_path": user_file.file.url
        }
        print(f"[DEBUG] Success response: {response_data}")
        return response_data
        
    except Exception as e:
        print(f"[DEBUG] EXCEPTION in complete_chunked_upload: {str(e)}")
        print(f"[DEBUG] Exception type: {type(e).__name__}")
        import traceback
        print(f"[DEBUG] Full traceback: {traceback.format_exc()}")
        
        logger.error(f"Error completing chunked upload: {str(e)}")
        return api.create_response(request, {
            "detail": f"Error completing upload: {str(e)}"
        }, status=500)

@api.post("/upload-chunk/{upload_id}", auth=JWTAuth())
def upload_chunk(
    request,
    upload_id: str,
    chunk_number: int = Form(...),
    chunk_hash: str = Form(None),
    chunk: UploadedFile = File(...)
):
    """Upload a single chunk of a file"""
    import hashlib
    import os
    
    user = request.user
    
    # Get the UserFiles record
    try:
        user_file = UserFiles.objects.get(upload_id=upload_id, user=user)
    except UserFiles.DoesNotExist:
        return api.create_response(request, {"detail": "Upload session not found"}, status=404)
    
    if user_file.is_upload_complete:
        return api.create_response(request, {"detail": "Upload already completed"}, status=400)
    
    # Read chunk data
    chunk_data = chunk.read()
    chunk_size = len(chunk_data)
    
    # Verify chunk hash if provided
    if chunk_hash:
        calculated_hash = hashlib.md5(chunk_data).hexdigest()
        
        # Handle both full hash (32 chars) and truncated hash (8 chars)
        if len(chunk_hash) == 8:
            calculated_short_hash = calculated_hash[:8]
            if calculated_short_hash != chunk_hash:
                return api.create_response(request, {
                    "detail": f"Chunk integrity check failed. Expected: {chunk_hash}, Got: {calculated_short_hash}",
                    "full_calculated_hash": calculated_hash,
                    "chunk_size": chunk_size
                }, status=400)
        elif len(chunk_hash) == 32:
            if calculated_hash != chunk_hash:
                return api.create_response(request, {
                    "detail": f"Chunk integrity check failed. Expected: {chunk_hash}, Got: {calculated_hash}",
                    "chunk_size": chunk_size
                }, status=400)
        else:
            return api.create_response(request, {
                "detail": f"Invalid hash format. Expected 8 or 32 characters, got {len(chunk_hash)}"
            }, status=400)
    
    # Create temporary directory for chunks if it doesn't exist
    chunks_dir = os.path.join(settings.MEDIA_ROOT, 'temp_chunks', upload_id)
    os.makedirs(chunks_dir, exist_ok=True)
    
    # Save chunk to temporary file
    chunk_file_path = os.path.join(chunks_dir, f"chunk_{chunk_number:04d}")
    with open(chunk_file_path, 'wb') as f:
        f.write(chunk_data)
    
    # Create or update FileChunk record
    file_chunk, created = FileChunk.objects.get_or_create(
        user_file=user_file,
        chunk_number=chunk_number,
        defaults={
            'chunk_size': chunk_size,
            'chunk_hash': chunk_hash,
            'is_uploaded': True
        }
    )
    
    if not created and not file_chunk.is_uploaded:
        # Update existing chunk that wasn't uploaded before
        file_chunk.chunk_size = chunk_size
        file_chunk.chunk_hash = chunk_hash
        file_chunk.is_uploaded = True
        file_chunk.save()
        
        # Increment uploaded chunks count
        user_file.uploaded_chunks += 1
        user_file.save()
    elif created:
        # New chunk, increment uploaded chunks count
        user_file.uploaded_chunks += 1
        user_file.save()
    
    # Calculate progress
    progress = (user_file.uploaded_chunks / user_file.total_chunks) * 100 if user_file.total_chunks > 0 else 0
    
    return {
        "detail": f"Chunk {chunk_number} uploaded successfully",
        "upload_id": upload_id,
        "chunk_number": chunk_number,
        "uploaded_chunks": user_file.uploaded_chunks,
        "total_chunks": user_file.total_chunks,
        "progress_percentage": round(progress, 2),
        "is_complete": user_file.uploaded_chunks >= user_file.total_chunks
    }


@api.get("/upload-chunk/status/{upload_id}", auth=JWTAuth())
def get_upload_status(request, upload_id: str):
    """Get the status of a chunked upload"""
    user = request.user
    
    try:
        user_file = UserFiles.objects.get(upload_id=upload_id, user=user)
    except UserFiles.DoesNotExist:
        return api.create_response(request, {"detail": "Upload session not found"}, status=404)
    
    # Get missing chunks
    uploaded_chunk_numbers = set(
        FileChunk.objects.filter(user_file=user_file, is_uploaded=True)
        .values_list('chunk_number', flat=True)
    )
    missing_chunks = [i for i in range(user_file.total_chunks) if i not in uploaded_chunk_numbers]
    
    progress_percentage = round((user_file.uploaded_chunks / user_file.total_chunks) * 100, 2) if user_file.total_chunks > 0 else 0
    
    return ChunkedUploadStatusOut(
        upload_id=upload_id,
        file_title=user_file.file_title,
        total_chunks=user_file.total_chunks,
        uploaded_chunks=user_file.uploaded_chunks,
        is_complete=user_file.is_upload_complete,
        progress_percentage=progress_percentage,
        missing_chunks=missing_chunks if missing_chunks else None
    )

@api.delete("/upload-chunk/cancel/{upload_id}", auth=JWTAuth())
def cancel_chunked_upload(request, upload_id: str):
    """Cancel a chunked upload and clean up temporary files"""
    user = request.user
    
    try:
        user_file = UserFiles.objects.get(upload_id=upload_id, user=user)
    except UserFiles.DoesNotExist:
        return api.create_response(request, {"detail": "Upload session not found"}, status=404)
    
    if user_file.is_upload_complete:
        return api.create_response(request, {"detail": "Cannot cancel completed upload"}, status=400)
    
    # Clean up temporary chunk files
    chunks_dir = os.path.join(settings.MEDIA_ROOT, 'temp_chunks', upload_id)
    if os.path.exists(chunks_dir):
        import shutil
        shutil.rmtree(chunks_dir)
    
    # Delete FileChunk records
    FileChunk.objects.filter(user_file=user_file).delete()
    
    # Delete UserFiles record
    user_file.delete()
    
    return {
        "detail": "Upload cancelled and cleaned up successfully",
        "upload_id": upload_id
    }
    """Cancel a chunked upload and clean up"""
    user = request.user
    
    try:
        user_file = UserFiles.objects.get(upload_id=upload_id, user=user)
    except UserFiles.DoesNotExist:
        return api.create_response(request, {"detail": "Upload session not found"}, status=404)
    
    if user_file.is_upload_complete:
        return api.create_response(request, {"detail": "Cannot cancel completed upload"}, status=400)
    
    # Clean up temporary chunk files
    chunks_dir = os.path.join(settings.MEDIA_ROOT, 'temp_chunks', upload_id)
    if os.path.exists(chunks_dir):
        import shutil
        shutil.rmtree(chunks_dir)
    
    # Delete FileChunk records
    FileChunk.objects.filter(user_file=user_file).delete()
    
    # Delete UserFiles record
    user_file.delete()
    
    return {"detail": "Upload cancelled and cleaned up successfully"}

@api.post("/debug/chunk-hash", auth=JWTAuth())
def debug_chunk_hash(request, chunk: UploadedFile = File(...)):
    """Debug endpoint to check how server calculates hash for a chunk"""
    import hashlib
    
    chunk_data = chunk.read()
    full_hash = hashlib.md5(chunk_data).hexdigest()
    short_hash = full_hash[:8]
    
    return {
        "chunk_size": len(chunk_data),
        "full_md5_hash": full_hash,
        "short_md5_hash": short_hash,
        "first_16_bytes": chunk_data[:16].hex() if len(chunk_data) >= 16 else chunk_data.hex()
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
            file_size=f.file_size,
            uploaded_at=f.uploaded_at.isoformat(),
            file_url=request.build_absolute_uri(f.file.url) if f.file else "",
            upload_id=f.upload_id,
            is_upload_complete=f.is_upload_complete
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

@api.post("/generate-summary", auth=JWTAuth())
def generate_summary(request, data: GenerateSummaryIn):
    """Generate AI summary for a user's file"""
    logger.info(f"Summary generation requested for file_id: {data.file_id} by user: {request.user.username}")
    
    try:
        # Get the file and verify ownership
        user_file = get_object_or_404(UserFiles, id=data.file_id, user=request.user)
        logger.info(f"File found: {user_file.file_title}")
        
        # Check if summary already exists
        existing_summary = AiSummaries.objects.filter(file=user_file).first()
        if existing_summary:
            # Check if force regeneration is requested
            force_regenerate = getattr(data, 'force_regenerate', False)
            if not force_regenerate:
                logger.info(f"Returning existing summary for file_id: {data.file_id}")
                return {
                    "detail": "Summary already exists for this file",
                    "summary": {
                        "id": existing_summary.id,
                        "file_id": user_file.id,
                        "file_title": user_file.file_title,
                        "summary": existing_summary.summary,
                        "created_at": existing_summary.created_at.isoformat()
                    }
                }
            else:
                # Delete existing summary to regenerate
                logger.info(f"Force regenerating summary for file_id: {data.file_id}")
                existing_summary.delete()
        
        # Get the encrypted file path
        encrypted_file_path = os.path.join(settings.MEDIA_ROOT, str(user_file.file))
        
        # Check if file type is supported (using original filename)
        if not FileContentExtractor.is_supported_file(user_file.file_name):
            return api.create_response(request, {
                "detail": "File type not supported for text extraction. Supported types: PDF, DOCX, TXT, MD, PY, JS, HTML, CSS, JSON"
            }, status=400)
        
        # First decrypt the file content
        try:
            with open(encrypted_file_path, 'rb') as f:
                encrypted_bytes = f.read()
            
            # Decrypt the file content
            decrypted_bytes = decrypt_file_content(encrypted_bytes, AES_KEY)
            
            # Create a temporary file with the decrypted content
            import tempfile
            with tempfile.NamedTemporaryFile(suffix=os.path.splitext(user_file.file_name)[1], delete=False) as temp_file:
                temp_file.write(decrypted_bytes)
                temp_file_path = temp_file.name
            
            # Extract text content from the temporary decrypted file
            text_content = FileContentExtractor.extract_text_from_file(temp_file_path)
            
            # Clean up temporary file
            os.unlink(temp_file_path)
            if not text_content.strip():
                return api.create_response(request, {
                    "detail": "No text content found in the file"
                }, status=400)
        except Exception as e:
            logger.error(f"Error extracting text from file {user_file.file_name}: {str(e)}")
            return api.create_response(request, {
                "detail": f"Error extracting text from file: {str(e)}"
            }, status=500)
        
        # Generate summary using Mistral model
        try:
            # Limit text content to avoid memory issues and long processing times
            max_chars = 10000  # Limit to 10k characters for faster processing
            if len(text_content) > max_chars:
                text_content = text_content[:max_chars] + "\n\n[Text truncated for processing...]"
                logger.info(f"Text content truncated to {max_chars} characters")
            
            logger.info(f"Generating summary for {len(text_content)} characters of text")
            summarizer = get_mistral_summarizer()
            summary_text = summarizer.generate_summary(text_content, data.max_length)
            logger.info("Summary generated successfully")
                
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            return api.create_response(request, {
                "detail": f"Error generating summary: {str(e)}"
            }, status=500)
        
        # Save summary to database
        ai_summary = AiSummaries.objects.create(
            file=user_file,
            summary=summary_text
        )
        
        return {
            "detail": "Summary generated successfully",
            "summary": {
                "id": ai_summary.id,
                "file_id": user_file.id,
                "file_title": user_file.file_title,
                "summary": ai_summary.summary,
                "created_at": ai_summary.created_at.isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Unexpected error in generate_summary: {str(e)}")
        return api.create_response(request, {
            "detail": "An unexpected error occurred"
        }, status=500)

@api.get("/file-summary/{file_id}", auth=JWTAuth(), response=AiSummaryOut)
def get_file_summary(request, file_id: int):
    """Get AI summary for a specific file"""
    try:
        # Get the file and verify ownership
        user_file = get_object_or_404(UserFiles, id=file_id, user=request.user)
        
        # Get the summary
        ai_summary = get_object_or_404(AiSummaries, file=user_file)
        
        return {
            "id": ai_summary.id,
            "file_id": user_file.id,
            "file_title": user_file.file_title,
            "summary": ai_summary.summary,
            "created_at": ai_summary.created_at.isoformat()
        }
        
    except AiSummaries.DoesNotExist:
        return api.create_response(request, {
            "detail": "No summary found for this file. Generate one first."
        }, status=404)

@api.get("/my-summaries", auth=JWTAuth(), response=List[AiSummaryOut])
def list_user_summaries(request):
    """List all AI summaries for the authenticated user"""
    user_files = UserFiles.objects.filter(user=request.user)
    summaries = AiSummaries.objects.filter(file__in=user_files).select_related('file')
    
    return [
        {
            "id": summary.id,
            "file_id": summary.file.id,
            "file_title": summary.file.file_title,
            "summary": summary.summary,
            "created_at": summary.created_at.isoformat()
        }
        for summary in summaries
    ]

@api.delete("/delete-summary/{file_id}", auth=JWTAuth())
def delete_file_summary(request, file_id: int):
    """Delete AI summary for a specific file"""
    try:
        # Get the file and verify ownership
        user_file = get_object_or_404(UserFiles, id=file_id, user=request.user)
        
        # Get and delete the summary
        ai_summary = get_object_or_404(AiSummaries, file=user_file)
        ai_summary.delete()
        
        return {"detail": "Summary deleted successfully"}
        
    except AiSummaries.DoesNotExist:
        return api.create_response(request, {
            "detail": "No summary found for this file"
        }, status=404)

# Statistics APIs for Charts

@api.get("/statistics/daily-downloads", auth=JWTAuth())
def daily_downloads_stats(request):
    """Get daily download statistics for the last 7 days (for line chart)"""
    from datetime import datetime, timedelta
    from django.db.models import Count
    from django.utils import timezone
    
    user = request.user
    user_files = UserFiles.objects.filter(user=user)
    
    # Get last 7 days
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=6)
    
    daily_stats = []
    for i in range(7):
        current_date = start_date + timedelta(days=i)
        downloads_count = FileDownloadTransaction.objects.filter(
            file__in=user_files,
            timestamp__date=current_date
        ).count()
        
        daily_stats.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "day_name": current_date.strftime("%a"),  # Mon, Tue, etc.
            "download_count": downloads_count
        })
    
    return {
        "chart_type": "line_chart",
        "title": "Daily Downloads (Last 7 Days)",
        "data": daily_stats,
        "total_downloads": sum(stat["download_count"] for stat in daily_stats)
    }

@api.get("/statistics/daily-uploads", auth=JWTAuth())
def daily_uploads_stats(request):
    """Get daily file upload statistics for the last 7 days (for bar chart)"""
    from datetime import datetime, timedelta
    from django.utils import timezone
    
    user = request.user
    
    # Get last 7 days
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=6)
    
    daily_stats = []
    for i in range(7):
        current_date = start_date + timedelta(days=i)
        uploads_count = UserFiles.objects.filter(
            user=user,
            uploaded_at__date=current_date
        ).count()
        
        daily_stats.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "day_name": current_date.strftime("%a"),
            "upload_count": uploads_count
        })
    
    return {
        "chart_type": "bar_chart",
        "title": "Daily File Uploads (Last 7 Days)",
        "data": daily_stats,
        "total_uploads": sum(stat["upload_count"] for stat in daily_stats)
    }

@api.get("/statistics/device-downloads-pie", auth=JWTAuth())
def device_downloads_pie_chart(request):
    """Get device-based download statistics for pie chart"""
    from django.db.models import Count
    
    user = request.user
    user_files = UserFiles.objects.filter(user=user)
    
    downloads = FileDownloadTransaction.objects.filter(file__in=user_files)
    
    device_stats = {}
    total_downloads = 0
    
    for download in downloads:
        agent = download.user_agent or "Unknown"
        device = extract_device_from_user_agent(agent)
        device_stats[device] = device_stats.get(device, 0) + 1
        total_downloads += 1
    
    # Convert to percentage for pie chart
    pie_data = []
    for device, count in device_stats.items():
        percentage = round((count / total_downloads * 100), 1) if total_downloads > 0 else 0
        pie_data.append({
            "device": device,
            "count": count,
            "percentage": percentage
        })
    
    # Sort by count (descending)
    pie_data.sort(key=lambda x: x["count"], reverse=True)
    
    return {
        "chart_type": "pie_chart",
        "title": "Downloads by Device Type",
        "data": pie_data,
        "total_downloads": total_downloads
    }

@api.get("/statistics/device-downloads-bar", auth=JWTAuth())
def device_downloads_bar_chart(request):
    """Get device-based download statistics for bar chart"""
    user = request.user
    user_files = UserFiles.objects.filter(user=user)
    
    downloads = FileDownloadTransaction.objects.filter(file__in=user_files)
    
    device_stats = {}
    for download in downloads:
        agent = download.user_agent or "Unknown"
        device = extract_device_from_user_agent(agent)
        device_stats[device] = device_stats.get(device, 0) + 1
    
    # Convert to list format for bar chart
    bar_data = []
    for device, count in device_stats.items():
        bar_data.append({
            "device": device,
            "download_count": count
        })
    
    # Sort by count (descending)
    bar_data.sort(key=lambda x: x["download_count"], reverse=True)
    
    return {
        "chart_type": "bar_chart",
        "title": "Downloads by Device Type",
        "data": bar_data,
        "total_downloads": sum(item["download_count"] for item in bar_data)
    }

@api.get("/statistics/browser-downloads-pie", auth=JWTAuth())
def browser_downloads_pie_chart(request):
    """Get browser-based download statistics for pie chart"""
    user = request.user
    user_files = UserFiles.objects.filter(user=user)
    
    downloads = FileDownloadTransaction.objects.filter(file__in=user_files)
    
    browser_stats = {}
    total_downloads = 0
    
    for download in downloads:
        agent = download.user_agent or "Unknown"
        browser = extract_browser_from_user_agent(agent)
        browser_stats[browser] = browser_stats.get(browser, 0) + 1
        total_downloads += 1
    
    # Convert to percentage for pie chart
    pie_data = []
    for browser, count in browser_stats.items():
        percentage = round((count / total_downloads * 100), 1) if total_downloads > 0 else 0
        pie_data.append({
            "browser": browser,
            "count": count,
            "percentage": percentage
        })
    
    # Sort by count (descending)
    pie_data.sort(key=lambda x: x["count"], reverse=True)
    
    return {
        "chart_type": "pie_chart",
        "title": "Downloads by Browser",
        "data": pie_data,
        "total_downloads": total_downloads
    }

@api.get("/statistics/overview", auth=JWTAuth())
def statistics_overview(request):
    """Get complete statistics overview for dashboard"""
    from datetime import datetime, timedelta
    from django.utils import timezone
    
    user = request.user
    user_files = UserFiles.objects.filter(user=user)
    
    # Basic stats
    total_files = user_files.count()
    total_downloads = FileDownloadTransaction.objects.filter(file__in=user_files).count()
    
    # Calculate total file size
    total_size = 0
    for f in user_files:
        try:
            total_size += int(f.file_size)
        except:
            pass
    
    # Recent activity (last 7 days)
    last_week = timezone.now() - timedelta(days=7)
    recent_uploads = user_files.filter(uploaded_at__gte=last_week).count()
    recent_downloads = FileDownloadTransaction.objects.filter(
        file__in=user_files,
        timestamp__gte=last_week
    ).count()
    
    # Most downloaded file
    most_downloaded_file = None
    if user_files.exists():
        from django.db.models import Count
        most_downloaded = user_files.annotate(
            download_count=Count('downloads')
        ).order_by('-download_count').first()
        
        if most_downloaded:
            most_downloaded_file = {
                "file_title": most_downloaded.file_title,
                "download_count": most_downloaded.download_count
            }
    
    return {
        "overview": {
            "total_files": total_files,
            "total_downloads": total_downloads,
            "total_file_size_bytes": total_size,
            "total_file_size_mb": round(total_size / (1024 * 1024), 2),
            "recent_uploads_7_days": recent_uploads,
            "recent_downloads_7_days": recent_downloads,
            "most_downloaded_file": most_downloaded_file
        },
        "generated_at": timezone.now().isoformat()
    }

# Helper functions for device and browser extraction
def extract_device_from_user_agent(user_agent):
    """Extract device type from user agent string"""
    if not user_agent:
        return "Unknown"
    
    user_agent = user_agent.lower()
    
    if "mobile" in user_agent or "android" in user_agent or "iphone" in user_agent:
        if "android" in user_agent:
            return "Android Mobile"
        elif "iphone" in user_agent or "ios" in user_agent:
            return "iPhone"
        else:
            return "Mobile"
    elif "tablet" in user_agent or "ipad" in user_agent:
        if "ipad" in user_agent:
            return "iPad"
        else:
            return "Tablet"
    elif "windows" in user_agent:
        return "Windows Desktop"
    elif "mac" in user_agent and "iphone" not in user_agent and "ipad" not in user_agent:
        return "Mac Desktop"
    elif "linux" in user_agent:
        return "Linux Desktop"
    else:
        return "Desktop"

def extract_browser_from_user_agent(user_agent):
    """Extract browser from user agent string"""
    if not user_agent:
        return "Unknown"
    
    user_agent = user_agent.lower()
    
    if "chrome" in user_agent and "edg" not in user_agent:
        return "Chrome"
    elif "firefox" in user_agent:
        return "Firefox"
    elif "safari" in user_agent and "chrome" not in user_agent:
        return "Safari"
    elif "edg" in user_agent or "edge" in user_agent:
        return "Edge"
    elif "opera" in user_agent:
        return "Opera"
    elif "msie" in user_agent or "trident" in user_agent:
        return "Internet Explorer"
    else:
        return "Other"