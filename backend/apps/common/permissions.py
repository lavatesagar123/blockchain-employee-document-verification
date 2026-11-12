"""Centralized Role-Based Access Control (RBAC) and ownership permissions."""

from django.contrib.auth import get_user_model
from rest_framework.permissions import BasePermission


class IsActiveUser(BasePermission):
    """Ensure the authenticated user is active and not suspended."""

    message = 'Account is inactive or suspended.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and user.status == 'active'
        )


class IsEmployee(IsActiveUser):
    """Restrict access exclusively to authenticated Employee users."""

    message = 'Employee role privileges are required to access this resource.'

    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'employee'


class IsHRAdmin(IsActiveUser):
    """Restrict access to HR Administrator users."""

    message = 'HR Administrator role privileges are required.'

    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'hr'


class IsApprovedHRAdmin(IsHRAdmin):
    """Restrict HR operational endpoints to HR Administrators of Super-Admin-approved companies."""

    message = 'Company registration is pending Super Admin approval. Operational HR features are locked.'

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        hr_profile = getattr(request.user, 'hr_profile', None)
        return bool(hr_profile and hr_profile.company and hr_profile.company.status == 'approved')


class IsSuperAdmin(IsActiveUser):
    """Restrict access to Super Admin users."""

    message = 'Super Admin privileges are required.'

    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'superadmin'


class IsDocumentOwnerOrAuthorized(IsActiveUser):
    """Ensure only the owning employee, issuing company HR, or Super Admin can inspect/download a document."""

    message = 'You do not have permission to access this employment document.'

    def has_object_permission(self, request, view, obj):
        if not self.has_permission(request, view):
            return False

        user = request.user
        User = get_user_model()

        if user.role == User.ROLE_SUPERADMIN:
            return True

        if user.role == User.ROLE_HR:
            hr_profile = getattr(user, 'hr_profile', None)
            return bool(hr_profile and hr_profile.company_id and obj.company_id == hr_profile.company_id)

        if user.role == User.ROLE_EMPLOYEE:
            profile = getattr(user, 'employee_profile', None)
            if profile and obj.employee_profile_id == profile.id:
                return True
            if obj.recipient_email and obj.recipient_email.strip().lower() == user.email.strip().lower():
                return True
            if (
                profile
                and profile.employee_id
                and obj.employee_id
                and obj.employee_id.strip().lower() == profile.employee_id.strip().lower()
            ):
                return True

        return False

