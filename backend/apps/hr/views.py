"""Views for Company Registration/Profile, HR Profile, Workforce Directory, and HR Dashboard Stats."""

from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsApprovedHRAdmin, IsHRAdmin
from apps.employees.serializers import EmployeeProfileSerializer
from .serializers import (
    CompanyProfileSerializer,
    CompanyProfileUpdateSerializer,
    CompanyRegistrationSerializer,
    HREmployeeCreateSerializer,
    HREmployeeUpdateSerializer,
    HRProfileSerializer,
    HRProfileUpdateSerializer,
)
from .services import HRService


class CompanyRegisterView(APIView):
    """POST /api/companies/register/ — Register an organization and primary HR admin."""

    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = CompanyRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        company, _ = HRService.register_company_and_hr(serializer.validated_data)
        data = CompanyProfileSerializer(company).data
        data['message'] = 'Company registration submitted. Status is pending Super Admin review.'
        return Response(data, status=status.HTTP_201_CREATED)


class CompanyStatusView(APIView):
    """GET /api/companies/status/?query=... — Check registration audit status."""

    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get('query', '')
        company = HRService.get_company_by_query(query)
        return Response(CompanyProfileSerializer(company).data, status=status.HTTP_200_OK)


class CompanyProfileMeView(APIView):
    """GET/PATCH/PUT /api/companies/me/ — View or update HR's organization profile."""

    permission_classes = [IsHRAdmin]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        hr_profile = HRService.get_hr_profile(request.user)
        return Response(CompanyProfileSerializer(hr_profile.company).data, status=status.HTTP_200_OK)

    def patch(self, request):
        hr_profile = HRService.get_hr_profile(request.user)
        serializer = CompanyProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        updated_company = HRService.update_company_profile(hr_profile.company, serializer.validated_data)
        return Response(CompanyProfileSerializer(updated_company).data, status=status.HTTP_200_OK)

    def put(self, request):
        hr_profile = HRService.get_hr_profile(request.user)
        serializer = CompanyProfileUpdateSerializer(data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)

        updated_company = HRService.update_company_profile(hr_profile.company, serializer.validated_data)
        return Response(CompanyProfileSerializer(updated_company).data, status=status.HTTP_200_OK)


class HRProfileMeView(APIView):
    """GET/PATCH/PUT /api/hr/profile/ — View or update authenticated HR administrator profile."""

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
    """GET /api/hr/dashboard/stats/ — Live HR workspace metrics computed from database records."""

    permission_classes = [IsHRAdmin]

    def get(self, request):
        hr_profile = HRService.get_hr_profile(request.user)
        stats = HRService.get_hr_dashboard_stats(hr_profile.company)
        return Response(stats, status=status.HTTP_200_OK)


class HREmployeeListCreateView(APIView):
    """GET/POST /api/hr/employees/ — List, search, filter, and onboard company employees."""

    permission_classes = [IsApprovedHRAdmin]

    def get(self, request):
        hr_profile = request.user.hr_profile
        search = request.query_params.get('search', '')
        department = request.query_params.get('department', '')
        employment_type = request.query_params.get('employment_type', '')
        emp_status = request.query_params.get('status', '')

        employees = HRService.get_company_employees(
            company=hr_profile.company,
            search=search,
            department=department,
            employment_type=employment_type,
            emp_status=emp_status,
        )
        return Response(EmployeeProfileSerializer(employees, many=True).data, status=status.HTTP_200_OK)

    def post(self, request):
        hr_profile = request.user.hr_profile
        serializer = HREmployeeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile = HRService.onboard_employee_for_company(hr_profile.company, serializer.validated_data)
        return Response(EmployeeProfileSerializer(profile).data, status=status.HTTP_201_CREATED)


class HREmployeeDetailView(APIView):
    """GET/PATCH/PUT/DELETE /api/hr/employees/<identifier>/ — Manage a single company employee."""

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

