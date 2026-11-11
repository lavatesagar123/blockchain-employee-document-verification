"""Root URL configuration for TrustDoc Employee Panel backend."""

from django.contrib import admin
from django.urls import include, path
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'status': 'ok', 'service': 'trustdoc-employee-backend'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', HealthCheckView.as_view(), name='api-health'),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/employees/', include('apps.employees.urls')),
    path('api/employee/documents/', include('apps.documents.urls')),
    path('api/documents/', include('apps.documents.shared_urls')),
]
