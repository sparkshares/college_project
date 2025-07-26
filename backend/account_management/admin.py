from django.contrib import admin
from .models import UserFiles, FileDownloadTransaction, AiSummaries, UserProfile, FileChunk

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'phone_number', 'created_at')
    search_fields = ('user__username', 'full_name', 'phone_number')
    list_filter = ('created_at', 'updated_at')

@admin.register(UserFiles)
class UserFilesAdmin(admin.ModelAdmin):
    list_display = ('id', 'file_title', 'user', 'uploaded_at', 'file_name', 'file_size', 'is_upload_complete', 'upload_id')
    search_fields = ('file_title', 'user__username', 'file_name', 'upload_id')
    list_filter = ('user', 'uploaded_at', 'is_upload_complete')

@admin.register(FileChunk)
class FileChunkAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_file', 'chunk_number', 'chunk_size', 'is_uploaded', 'uploaded_at')
    search_fields = ('user_file__file_title', 'user_file__upload_id')
    list_filter = ('is_uploaded', 'uploaded_at')
    ordering = ('user_file', 'chunk_number')

@admin.register(FileDownloadTransaction)
class FileDownloadTransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'file', 'user', 'timestamp', 'ip_address', 'user_agent')
    search_fields = ('file__file_title', 'user__username', 'ip_address', 'user_agent')
    list_filter = ('user', 'timestamp')

@admin.register(AiSummaries)
class AiSummariesAdmin(admin.ModelAdmin):
    list_display = ('id', 'file', 'created_at', 'updated_at')
    search_fields = ('file__file_title', 'summary')
    list_filter = ('created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')