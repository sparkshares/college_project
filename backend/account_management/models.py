from django.db import models
from django.contrib.auth.models import User

class UserFiles(models.Model):
    file_title = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='files')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    file = models.FileField(upload_to='user_files/')
    file_size = models.CharField(max_length=255)
    file_name = models.CharField(max_length=200)

    def __str__(self):
        return f"{self.file_title} ({self.user.username})"

    
class FileDownloadTransaction(models.Model):
    file = models.ForeignKey(UserFiles, on_delete=models.CASCADE, related_name='downloads')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='file_downloads')
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.CharField(max_length=45, blank=True, null=True)  # supports IPv6
    user_agent = models.CharField(max_length=512, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} downloaded {self.file.file_title} at {self.timestamp}"