from django.urls import path
from .views import DocumentDetailView, SecureDocumentDownloadView

urlpatterns = [
    path('<str:identifier>/', DocumentDetailView.as_view(), name='document-detail'),
    path(
        '<str:identifier>/download/',
        SecureDocumentDownloadView.as_view(),
        name='document-download',
    ),
]
