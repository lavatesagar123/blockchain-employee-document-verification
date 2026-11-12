"""Shared AuditLogService used across Authentication, Companies, Documents, Verification, and Admin."""

from django.db.models import Q

from apps.common.utils import extract_client_ip, extract_user_agent
from apps.documents.models import DocumentAuditLog
from apps.superadmin.models import ActivityLog


class AuditLogService:
    """Centralized immutable audit log service for platform and document events."""

    @staticmethod
    def log(
        action: str,
        description: str,
        actor=None,
        target_type: str = ActivityLog.TARGET_ADMIN,
        target_id: str = '',
        metadata: dict | None = None,
        request=None,
    ) -> ActivityLog:
        actor_obj = actor if getattr(actor, 'is_authenticated', False) else None
        performed_by = actor_obj.email if actor_obj else 'System'
        return ActivityLog.objects.create(
            action=action,
            description=description,
            actor=actor_obj,
            performed_by=performed_by,
            target_type=target_type,
            target_id=str(target_id or ''),
            ip_address=extract_client_ip(request),
            metadata=metadata or {},
        )

    @staticmethod
    def log_document_event(document, user, action: str, request=None) -> DocumentAuditLog:
        return DocumentAuditLog.objects.create(
            document=document,
            user=user if getattr(user, 'is_authenticated', False) else None,
            action=action,
            ip_address=extract_client_ip(request),
            user_agent=extract_user_agent(request),
        )

    @staticmethod
    def list_activity_logs(action_filter: str = '', target_type: str = '', search: str = ''):
        qs = ActivityLog.objects.select_related('actor').all()
        if action_filter and action_filter != 'all':
            qs = qs.filter(action__iexact=action_filter.strip())
        if target_type and target_type != 'all':
            qs = qs.filter(target_type=target_type.strip().lower())
        if search and search.strip():
            term = search.strip()
            qs = qs.filter(
                Q(action__icontains=term)
                | Q(description__icontains=term)
                | Q(performed_by__icontains=term)
                | Q(target_id__icontains=term)
            )
        return qs.order_by('-created_at')

