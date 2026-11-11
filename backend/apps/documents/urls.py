from django.urls import path
from .views import (
    DocumentDetailView,
    EmployeeDocumentListView,
    SecureDocumentDownloadView,
)

urlpatterns = [
    path('', EmployeeDocumentListView.as_view(), name='employee-document-list'),
    path('<str:identifier>/', DocumentDetailView.as_view(), name='employee-document-detail'),
    path(
        '<str:identifier>/download/',
        SecureDocumentDownloadView.as_view(),
        name='employee-document-download',
    ),
]
