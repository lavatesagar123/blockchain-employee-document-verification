from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsEmployee, IsHRAdmin, IsSuperAdmin
from apps.hr.services import HRService
from .services import DashboardService


class AdminDashboardView(APIView):
    """GET /api/dashboard/admin/ — Super Admin KPI telemetry."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        return Response(DashboardService.get_admin_stats(), status=status.HTTP_200_OK)


class HRDashboardView(APIView):
    """GET /api/dashboard/hr/ — HR workspace KPI telemetry."""

    permission_classes = [IsHRAdmin]

    def get(self, request):
        hr_profile = HRService.get_hr_profile(request.user)
        return Response(DashboardService.get_hr_stats(hr_profile.company), status=status.HTTP_200_OK)


class EmployeeDashboardView(APIView):
    """GET /api/dashboard/employee/ — Employee credential summary telemetry."""

    permission_classes = [IsEmployee]

    def get(self, request):
        return Response(DashboardService.get_employee_stats(request.user), status=status.HTTP_200_OK)

