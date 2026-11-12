"""Shared VerificationService used by both Public Verification and Super Admin Integrity Audits."""

import os
from rest_framework import serializers

from apps.audit_logs.services import AuditLogService
from apps.common.utils import compute_sha256_file, validate_uploaded_file
from apps.documents.models import IssuedDocument
from apps.documents.services import DocumentService


class DocumentFileVerifySerializer(serializers.Serializer):
    """Validates POST /api/verification/verify/ payload."""

    verification_id = serializers.CharField(max_length=64)
    document_file = serializers.FileField(required=False, allow_null=True)

    def validate_document_file(self, value):
        return validate_uploaded_file(value, allowed_ext=('.pdf', '.png', '.jpg', '.jpeg'), max_mb=10)


class VerificationService:
    """Single source of truth for cryptographic document and SHA-256 checksum verification."""

    @staticmethod
    def verify_document(identifier: str, uploaded_file=None, actor=None, request=None) -> dict:
        doc = DocumentService.get_document_by_identifier(identifier)

        if not doc.file_hash:
            if doc.file and os.path.isfile(doc.file.path):
                with open(doc.file.path, 'rb') as fh:
                    doc.file_hash = compute_sha256_file(fh)
                doc.save(update_fields=['file_hash', 'updated_at'])
            else:
                DocumentService.generate_certificate_pdf_bytes(doc)

        if uploaded_file is not None:
            computed_hash = compute_sha256_file(uploaded_file)
        elif doc.file and os.path.isfile(doc.file.path):
            with open(doc.file.path, 'rb') as fh:
                computed_hash = compute_sha256_file(fh)
        else:
            computed_hash = doc.file_hash

        hash_matches = bool(doc.file_hash and computed_hash == doc.file_hash)
        is_authentic = hash_matches and doc.status != IssuedDocument.STATUS_REVOKED

        actor_label = 'Super Admin' if (actor and getattr(actor, 'role', '') == 'superadmin') else 'Public Verifier'
        AuditLogService.log(
            action='Document Verified',
            description=f'{actor_label} verified {doc.verification_id} (status={doc.status}, authentic={is_authentic}).',
            actor=actor,
            target_type='document',
            target_id=doc.verification_id,
            metadata={'status': doc.status, 'hash_matches': hash_matches, 'file_checked': bool(uploaded_file)},
            request=request,
        )

        return {
            'verification_id': doc.verification_id,
            'reference_number': doc.reference_number,
            'document_type': doc.document_type,
            'issuer_name': doc.resolved_issuer_name,
            'recipient_name': doc.recipient_name,
            'designation': doc.designation,
            'issue_date': doc.issue_date.isoformat() if doc.issue_date else None,
            'status': doc.status,
            'is_authentic': is_authentic,
            'hash_matches': hash_matches,
            'stored_file_hash': doc.file_hash,
            'computed_file_hash': computed_hash,
            'file_hash': doc.file_hash,
            'transaction_hash': doc.transaction_hash,
            'block_number': doc.block_number,
            'revocation_reason': doc.revocation_reason,
        }

