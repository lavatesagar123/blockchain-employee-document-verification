"""Super Admin API views — strictly protected by IsSuperAdmin RBAC permission."""

from django.http import FileResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsSuperAdmin
from apps.documents.serializers import DocumentRevokeSerializer, EmployeeDocumentSerializer
from apps.documents.services import DocumentService
from .pagination import StandardAdminPagination
from .serializers import (
    ActivityLogSerializer,
    AdminCompanySerializer,
    AdminDocumentDetailSerializer,
    AdminProfileSerializer,
    AdminProfileUpdateSerializer,
    AdminUserSerializer,
    AdminUserStatusSerializer,
    AdminUserUpdateSerializer,
    CompanyActionRemarksSerializer,
)
from .services import SuperAdminService


def _paginated_response(request, queryset, serializer_cls):
    paginator = StandardAdminPagination()
    page = paginator.paginate_queryset(queryset, request)
    if page is not None:
        return paginator.get_paginated_response(serializer_cls(page, many=True).data)
    return Response(serializer_cls(queryset, many=True).data, status=status.HTTP_200_OK)


class AdminProfileView(APIView):
    """GET/PATCH/PUT /api/admin/profile/ — Super Admin account profile management."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        return Response(AdminProfileSerializer(request.user).data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = AdminProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = SuperAdminService.update_admin_profile(request.user, serializer.validated_data, request=request)
        return Response(AdminProfileSerializer(updated).data, status=status.HTTP_200_OK)

    def put(self, request):
        serializer = AdminProfileUpdateSerializer(data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        updated = SuperAdminService.update_admin_profile(request.user, serializer.validated_data, request=request)
        return Response(AdminProfileSerializer(updated).data, status=status.HTTP_200_OK)


class AdminDashboardStatsView(APIView):
    """GET /api/admin/companies/stats/ or /api/admin/dashboard/stats/ — Live platform KPI telemetry."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        return Response(SuperAdminService.get_platform_stats(), status=status.HTTP_200_OK)


class AdminCompanyListView(APIView):
    """GET /api/admin/companies/ — Paginated list of company registration requests with filters."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        status_filter = request.query_params.get('status', '')
        search = request.query_params.get('search', '')
        companies = SuperAdminService.list_companies(status_filter=status_filter, search=search)
        return _paginated_response(request, companies, AdminCompanySerializer)


class AdminCompanyDetailView(APIView):
    """GET /api/admin/companies/<int:company_id>/ — Inspect company & verification document metadata."""

    permission_classes = [IsSuperAdmin]

    def get(self, request, company_id):
        company = SuperAdminService.get_company_or_404(company_id)
        return Response(AdminCompanySerializer(company).data, status=status.HTTP_200_OK)


class AdminCompanyModerationView(APIView):
    """POST /api/admin/companies/<int:company_id>/<approve|reject|suspend|reactivate>/."""

    permission_classes = [IsSuperAdmin]
    moderation_action = None

    def post(self, request, company_id, moderation_action=None):
        action = moderation_action or self.moderation_action
        serializer = CompanyActionRemarksSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        company = SuperAdminService.moderate_company(
            company_id=company_id,
            action=action,
            remarks=serializer.validated_data.get('remarks', ''),
            actor=request.user,
            request=request,
        )
        return Response(AdminCompanySerializer(company).data, status=status.HTTP_200_OK)


class AdminCompanyVerificationDocDownloadView(APIView):
    """GET /api/admin/companies/<int:company_id>/documents/<str:doc_key>/download/."""

    permission_classes = [IsSuperAdmin]

    def get(self, request, company_id, doc_key):
        company = SuperAdminService.get_company_or_404(company_id)
        stream, content_type, filename = SuperAdminService.get_company_verification_doc_stream(company, doc_key)
        response = FileResponse(stream, as_attachment=True, filename=filename, content_type=content_type)
        response['X-Content-Type-Options'] = 'nosniff'
        response['Cache-Control'] = 'private, no-store'
        return response


class AdminUserListView(APIView):
    """GET /api/admin/users/ — Paginated user accounts directory across HR, Employee & Admin roles."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        role_filter = request.query_params.get('role', '')
        status_filter = request.query_params.get('status', '')
        search = request.query_params.get('search', '')
        users = SuperAdminService.list_users(role_filter=role_filter, status_filter=status_filter, search=search)
        return _paginated_response(request, users, AdminUserSerializer)


class AdminUserDetailView(APIView):
    """GET/PATCH /api/admin/users/<int:user_id>/ — Inspect or update a user account."""

    permission_classes = [IsSuperAdmin]

    def get(self, request, user_id):
        user = SuperAdminService.get_user_or_404(user_id)
        return Response(AdminUserSerializer(user).data, status=status.HTTP_200_OK)

    def patch(self, request, user_id):
        serializer = AdminUserUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = SuperAdminService.update_user_account(
            user_id=user_id,
            validated_data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return Response(AdminUserSerializer(user).data, status=status.HTTP_200_OK)


class AdminUserStatusView(APIView):
    """POST /api/admin/users/<int:user_id>/status/ — Activate or deactivate/suspend user."""

    permission_classes = [IsSuperAdmin]

    def post(self, request, user_id):
        serializer = AdminUserStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = SuperAdminService.update_user_status(
            user_id=user_id,
            new_status=serializer.validated_data['status'],
            actor=request.user,
            request=request,
        )
        return Response(AdminUserSerializer(user).data, status=status.HTTP_200_OK)


class AdminDocumentListView(APIView):
    """GET /api/admin/documents/ — View and filter all issued documents across all organizations."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        doc_type = request.query_params.get('type', '')
        doc_status = request.query_params.get('status', '')
        company_id = request.query_params.get('company_id', '')
        search = request.query_params.get('search', '')

        docs = SuperAdminService.list_all_documents(
            doc_type=doc_type,
            doc_status=doc_status,
            company_id=company_id,
            search=search,
        )
        return _paginated_response(request, docs, EmployeeDocumentSerializer)


class AdminDocumentDetailView(APIView):
    """GET /api/admin/documents/<str:identifier>/ — Detailed document record with audit logs."""

    permission_classes = [IsSuperAdmin]

    def get(self, request, identifier):
        doc = DocumentService.get_document_by_identifier(identifier)
        return Response(AdminDocumentDetailSerializer(doc).data, status=status.HTTP_200_OK)


class AdminDocumentVerifyView(APIView):
    """POST /api/admin/documents/<str:identifier>/verify/ — Audit SHA-256 cryptographic integrity."""

    permission_classes = [IsSuperAdmin]

    def post(self, request, identifier):
        result = SuperAdminService.verify_document_integrity(
            identifier=identifier,
            actor=request.user,
            request=request,
        )
        return Response(result, status=status.HTTP_200_OK)


class AdminDocumentRevokeView(APIView):
    """POST /api/admin/documents/<str:identifier>/revoke/ — Administratively revoke an issued document."""

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


class AdminActivityLogListView(APIView):
    """GET /api/admin/activity-logs/ — Paginated platform audit history with action & search filters."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        action_filter = request.query_params.get('action', '')
        target_type = request.query_params.get('target_type', '')
        search = request.query_params.get('search', '')
        logs = SuperAdminService.list_activity_logs(
            action_filter=action_filter,
            target_type=target_type,
            search=search,
        )
        return _paginated_response(request, logs, ActivityLogSerializer)

