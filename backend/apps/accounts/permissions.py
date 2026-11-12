"""Re-exports shared RBAC permissions from apps.common.permissions for backward compatibility."""

from apps.common.permissions import (  # noqa: F401
    IsActiveUser,
    IsApprovedHRAdmin,
    IsEmployee,
    IsHRAdmin,
    IsSuperAdmin,
)
