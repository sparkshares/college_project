from django.db import models
from django.contrib.auth.models import User

# User Profile extension
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(max_length=500, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    full_name = models.CharField(max_length=100, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

#Userfile models
class UserFiles(models.Model):
    file_title = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='files')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    file = models.FileField(upload_to='user_files/')
    file_size = models.CharField(max_length=255)
    file_name = models.CharField(max_length=200)
    
    # New fields for chunk upload support
    upload_id = models.CharField(max_length=100, unique=True, blank=True, null=True)  # Unique identifier for chunked upload
    is_upload_complete = models.BooleanField(default=False)  # Track if all chunks are uploaded
    total_chunks = models.IntegerField(blank=True, null=True)  # Total number of chunks expected
    uploaded_chunks = models.IntegerField(default=0)  # Number of chunks uploaded so far
    
    def __str__(self):
        return f"{self.file_title} ({self.user.username})"

class FileChunk(models.Model):
    """Model to track individual file chunks during upload"""
    user_file = models.ForeignKey(UserFiles, on_delete=models.CASCADE, related_name='chunks')
    chunk_number = models.IntegerField()  # Chunk sequence number (0-based)
    chunk_size = models.IntegerField()  # Size of this chunk in bytes
    chunk_hash = models.CharField(max_length=64, blank=True, null=True)  # MD5 hash for integrity check
    is_uploaded = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user_file', 'chunk_number')  # Ensure each chunk number is unique per file
        ordering = ['chunk_number']
    
    def __str__(self):
        return f"Chunk {self.chunk_number} of {self.user_file.file_title}"



class AiSummaries(models.Model):
    file = models.ForeignKey(UserFiles, on_delete=models.CASCADE, related_name='ai_summaries')
    summary = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Summary for {self.file.file_title}"
    
class FileDownloadTransaction(models.Model):
    file = models.ForeignKey(UserFiles, on_delete=models.CASCADE, related_name='downloads')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='file_downloads')
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.CharField(max_length=45, blank=True, null=True)  # supports IPv6
    user_agent = models.CharField(max_length=512, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} downloaded {self.file.file_title} at {self.timestamp}"