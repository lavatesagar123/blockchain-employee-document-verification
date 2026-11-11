"""Authentication and session service layer."""

from django.contrib.auth import get_user_model
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

User = get_user_model()


class AuthService:
    """Encapsulates authentication, token issuance, and user payload construction."""

    @staticmethod
    def authenticate_user(identifier: str, password: str):
        """Authenticate by email or Employee ID and validate active status."""
        if not identifier or not password:
            raise AuthenticationFailed('Email/User ID and password are required.')

        clean_identifier = identifier.strip()
        user = User.objects.filter(email__iexact=clean_identifier).first()

        # Also support login via Employee ID (e.g. EMP-1001)
        if user is None:
            from apps.employees.models import EmployeeProfile

            profile = (
                EmployeeProfile.objects.select_related('user')
                .filter(employee_id__iexact=clean_identifier)
                .first()
            )
            if profile:
                user = profile.user

        if user is None or not user.check_password(password):
            raise AuthenticationFailed('Invalid email/User ID or password.')

        if not user.is_active or user.status != User.STATUS_ACTIVE:
            raise PermissionDenied('Your account has been suspended or deactivated.')

        return user

    @staticmethod
    def generate_tokens_for_user(user) -> dict:
        """Issue SimpleJWT refresh and access tokens with role metadata."""
        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role
        refresh['email'] = user.email
        refresh['name'] = user.name

        access_token = str(refresh.access_token)
        return {
            'access': access_token,
            'refresh': str(refresh),
            'token': access_token,
        }

    @staticmethod
    def blacklist_refresh_token(refresh_token: str | None) -> None:
        """Blacklist a refresh token upon logout when provided."""
        if not refresh_token:
            return
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            # Already expired or invalid; logout should still clear client session
            pass

    @staticmethod
    def build_user_payload(user) -> dict:
        """Build the authenticated user dictionary expected by the React frontend."""
        payload = {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'status': user.status,
            'date_joined': user.date_joined.isoformat() if user.date_joined else None,
        }

        if user.role == User.ROLE_EMPLOYEE:
            profile = getattr(user, 'employee_profile', None)
            if profile:
                company = profile.company
                company_name = company.name if company else profile.company_name
                payload.update({
                    'employee_id': profile.employee_id,
                    'phone': profile.phone,
                    'designation': profile.designation,
                    'department': profile.department,
                    'employment_type': profile.employment_type,
                    'location': profile.location,
                    'company_id': company.id if company else None,
                    'company_name': company_name,
                    'companyName': company_name,
                })

        return payload
