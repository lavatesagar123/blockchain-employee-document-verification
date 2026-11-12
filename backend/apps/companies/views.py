"""Public & HR Company views (registration, status lookup, and organization profile)."""

from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsHRAdmin
from apps.hr.services import HRService
from .serializers import (
    CompanyProfileSerializer,
    CompanyProfileUpdateSerializer,
    CompanyRegistrationSerializer,
)
from .services import CompanyService


class CompanyRegisterView(APIView):
    """POST /api/companies/register/ — Register an organization and primary HR admin."""

    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = CompanyRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        company, _ = CompanyService.register_company_and_hr(serializer.validated_data, request=request)
        data = CompanyProfileSerializer(company).data
        data['message'] = 'Company registration submitted. Status is pending Super Admin review.'
        return Response(data, status=status.HTTP_201_CREATED)


class CompanyStatusView(APIView):
    """GET /api/companies/status/?query=... — Check registration audit status."""

    permission_classes = [AllowAny]

    def get(self, request):
        company = CompanyService.get_company_by_query(request.query_params.get('query', ''))
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

        updated_company = CompanyService.update_company_profile(hr_profile.company, serializer.validated_data)
        return Response(CompanyProfileSerializer(updated_company).data, status=status.HTTP_200_OK)

    def put(self, request):
        hr_profile = HRService.get_hr_profile(request.user)
        serializer = CompanyProfileUpdateSerializer(data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)

        updated_company = CompanyService.update_company_profile(hr_profile.company, serializer.validated_data)
        return Response(CompanyProfileSerializer(updated_company).data, status=status.HTTP_200_OK)

