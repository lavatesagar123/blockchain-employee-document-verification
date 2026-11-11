from django.contrib import admin
from .models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'action', 'performed_by', 'target_type', 'target_id', 'created_at')
    list_filter = ('action', 'target_type')
    search_fields = ('action', 'description', 'performed_by', 'target_id')
    readonly_fields = ('action', 'description', 'actor', 'performed_by', 'target_type', 'target_id', 'ip_address', 'metadata', 'created_at')

