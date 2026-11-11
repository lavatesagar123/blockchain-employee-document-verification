"""Models for platform-wide Super Admin Activity Logs & Audit History."""

from django.conf import settings
from django.db import models


class ActivityLog(models.Model):
    """Immutable audit log tracking administrative, auth, company, and document events."""

    TARGET_AUTH = 'auth'
    TARGET_COMPANY = 'company'
    TARGET_USER = 'user'
    TARGET_DOCUMENT = 'document'
    TARGET_ADMIN = 'admin'

    TARGET_TYPE_CHOICES = [
        (TARGET_AUTH, 'Authentication'),
        (TARGET_COMPANY, 'Company'),
        (TARGET_USER, 'User'),
        (TARGET_DOCUMENT, 'Document'),
        (TARGET_ADMIN, 'Admin'),
    ]

    action = models.CharField(max_length=120, db_index=True)
    description = models.TextField()
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs',
    )
    performed_by = models.CharField(max_length=255, default='System')
    target_type = models.CharField(
        max_length=30,
        choices=TARGET_TYPE_CHOICES,
        default=TARGET_ADMIN,
        db_index=True,
    )
    target_id = models.CharField(max_length=100, blank=True, default='')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'activity_logs'
        ordering = ['-created_at']
        verbose_name = 'Activity Log'
        verbose_name_plural = 'Activity Logs'

    def __str__(self):
        return f'[{self.created_at}] {self.action} - {self.performed_by}'

