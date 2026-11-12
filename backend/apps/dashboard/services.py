"""Shared DashboardService computing live KPI statistics across Admin, HR, and Employee portals."""

from django.contrib.auth import get_user_model
from django.db.models import Count

from apps.documents.models import IssuedDocument
from apps.documents.serializers import EmployeeDocumentSerializer
from apps.documents.services import DocumentService
from apps.employees.models import Company, EmployeeProfile
from apps.superadmin.models import ActivityLog

User = get_user_model()


class DashboardService:
    """Single source of truth for real-time database metrics across all three portals."""

    @staticmethod
    def get_admin_stats() -> dict:
        return {
            'total_companies': Company.objects.count(),
            'pending_companies': Company.objects.filter(status=Company.STATUS_PENDING).count(),
            'approved_companies': Company.objects.filter(status=Company.STATUS_APPROVED).count(),
            'rejected_companies': Company.objects.filter(status=Company.STATUS_REJECTED).count(),
            'suspended_companies': Company.objects.filter(status=Company.STATUS_SUSPENDED).count(),
            'total_hr_users': User.objects.filter(role=User.ROLE_HR).count(),
            'total_employees': EmployeeProfile.objects.count(),
            'total_users': User.objects.count(),
            'active_users': User.objects.filter(status=User.STATUS_ACTIVE).count(),
            'suspended_users': User.objects.filter(status=User.STATUS_SUSPENDED).count(),
            'total_documents': IssuedDocument.objects.count(),
            'verified_documents': IssuedDocument.objects.filter(
                status__in=[IssuedDocument.STATUS_VERIFIED, IssuedDocument.STATUS_ACTIVE]
            ).count(),
            'revoked_documents': IssuedDocument.objects.filter(status=IssuedDocument.STATUS_REVOKED).count(),
            'total_activity_logs': ActivityLog.objects.count(),
        }

    @staticmethod
    def get_hr_stats(company: Company) -> dict:
        emp_qs = EmployeeProfile.objects.filter(company=company)
        doc_qs = IssuedDocument.objects.filter(company=company)

        type_counts_raw = doc_qs.values('document_type').annotate(count=Count('id'))
        documents_by_type = {row['document_type']: row['count'] for row in type_counts_raw}
        recent_docs = doc_qs.select_related('company', 'employee_profile').order_by('-issue_date', '-created_at')[:5]

        return {
            'company_id': company.id,
            'company_name': company.name,
            'company_status': company.status,
            'total_employees': emp_qs.count(),
            'active_employees': emp_qs.filter(user__status=User.STATUS_ACTIVE).count(),
            'total_documents': doc_qs.count(),
            'verified_documents': doc_qs.filter(
                status__in=[IssuedDocument.STATUS_VERIFIED, IssuedDocument.STATUS_ACTIVE]
            ).count(),
            'revoked_documents': doc_qs.filter(status=IssuedDocument.STATUS_REVOKED).count(),
            'documents_by_type': documents_by_type,
            'recent_documents': EmployeeDocumentSerializer(recent_docs, many=True).data,
        }

    @staticmethod
    def get_employee_stats(user) -> dict:
        doc_qs = DocumentService.get_employee_documents(user=user)
        return {
            'total_documents': doc_qs.count(),
            'verified_documents': doc_qs.filter(
                status__in=[IssuedDocument.STATUS_VERIFIED, IssuedDocument.STATUS_ACTIVE]
            ).count(),
            'revoked_documents': doc_qs.filter(status=IssuedDocument.STATUS_REVOKED).count(),
            'recent_documents': EmployeeDocumentSerializer(doc_qs[:5], many=True).data,
        }

