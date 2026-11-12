from django.urls import path
from .views import (
    AdminActivityLogListView,
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

urlpatterns = [
    path('profile/', AdminProfileView.as_view(), name='admin-profile'),
    path('dashboard/stats/', AdminDashboardStatsView.as_view(), name='admin-dashboard-stats'),
    path('companies/stats/', AdminDashboardStatsView.as_view(), name='admin-company-stats'),
    path('companies/', AdminCompanyListView.as_view(), name='admin-company-list'),
    path('companies/<int:company_id>/', AdminCompanyDetailView.as_view(), name='admin-company-detail'),
    path(
        'companies/<int:company_id>/approve/',
        AdminCompanyModerationView.as_view(moderation_action='approve'),
        name='admin-company-approve',
    ),
    path(
        'companies/<int:company_id>/reject/',
        AdminCompanyModerationView.as_view(moderation_action='reject'),
        name='admin-company-reject',
    ),
    path(
        'companies/<int:company_id>/suspend/',
        AdminCompanyModerationView.as_view(moderation_action='suspend'),
        name='admin-company-suspend',
    ),
    path(
        'companies/<int:company_id>/reactivate/',
        AdminCompanyModerationView.as_view(moderation_action='reactivate'),
        name='admin-company-reactivate',
    ),
    path(
        'companies/<int:company_id>/documents/<str:doc_key>/download/',
        AdminCompanyVerificationDocDownloadView.as_view(),
        name='admin-company-doc-download',
    ),
    path('users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('users/<int:user_id>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('users/<int:user_id>/status/', AdminUserStatusView.as_view(), name='admin-user-status'),
    path('documents/', AdminDocumentListView.as_view(), name='admin-document-list'),
    path('documents/<str:identifier>/', AdminDocumentDetailView.as_view(), name='admin-document-detail'),
    path('documents/<str:identifier>/verify/', AdminDocumentVerifyView.as_view(), name='admin-document-verify'),
    path('documents/<str:identifier>/revoke/', AdminDocumentRevokeView.as_view(), name='admin-document-revoke'),
    path('activity-logs/', AdminActivityLogListView.as_view(), name='admin-activity-logs'),
]

