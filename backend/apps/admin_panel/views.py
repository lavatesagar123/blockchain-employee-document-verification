"""Super Admin views reusing shared common, companies, verification, audit_logs, and dashboard services."""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit_logs.views import AdminActivityLogListView  # noqa: F401
from apps.common.pagination import paginated_response
from apps.common.permissions import IsSuperAdmin
from apps.common.utils import build_secure_download_response
from apps.companies.serializers import AdminCompanySerializer, CompanyActionRemarksSerializer
from apps.companies.services import CompanyService
from apps.dashboard.services import DashboardService
from apps.documents.serializers import DocumentRevokeSerializer, EmployeeDocumentSerializer
from apps.documents.services import DocumentService
from apps.verification.services import VerificationService
from .serializers import (
    AdminDocumentDetailSerializer,
    AdminProfileSerializer,
    AdminProfileUpdateSerializer,
    AdminUserSerializer,
    AdminUserStatusSerializer,
    AdminUserUpdateSerializer,
)
from .services import AdminPanelService


class AdminProfileView(APIView):
    """GET/PATCH/PUT /api/admin/profile/."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        return Response(AdminProfileSerializer(request.user).data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = AdminProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = AdminPanelService.update_admin_profile(request.user, serializer.validated_data, request=request)
        return Response(AdminProfileSerializer(updated).data, status=status.HTTP_200_OK)

    def put(self, request):
        serializer = AdminProfileUpdateSerializer(data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        updated = AdminPanelService.update_admin_profile(request.user, serializer.validated_data, request=request)
        return Response(AdminProfileSerializer(updated).data, status=status.HTTP_200_OK)


class AdminDashboardStatsView(APIView):
    """GET /api/admin/companies/stats/ or /api/admin/dashboard/stats/."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        return Response(DashboardService.get_admin_stats(), status=status.HTTP_200_OK)


class AdminCompanyListView(APIView):
    """GET /api/admin/companies/."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        companies = CompanyService.list_companies(
            status_filter=request.query_params.get('status', ''),
            search=request.query_params.get('search', ''),
        )
        return paginated_response(request, companies, AdminCompanySerializer)


class AdminCompanyDetailView(APIView):
    """GET /api/admin/companies/<int:company_id>/."""

    permission_classes = [IsSuperAdmin]

    def get(self, request, company_id):
        company = CompanyService.get_company_or_404(company_id)
        return Response(AdminCompanySerializer(company).data, status=status.HTTP_200_OK)


class AdminCompanyModerationView(APIView):
    """POST /api/admin/companies/<int:company_id>/<approve|reject|suspend|reactivate>/."""

    permission_classes = [IsSuperAdmin]
    moderation_action = None

    def post(self, request, company_id, moderation_action=None):
        serializer = CompanyActionRemarksSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        company = CompanyService.moderate_company(
            company_id=company_id,
            action=moderation_action or self.moderation_action,
            remarks=serializer.validated_data.get('remarks', ''),
            actor=request.user,
            request=request,
        )
        return Response(AdminCompanySerializer(company).data, status=status.HTTP_200_OK)


class AdminCompanyVerificationDocDownloadView(APIView):
    """GET /api/admin/companies/<int:company_id>/documents/<str:doc_key>/download/."""

    permission_classes = [IsSuperAdmin]

    def get(self, request, company_id, doc_key):
        company = CompanyService.get_company_or_404(company_id)
        stream, content_type, filename = CompanyService.get_verification_doc_stream(company, doc_key)
        return build_secure_download_response(stream, content_type, filename)


class AdminUserListView(APIView):
    """GET /api/admin/users/."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        users = AdminPanelService.list_users(
            role_filter=request.query_params.get('role', ''),
            status_filter=request.query_params.get('status', ''),
            search=request.query_params.get('search', ''),
        )
        return paginated_response(request, users, AdminUserSerializer)


class AdminUserDetailView(APIView):
    """GET/PATCH /api/admin/users/<int:user_id>/."""

    permission_classes = [IsSuperAdmin]

    def get(self, request, user_id):
        user = AdminPanelService.get_user_or_404(user_id)
        return Response(AdminUserSerializer(user).data, status=status.HTTP_200_OK)

    def patch(self, request, user_id):
        serializer = AdminUserUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = AdminPanelService.update_user_account(
            user_id=user_id,
            validated_data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return Response(AdminUserSerializer(user).data, status=status.HTTP_200_OK)


class AdminUserStatusView(APIView):
    """POST /api/admin/users/<int:user_id>/status/."""

    permission_classes = [IsSuperAdmin]

    def post(self, request, user_id):
        serializer = AdminUserStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = AdminPanelService.update_user_status(
            user_id=user_id,
            new_status=serializer.validated_data['status'],
            actor=request.user,
            request=request,
        )
        return Response(AdminUserSerializer(user).data, status=status.HTTP_200_OK)


class AdminDocumentListView(APIView):
    """GET /api/admin/documents/."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        docs = AdminPanelService.list_all_documents(
            doc_type=request.query_params.get('type', ''),
            doc_status=request.query_params.get('status', ''),
            company_id=request.query_params.get('company_id', ''),
            search=request.query_params.get('search', ''),
        )
        return paginated_response(request, docs, EmployeeDocumentSerializer)


class AdminDocumentDetailView(APIView):
    """GET /api/admin/documents/<str:identifier>/."""

    permission_classes = [IsSuperAdmin]

    def get(self, request, identifier):
        doc = DocumentService.get_document_by_identifier(identifier)
        return Response(AdminDocumentDetailSerializer(doc).data, status=status.HTTP_200_OK)


class AdminDocumentVerifyView(APIView):
    """POST /api/admin/documents/<str:identifier>/verify/."""

    permission_classes = [IsSuperAdmin]

    def post(self, request, identifier):
        result = VerificationService.verify_document(
            identifier=identifier,
            actor=request.user,
            request=request,
        )
        return Response(result, status=status.HTTP_200_OK)


class AdminDocumentRevokeView(APIView):
    """POST /api/admin/documents/<str:identifier>/revoke/."""

    permission_classes = [IsSuperAdmin]

    def post(self, request, identifier):
        doc = DocumentService.get_document_by_identifier(identifier)
        serializer = DocumentRevokeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        revoked = DocumentService.revoke_document(
            document=doc,
            user=request.user,
            reason=serializer.validated_data['reason'],
            request=request,
        )
        return Response(EmployeeDocumentSerializer(revoked).data, status=status.HTTP_200_OK)

