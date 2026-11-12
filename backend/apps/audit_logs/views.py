from rest_framework.views import APIView

from apps.common.pagination import paginated_response
from apps.common.permissions import IsSuperAdmin
from .serializers import ActivityLogSerializer
from .services import AuditLogService


class AdminActivityLogListView(APIView):
    """GET /api/admin/activity-logs/ — Paginated platform audit history."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        logs = AuditLogService.list_activity_logs(
            action_filter=request.query_params.get('action', ''),
            target_type=request.query_params.get('target_type', ''),
            search=request.query_params.get('search', ''),
        )
        return paginated_response(request, logs, ActivityLogSerializer)

