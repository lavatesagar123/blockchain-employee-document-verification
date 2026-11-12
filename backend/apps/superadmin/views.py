"""Compatibility re-exports for admin_panel and audit_logs views."""

from apps.admin_panel.views import (
    AdminCompanyDetailView,
    AdminCompanyListView,
    AdminCompanyModerationView,
    AdminCompanyVerificationDocDownloadView,
    AdminDashboardStatsView,
    AdminDocumentDetailView,
    AdminDocumentListView,
    AdminDocumentRevokeView,
    AdminDocumentVerifyView,
    AdminProfileView,
    AdminUserDetailView,
    AdminUserListView,
    AdminUserStatusView,
)
from apps.audit_logs.views import AdminActivityLogListView

__all__ = [
    'AdminActivityLogListView',
    'AdminCompanyDetailView',
    'AdminCompanyListView',
    'AdminCompanyModerationView',
    'AdminCompanyVerificationDocDownloadView',
    'AdminDashboardStatsView',
    'AdminDocumentDetailView',
    'AdminDocumentListView',
    'AdminDocumentRevokeView',
    'AdminDocumentVerifyView',
    'AdminProfileView',
    'AdminUserDetailView',
    'AdminUserListView',
    'AdminUserStatusView',
]
