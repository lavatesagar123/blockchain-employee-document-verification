"""API views for Employee Document Portfolio, Inspection, and Secure Download."""

from django.http import FileResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsEmployee
from .models import DocumentAuditLog
from .permissions import IsDocumentOwnerOrAuthorized
from .serializers import EmployeeDocumentSerializer
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


class SecureDocumentDownloadView(APIView):
    """GET /api/employee/documents/<identifier>/download/ — Authenticated, ownership-verified PDF download."""

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
