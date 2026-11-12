from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import DocumentFileVerifySerializer, VerificationService


class PublicVerifyByIdView(APIView):
    """GET /api/verification/<str:verification_id>/ — Public ledger verification lookup."""

    permission_classes = [AllowAny]

    def get(self, request, verification_id):
        result = VerificationService.verify_document(
            identifier=verification_id,
            actor=request.user if request.user.is_authenticated else None,
            request=request,
        )
        return Response(result, status=status.HTTP_200_OK)


class PublicVerifyWithFileView(APIView):
    """POST /api/verification/verify/ — Public SHA-256 verification against optional uploaded file."""

    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = DocumentFileVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = VerificationService.verify_document(
            identifier=serializer.validated_data['verification_id'],
            uploaded_file=serializer.validated_data.get('document_file'),
            actor=request.user if request.user.is_authenticated else None,
            request=request,
        )
        return Response(result, status=status.HTTP_200_OK)

