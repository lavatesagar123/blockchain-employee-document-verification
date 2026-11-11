from django.urls import path
from .views import (
    DocumentDetailView,
    DocumentRevokeView,
    HRDocumentListCreateView,
    SecureDocumentDownloadView,
)

urlpatterns = [
    path('', HRDocumentListCreateView.as_view(), name='hr-document-list-create'),
    path('<str:identifier>/', DocumentDetailView.as_view(), name='document-detail'),
    path(
        '<str:identifier>/download/',
        SecureDocumentDownloadView.as_view(),
        name='document-download',
    ),
    path(
        '<str:identifier>/revoke/',
        DocumentRevokeView.as_view(),
        name='document-revoke',
    ),
]
