"""HR views delegating shared telemetry & permissions to common and dashboard modules."""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsApprovedHRAdmin, IsHRAdmin
from apps.dashboard.services import DashboardService
from apps.employees.serializers import EmployeeProfileSerializer
from .serializers import (
    HREmployeeCreateSerializer,
    HREmployeeUpdateSerializer,
    HRProfileSerializer,
    HRProfileUpdateSerializer,
)
from .services import HRService


class HRProfileMeView(APIView):
    """GET/PATCH/PUT /api/hr/profile/."""

    permission_classes = [IsHRAdmin]

    def get(self, request):
        hr_profile = HRService.get_hr_profile(request.user)
        return Response(HRProfileSerializer(hr_profile).data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = HRProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        hr_profile = HRService.update_hr_profile(request.user, serializer.validated_data)
        return Response(HRProfileSerializer(hr_profile).data, status=status.HTTP_200_OK)

    def put(self, request):
        serializer = HRProfileUpdateSerializer(data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        hr_profile = HRService.update_hr_profile(request.user, serializer.validated_data)
        return Response(HRProfileSerializer(hr_profile).data, status=status.HTTP_200_OK)


class HRDashboardStatsView(APIView):
    """GET /api/hr/dashboard/stats/."""

    permission_classes = [IsHRAdmin]

    def get(self, request):
        hr_profile = HRService.get_hr_profile(request.user)
        return Response(DashboardService.get_hr_stats(hr_profile.company), status=status.HTTP_200_OK)


class HREmployeeListCreateView(APIView):
    """GET/POST /api/hr/employees/."""

    permission_classes = [IsApprovedHRAdmin]

    def get(self, request):
        hr_profile = request.user.hr_profile
        employees = HRService.get_company_employees(
            company=hr_profile.company,
            search=request.query_params.get('search', ''),
            department=request.query_params.get('department', ''),
            employment_type=request.query_params.get('employment_type', ''),
            emp_status=request.query_params.get('status', ''),
        )
        return Response(EmployeeProfileSerializer(employees, many=True).data, status=status.HTTP_200_OK)

    def post(self, request):
        hr_profile = request.user.hr_profile
        serializer = HREmployeeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile = HRService.onboard_employee_for_company(hr_profile.company, serializer.validated_data)
        return Response(EmployeeProfileSerializer(profile).data, status=status.HTTP_201_CREATED)


class HREmployeeDetailView(APIView):
    """GET/PATCH/PUT/DELETE /api/hr/employees/<identifier>/."""

    permission_classes = [IsApprovedHRAdmin]

    def get(self, request, identifier):
        hr_profile = request.user.hr_profile
        profile = HRService.get_company_employee_by_identifier(hr_profile.company, identifier)
        return Response(EmployeeProfileSerializer(profile).data, status=status.HTTP_200_OK)

    def patch(self, request, identifier):
        hr_profile = request.user.hr_profile
        profile = HRService.get_company_employee_by_identifier(hr_profile.company, identifier)
        serializer = HREmployeeUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        updated = HRService.update_company_employee(profile, serializer.validated_data)
        return Response(EmployeeProfileSerializer(updated).data, status=status.HTTP_200_OK)

    def put(self, request, identifier):
        hr_profile = request.user.hr_profile
        profile = HRService.get_company_employee_by_identifier(hr_profile.company, identifier)
        serializer = HREmployeeUpdateSerializer(data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)

        updated = HRService.update_company_employee(profile, serializer.validated_data)
        return Response(EmployeeProfileSerializer(updated).data, status=status.HTTP_200_OK)

    def delete(self, request, identifier):
        hr_profile = request.user.hr_profile
        profile = HRService.get_company_employee_by_identifier(hr_profile.company, identifier)
        HRService.update_company_employee(profile, {'status': 'suspended'})
        return Response(status=status.HTTP_204_NO_CONTENT)
