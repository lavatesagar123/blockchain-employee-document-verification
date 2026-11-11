"""Document-level ownership and role-based authorization permissions."""

from apps.accounts.models import User
from apps.accounts.permissions import IsActiveUser


class IsDocumentOwnerOrAuthorized(IsActiveUser):
    """Ensure only the owning employee (or authorized HR/Super Admin) can view or download a document."""

    message = 'You do not have permission to access this employment document.'

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not self.has_permission(request, view):
            return False

        if user.role == User.ROLE_SUPERADMIN:
            return True

        if user.role == User.ROLE_HR:
            hr_profile = getattr(user, 'hr_profile', None)
            if hr_profile and hr_profile.company_id and obj.company_id:
                return hr_profile.company_id == obj.company_id
            return False

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
