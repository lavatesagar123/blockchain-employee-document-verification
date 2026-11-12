"""Compatibility re-exports from shared audit_logs, companies, dashboard, verification, and admin_panel services."""

from apps.admin_panel.services import AdminPanelService
from apps.audit_logs.services import AuditLogService as ActivityLogService
from apps.companies.services import CompanyService
from apps.dashboard.services import DashboardService
from apps.verification.services import VerificationService


class SuperAdminService(AdminPanelService):
    """Backward-compatible facade delegating to modular domain services."""

    list_companies = staticmethod(CompanyService.list_companies)
    get_company_or_404 = staticmethod(CompanyService.get_company_or_404)
    moderate_company = staticmethod(CompanyService.moderate_company)
    get_company_verification_doc_stream = staticmethod(CompanyService.get_verification_doc_stream)
    verify_document_integrity = staticmethod(VerificationService.verify_document)
    get_platform_stats = staticmethod(DashboardService.get_admin_stats)
    list_activity_logs = staticmethod(ActivityLogService.list_activity_logs)


__all__ = ['ActivityLogService', 'SuperAdminService']
