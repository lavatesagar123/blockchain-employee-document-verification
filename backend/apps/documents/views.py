"""API views for Employee & HR Document Issuance, Listing, Inspection, Revocation, and Secure Download."""

from django.http import FileResponse
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsApprovedHRAdmin, IsEmployee
from .models import DocumentAuditLog
from .permissions import IsDocumentOwnerOrAuthorized
from .serializers import (
    DocumentIssuanceSerializer,
    DocumentRevokeSerializer,
    EmployeeDocumentSerializer,
)
from .services import DocumentService


class EmployeeDocumentListView(APIView):
    """GET /api/employee/documents/ — List all issued documents owned by the authenticated employee."""

    permission_classes = [IsEmployee]

    def get(self, request):
        doc_type = request.query_params.get('type', '')
        doc_status = request.query_params.get('status', '')
        search = request.query_params.get('search', '')

        documents = DocumentService.get_employee_documents(
            user=request.user,
            doc_type=doc_type,
            doc_status=doc_status,
            search=search,
        )
        serializer = EmployeeDocumentSerializer(documents, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class HRDocumentListCreateView(APIView):
    """GET/POST /api/documents/ — List company issued documents or issue a new verifiable credential."""

    permission_classes = [IsApprovedHRAdmin]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        hr_profile = request.user.hr_profile
        doc_type = request.query_params.get('type', '')
        doc_status = request.query_params.get('status', '')
        search = request.query_params.get('search', '')

        documents = DocumentService.get_company_documents(
            company=hr_profile.company,
            doc_type=doc_type,
            doc_status=doc_status,
            search=search,
        )
        return Response(EmployeeDocumentSerializer(documents, many=True).data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = DocumentIssuanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        document = DocumentService.issue_document(
            hr_user=request.user,
            validated_data=serializer.validated_data,
            request=request,
        )
        return Response(EmployeeDocumentSerializer(document).data, status=status.HTTP_201_CREATED)


class DocumentDetailView(APIView):
    """GET /api/employee/documents/<identifier>/ or /api/documents/<identifier>/ — Inspect single document."""

    permission_classes = [IsDocumentOwnerOrAuthorized]

    def get(self, request, identifier):
        document = DocumentService.get_document_by_identifier(identifier)
        self.check_object_permissions(request, document)

        DocumentService.record_audit_event(
            document=document,
            user=request.user,
            action=DocumentAuditLog.ACTION_VIEWED,
            request=request,
        )
        serializer = EmployeeDocumentSerializer(document)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DocumentRevokeView(APIView):
    """POST /api/documents/<identifier>/revoke/ — Revoke an issued document on the ledger."""

    permission_classes = [IsApprovedHRAdmin, IsDocumentOwnerOrAuthorized]

    def post(self, request, identifier):
        document = DocumentService.get_document_by_identifier(identifier)
        self.check_object_permissions(request, document)

        serializer = DocumentRevokeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        revoked_doc = DocumentService.revoke_document(
            document=document,
            user=request.user,
            reason=serializer.validated_data['reason'],
            request=request,
        )
        return Response(EmployeeDocumentSerializer(revoked_doc).data, status=status.HTTP_200_OK)


class SecureDocumentDownloadView(APIView):
    """GET /api/employee/documents/<identifier>/download/ or /api/documents/<identifier>/download/."""

    permission_classes = [IsDocumentOwnerOrAuthorized]

    def get(self, request, identifier):
        document = DocumentService.get_document_by_identifier(identifier)
        self.check_object_permissions(request, document)

        stream, content_type, filename = DocumentService.get_download_payload(document)
        DocumentService.record_audit_event(
            document=document,
            user=request.user,
            action=DocumentAuditLog.ACTION_DOWNLOADED,
            request=request,
        )

        response = FileResponse(
            stream,
            as_attachment=True,
            filename=filename,
            content_type=content_type,
        )
        response['X-Content-Type-Options'] = 'nosniff'
        response['Cache-Control'] = 'private, no-store'
        return response
