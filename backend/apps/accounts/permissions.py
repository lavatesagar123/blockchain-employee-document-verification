"""Role-based access control (RBAC) permission classes."""

from rest_framework.permissions import BasePermission
from .models import User


class IsActiveUser(BasePermission):
    """Ensure the authenticated user is active and not suspended."""

    message = 'Account is inactive or suspended.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and user.status == User.STATUS_ACTIVE
        )


class IsEmployee(IsActiveUser):
    """Restrict access exclusively to authenticated Employee users."""

    message = 'Employee role privileges are required to access this resource.'

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role == User.ROLE_EMPLOYEE


class IsHRAdmin(IsActiveUser):
    """Restrict access to HR Administrator users."""

    message = 'HR Administrator role privileges are required.'

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role == User.ROLE_HR


class IsApprovedHRAdmin(IsHRAdmin):
    """Restrict HR operational endpoints to HR Administrators of Super-Admin-approved companies."""

    message = 'Company registration is pending Super Admin approval. Operational HR features are locked.'

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        hr_profile = getattr(request.user, 'hr_profile', None)
        if not hr_profile or not hr_profile.company:
            return False
        return hr_profile.company.status == 'approved'


class IsSuperAdmin(IsActiveUser):
    """Restrict access to Super Admin users."""

    message = 'Super Admin privileges are required.'

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role == User.ROLE_SUPERADMIN
