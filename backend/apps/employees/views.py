"""Views for Employee Registration and Employee Profile Management."""

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsEmployee
from .serializers import (
    EmployeeProfileSerializer,
    EmployeeProfileUpdateSerializer,
    EmployeeRegistrationSerializer,
)
from .services import EmployeeService


class EmployeeRegisterView(APIView):
    """POST /api/employees/register/ — Register a new employee account and profile."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmployeeRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile = EmployeeService.register_employee(serializer.validated_data)
        return Response(
            {
                'message': 'Employee registration successful.',
                'profile': EmployeeProfileSerializer(profile).data,
            },
            status=status.HTTP_201_CREATED,
        )


class EmployeeProfileMeView(APIView):
    """GET/PATCH/PUT /api/employees/me/ — View or update authenticated employee profile."""

    permission_classes = [IsEmployee]

    def get(self, request):
        profile = EmployeeService.get_profile_for_user(request.user)
        return Response(EmployeeProfileSerializer(profile).data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = EmployeeProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        profile = EmployeeService.update_profile_for_user(request.user, serializer.validated_data)
        return Response(EmployeeProfileSerializer(profile).data, status=status.HTTP_200_OK)

    def put(self, request):
        serializer = EmployeeProfileUpdateSerializer(data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)

        profile = EmployeeService.update_profile_for_user(request.user, serializer.validated_data)
        return Response(EmployeeProfileSerializer(profile).data, status=status.HTTP_200_OK)
