"""Compatibility re-exports for admin_panel, companies, and audit_logs serializers."""

from apps.admin_panel.serializers import (
    AdminDocumentDetailSerializer,
    AdminProfileSerializer,
    AdminProfileUpdateSerializer,
    AdminUserSerializer,
    AdminUserStatusSerializer,
    AdminUserUpdateSerializer,
)
from apps.audit_logs.serializers import ActivityLogSerializer
from apps.companies.serializers import (
    AdminCompanySerializer,
    CompanyActionRemarksSerializer,
)

__all__ = [
    'ActivityLogSerializer',
    'AdminCompanySerializer',
    'AdminDocumentDetailSerializer',
    'AdminProfileSerializer',
    'AdminProfileUpdateSerializer',
    'AdminUserSerializer',
    'AdminUserStatusSerializer',
    'AdminUserUpdateSerializer',
    'CompanyActionRemarksSerializer',
]
