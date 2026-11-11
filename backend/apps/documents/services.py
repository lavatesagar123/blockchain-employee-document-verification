"""Service layer for employee document retrieval, audit logging, and secure PDF download."""

import hashlib
import io
import mimetypes
import os
import re
import textwrap
from pathlib import Path

from django.conf import settings
from django.db.models import Q
from rest_framework.exceptions import NotFound, PermissionDenied
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from apps.employees.services import EmployeeService
from .models import DocumentAuditLog, IssuedDocument


class DocumentService:
    """Handles employee document queries, ownership-checked lookup, and secure PDF streaming."""

    @staticmethod
    def get_employee_documents(user, doc_type: str = '', doc_status: str = '', search: str = ''):
        """Return IssuedDocument queryset belonging strictly to the authenticated employee."""
        profile = EmployeeService.get_profile_for_user(user)

        ownership_q = Q(employee_profile=profile) | Q(recipient_email__iexact=user.email)
        if profile.employee_id:
            ownership_q |= Q(employee_id__iexact=profile.employee_id)

        queryset = (
            IssuedDocument.objects.select_related('company', 'employee_profile')
            .filter(ownership_q)
            .distinct()
        )

        if doc_type and doc_type != 'all':
            queryset = queryset.filter(document_type=doc_type.strip())

        if doc_status and doc_status != 'all':
            queryset = queryset.filter(status=doc_status.strip())

        if search and search.strip():
            term = search.strip()
            queryset = queryset.filter(
                Q(verification_id__icontains=term)
                | Q(reference_number__icontains=term)
                | Q(issuer_name__icontains=term)
                | Q(company__name__icontains=term)
                | Q(designation__icontains=term)
                | Q(document_type__icontains=term)
            )

        return queryset.order_by('-issue_date', '-created_at')

    @staticmethod
    def get_document_by_identifier(identifier: str) -> IssuedDocument:
        """Look up a single document by verification_id or numeric primary key."""
        clean_id = (identifier or '').strip()
        if not clean_id:
            raise NotFound('Document identifier is required.')

        queryset = IssuedDocument.objects.select_related('company', 'employee_profile')
        doc = queryset.filter(verification_id__iexact=clean_id).first()

        if doc is None and clean_id.isdigit():
            doc = queryset.filter(pk=int(clean_id)).first()

        if doc is None:
            raise NotFound(f'No document record found for identifier: {clean_id}')

        return doc

    @staticmethod
    def record_audit_event(document: IssuedDocument, user, action: str, request) -> None:
        """Persist document view/download audit entry in database."""
        forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR', '')
        ip_address = forwarded_for.split(',')[0].strip() if forwarded_for else request.META.get('REMOTE_ADDR')
        user_agent = (request.META.get('HTTP_USER_AGENT') or '')[:500]

        DocumentAuditLog.objects.create(
            document=document,
            user=user if getattr(user, 'is_authenticated', False) else None,
            action=action,
            ip_address=ip_address or None,
            user_agent=user_agent,
        )

    @staticmethod
    def build_safe_download_filename(document: IssuedDocument) -> str:
        """Build a clean, traversal-safe download filename."""
        doc_label = document.get_document_type_display().replace(' ', '_')
        safe_vid = re.sub(r'[^A-Za-z0-9_.-]', '_', document.verification_id or f'doc_{document.pk}')
        return f'{doc_label}_{safe_vid}.pdf'

    @staticmethod
    def generate_certificate_pdf_bytes(document: IssuedDocument) -> bytes:
        """Render an official TrustDoc verifiable PDF certificate for a database record."""
        buffer = io.BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        company_name = document.resolved_issuer_name or 'TrustDoc Verified Organization'
        company_address = document.company.address if document.company and document.company.address else (document.location or '')
        company_email = document.company.email if document.company and document.company.email else ''
        company_website = document.company.website if document.company and document.company.website else ''

        # Top Emerald Header Banner
        pdf.setFillColor(colors.HexColor('#03392a'))
        pdf.rect(0, height - 92, width, 92, stroke=0, fill=1)
        pdf.setFillColor(colors.HexColor('#10b981'))
        pdf.rect(0, height - 96, width, 4, stroke=0, fill=1)

        pdf.setFillColor(colors.white)
        pdf.setFont('Helvetica-Bold', 18)
        pdf.drawString(42, height - 42, company_name)

        pdf.setFont('Helvetica', 9.5)
        pdf.setFillColor(colors.HexColor('#d1fae5'))
        pdf.drawString(42, height - 60, 'TrustDoc Blockchain-Anchored Employment Credential')

        pdf.setFillColor(colors.white)
        pdf.setFont('Helvetica-Bold', 9)
        pdf.drawRightString(width - 42, height - 40, f'Ref: {document.reference_number}')
        issue_str = document.issue_date.strftime('%d %b %Y') if document.issue_date else 'Issued'
        pdf.setFont('Helvetica', 9)
        pdf.drawRightString(width - 42, height - 56, f'Issue Date: {issue_str}')
        pdf.drawRightString(width - 42, height - 72, f'Verification ID: {document.verification_id}')

        # Title
        y = height - 138
        pdf.setFillColor(colors.HexColor('#0f172a'))
        pdf.setFont('Helvetica-Bold', 17)
        pdf.drawCentredString(width / 2, y, document.get_document_type_display().upper())

        pdf.setStrokeColor(colors.HexColor('#10b981'))
        pdf.setLineWidth(1.5)
        pdf.line(width / 2 - 90, y - 8, width / 2 + 90, y - 8)

        # Recipient Salutation & Narrative
        y -= 40
        pdf.setFont('Helvetica-Bold', 11)
        pdf.setFillColor(colors.HexColor('#0f172a'))
        pdf.drawString(42, y, f'Dear {document.recipient_name},')

        y -= 20
        body_text = document.custom_description.strip() if document.custom_description else (
            f'This official {document.get_document_type_display()} confirms your appointment as '
            f'{document.designation} in the {document.department or "Operations"} department at {company_name}.'
        )
        pdf.setFont('Helvetica', 10)
        pdf.setFillColor(colors.HexColor('#334155'))
        for line in textwrap.wrap(body_text, width=88):
            pdf.drawString(42, y, line)
            y -= 15

        # Structured Employment Metadata Box
        y -= 14
        details = [
            ('Employee Name', document.recipient_name),
            ('Employee ID', document.employee_id or '—'),
            ('Email Address', document.recipient_email),
            ('Designation', document.designation),
            ('Department', document.department or '—'),
            ('Employment Type', document.employment_type or 'Full Time'),
            ('Start / Joining Date', document.start_date.strftime('%d %b %Y') if document.start_date else '—'),
            ('End / Relieving Date', document.end_date.strftime('%d %b %Y') if document.end_date else '—'),
            ('Compensation', document.compensation or '—'),
            ('Work Location', document.location or '—'),
            ('Reporting Manager', document.reporting_manager or '—'),
            ('Credential Status', document.status.upper()),
        ]

        box_height = len(details) * 20 + 20
        pdf.setFillColor(colors.HexColor('#f8fafc'))
        pdf.setStrokeColor(colors.HexColor('#cbd5e1'))
        pdf.setLineWidth(0.8)
        pdf.roundRect(42, y - box_height, width - 84, box_height, 6, stroke=1, fill=1)

        row_y = y - 18
        for label, value in details:
            pdf.setFont('Helvetica-Bold', 9)
            pdf.setFillColor(colors.HexColor('#475569'))
            pdf.drawString(56, row_y, label)
            pdf.setFont('Helvetica', 9.5)
            pdf.setFillColor(colors.HexColor('#0f172a'))
            pdf.drawString(195, row_y, f':  {value}')
            row_y -= 20

        y = y - box_height - 32

        # Signatory Block
        pdf.setFont('Helvetica', 9.5)
        pdf.setFillColor(colors.HexColor('#475569'))
        pdf.drawString(42, y, 'Authorized Signatory,')
        y -= 20
        pdf.setFont('Helvetica-Bold', 11)
        pdf.setFillColor(colors.HexColor('#0f172a'))
        pdf.drawString(42, y, document.signatory_name or document.reporting_manager or 'Authorized HR Representative')
        y -= 14
        pdf.setFont('Helvetica', 9)
        pdf.setFillColor(colors.HexColor('#64748b'))
        pdf.drawString(42, y, f'{document.signatory_role or "HR Manager"}, {company_name}')

        # Blockchain Cryptographic Footer
        footer_top = 105
        pdf.setFillColor(colors.HexColor('#ecfdf5'))
        pdf.setStrokeColor(colors.HexColor('#a7f3d0'))
        pdf.roundRect(42, 42, width - 84, footer_top - 42, 6, stroke=1, fill=1)

        pdf.setFont('Helvetica-Bold', 8.5)
        pdf.setFillColor(colors.HexColor('#065f46'))
        pdf.drawString(54, footer_top - 16, 'BLOCKCHAIN VERIFICATION METADATA')

        pdf.setFont('Courier', 7.8)
        pdf.setFillColor(colors.HexColor('#047857'))
        pdf.drawString(54, footer_top - 31, f'Verification ID : {document.verification_id}')
        pdf.drawString(54, footer_top - 43, f'Transaction Hash: {document.transaction_hash or "Pending Anchor"}')
        pdf.drawString(54, footer_top - 55, f'File SHA-256    : {document.file_hash or "Generated on Export"}')

        if company_address or company_email or company_website:
            pdf.setFont('Helvetica', 7.5)
            pdf.setFillColor(colors.HexColor('#64748b'))
            meta_line = ' | '.join(filter(None, [company_address, company_email, company_website]))
            pdf.drawCentredString(width / 2, 24, meta_line[:115])

        pdf.showPage()
        pdf.save()

        pdf_bytes = buffer.getvalue()
        buffer.close()

        # Persist SHA-256 digest if not already stored
        if not document.file_hash:
            document.file_hash = hashlib.sha256(pdf_bytes).hexdigest()
            document.save(update_fields=['file_hash', 'updated_at'])

        return pdf_bytes

    @staticmethod
    def get_download_payload(document: IssuedDocument) -> tuple[io.BytesIO, str, str]:
        """Return (BytesIO stream, content_type, safe_filename) with path traversal protection."""
        filename = DocumentService.build_safe_download_filename(document)

        if document.file:
            media_root = Path(os.path.realpath(settings.MEDIA_ROOT))
            target_path = Path(os.path.realpath(document.file.path))
            # Prevent path traversal outside MEDIA_ROOT
            if media_root not in target_path.parents:
                raise PermissionDenied('Access to requested file path is denied.')
            if target_path.is_file():
                with open(target_path, 'rb') as fh:
                    content = fh.read()
                guessed_type, _ = mimetypes.guess_type(str(target_path))
                content_type = guessed_type or 'application/pdf'
                if target_path.suffix:
                    filename = f'{Path(filename).stem}{target_path.suffix}'
                return io.BytesIO(content), content_type, filename

        pdf_bytes = DocumentService.generate_certificate_pdf_bytes(document)
        return io.BytesIO(pdf_bytes), 'application/pdf', filename
