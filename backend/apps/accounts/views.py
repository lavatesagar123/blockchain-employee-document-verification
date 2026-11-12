"""Authentication API views."""

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView

from .permissions import IsActiveUser
from .serializers import LoginSerializer, LogoutSerializer
from .services import AuthService


class LoginView(APIView):
    """POST /api/auth/login/ — Authenticate user and issue JWT tokens."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = AuthService.authenticate_user(
            identifier=serializer.validated_data['identifier'],
            password=serializer.validated_data['password'],
        )
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        tokens = AuthService.generate_tokens_for_user(user)
        user_payload = AuthService.build_user_payload(user)

        try:
            from apps.audit_logs.services import AuditLogService

            AuditLogService.log(
                action='User Login',
                description=f'{user.role.upper()} user {user.email} signed in.',
                actor=user,
                target_type='auth',
                target_id=str(user.id),
                request=request,
            )
        except Exception:
            pass

        return Response(
            {
                **tokens,
                'user': user_payload,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """POST /api/auth/logout/ — Blacklist refresh token and terminate session."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        AuthService.blacklist_refresh_token(serializer.validated_data.get('refresh'))
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    """GET /api/auth/me/ — Return authenticated user's profile and role metadata."""

    permission_classes = [IsActiveUser]

    def get(self, request):
        return Response(AuthService.build_user_payload(request.user), status=status.HTTP_200_OK)


class CustomTokenRefreshView(TokenRefreshView):
    """POST /api/auth/refresh/ — Refresh JWT access token."""

    permission_classes = [AllowAny]
