from django.contrib import admin
from .models import UserFiles, FileDownloadTransaction

@admin.register(UserFiles)
class UserFilesAdmin(admin.ModelAdmin):
    list_display = ('id', 'file_title', 'user', 'uploaded_at', 'file_name', 'file_size')
    search_fields = ('file_title', 'user__username', 'file_name')
    list_filter = ('user', 'uploaded_at')

@admin.register(FileDownloadTransaction)
class FileDownloadTransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'file', 'user', 'timestamp', 'ip_address', 'user_agent')
    search_fields = ('file__file_title', 'user__username', 'ip_address', 'user_agent')
    list_filter = ('user', 'timestamp')