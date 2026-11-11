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


class IsSuperAdmin(IsActiveUser):
    """Restrict access to Super Admin users."""

    message = 'Super Admin privileges are required.'

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role == User.ROLE_SUPERADMIN
