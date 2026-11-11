"""Service layer for document issuance, retrieval, revocation, audit logging, and multi-page QR PDF generation."""

import hashlib
import io
import mimetypes
import os
import re
import uuid
from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from apps.employees.models import EmployeeProfile
from apps.employees.services import EmployeeService
from .models import DocumentAuditLog, IssuedDocument


class DocumentService:
    """Handles employee & HR document queries, issuance, revocation, and multi-page PDF generation."""

    PREFIX_BY_TYPE = {
        IssuedDocument.TYPE_OFFER: 'HR',
        IssuedDocument.TYPE_LOI: 'LOI',
        IssuedDocument.TYPE_EXPERIENCE: 'EXP',
        IssuedDocument.TYPE_RELIEVING: 'REL',
    }

    @staticmethod
    def _generate_verification_id() -> str:
        year = timezone.now().year
        while True:
            token = uuid.uuid4().hex[:6].upper()
            candidate = f'VC-{year}-{token}'
            if not IssuedDocument.objects.filter(verification_id=candidate).exists():
                return candidate

    @staticmethod
    def _generate_reference_number(doc_type: str) -> str:
        year = timezone.now().year
        code = DocumentService.PREFIX_BY_TYPE.get(doc_type, 'DOC')
        seq = IssuedDocument.objects.count() + 1
        while True:
            candidate = f'TD/{code}/{year}/{seq:04d}'
            if not IssuedDocument.objects.filter(reference_number=candidate).exists():
                return candidate
            seq += 1

    @staticmethod
    def _build_transaction_hash(seed_str: str) -> str:
        digest = hashlib.sha256(seed_str.encode('utf-8')).hexdigest()
        return f'0x{digest}'

    @staticmethod
    @transaction.atomic
    def issue_document(hr_user, validated_data: dict, request=None) -> IssuedDocument:
        """Issue and anchor a new employment document on behalf of the HR administrator's company."""
        hr_profile = getattr(hr_user, 'hr_profile', None)
        if not hr_profile or not hr_profile.company:
            raise ValidationError('HR user must belong to a registered organization.')

        company = hr_profile.company
        if company.status != 'approved':
            raise PermissionDenied('Only Super-Admin-approved companies can issue documents.')

        doc_type = validated_data['document_type']
        verification_id = DocumentService._generate_verification_id()
        reference_number = DocumentService._generate_reference_number(doc_type)

        emp_id_str = (validated_data.get('employee_id') or '').strip()
        recipient_email = validated_data['recipient_email'].strip().lower()

        # Resolve matching EmployeeProfile in this company (or matching email)
        employee_profile = None
        if emp_id_str:
            employee_profile = EmployeeProfile.objects.filter(
                employee_id__iexact=emp_id_str,
                company=company,
            ).first()
        if employee_profile is None:
            employee_profile = EmployeeProfile.objects.filter(
                user__email__iexact=recipient_email,
            ).first()
        if employee_profile and not emp_id_str:
            emp_id_str = employee_profile.employee_id

        issue_date = date.today()
        block_number = 42000 + IssuedDocument.objects.count() + 1
        tx_seed = f'{verification_id}:{reference_number}:{company.id}:{recipient_email}:{timezone.now().isoformat()}'
        transaction_hash = DocumentService._build_transaction_hash(tx_seed)

        signatory_name = (validated_data.get('signatory_name') or '').strip() or hr_user.name
        signatory_role = (validated_data.get('signatory_role') or '').strip() or hr_profile.designation or 'HR Manager'
        uploaded_file = validated_data.get('file')

        document = IssuedDocument.objects.create(
            verification_id=verification_id,
            reference_number=reference_number,
            document_type=doc_type,
            company=company,
            issuer_name=company.name,
            employee_profile=employee_profile,
            employee_id=emp_id_str,
            recipient_name=validated_data['recipient_name'].strip(),
            recipient_email=recipient_email,
            recipient_phone=(validated_data.get('recipient_phone') or '').strip(),
            designation=validated_data['designation'].strip(),
            department=(validated_data.get('department') or '').strip(),
            employment_type=(validated_data.get('employment_type') or 'Full Time').strip(),
            start_date=validated_data.get('start_date'),
            end_date=validated_data.get('end_date'),
            resignation_date=validated_data.get('resignation_date'),
            acceptance_deadline=validated_data.get('acceptance_deadline'),
            compensation=(validated_data.get('compensation') or '').strip(),
            monthly_salary=(validated_data.get('monthly_salary') or '').strip(),
            location=(validated_data.get('location') or company.city or '').strip(),
            reporting_manager=(validated_data.get('reporting_manager') or signatory_name).strip(),
            signatory_name=signatory_name,
            signatory_role=signatory_role,
            custom_description=(validated_data.get('custom_description') or '').strip(),
            remarks=(validated_data.get('remarks') or '').strip(),
            status=IssuedDocument.STATUS_VERIFIED,
            file=uploaded_file,
            transaction_hash=transaction_hash,
            block_number=block_number,
            issue_date=issue_date,
        )

        # Compute & persist SHA-256 fingerprint of attachment or generated PDF
        if uploaded_file:
            uploaded_file.seek(0)
            document.file_hash = hashlib.sha256(uploaded_file.read()).hexdigest()
            uploaded_file.seek(0)
            document.save(update_fields=['file_hash', 'updated_at'])
        else:
            DocumentService.generate_certificate_pdf_bytes(document)

        if request is not None:
            DocumentService.record_audit_event(
                document=document,
                user=hr_user,
                action=DocumentAuditLog.ACTION_ISSUED,
                request=request,
            )

        return document

    @staticmethod
    def get_company_documents(company, doc_type: str = '', doc_status: str = '', search: str = ''):
        """Return all IssuedDocument records belonging to the HR user's company."""
        queryset = IssuedDocument.objects.select_related('company', 'employee_profile').filter(
            company=company
        )

        if doc_type and doc_type != 'all':
            queryset = queryset.filter(document_type=doc_type.strip())

        if doc_status and doc_status != 'all':
            if doc_status.strip() == 'verified':
                queryset = queryset.filter(status__in=[IssuedDocument.STATUS_VERIFIED, IssuedDocument.STATUS_ACTIVE])
            else:
                queryset = queryset.filter(status=doc_status.strip())

        if search and search.strip():
            term = search.strip()
            queryset = queryset.filter(
                Q(verification_id__icontains=term)
                | Q(reference_number__icontains=term)
                | Q(recipient_name__icontains=term)
                | Q(recipient_email__icontains=term)
                | Q(employee_id__icontains=term)
                | Q(designation__icontains=term)
            )

        return queryset.order_by('-issue_date', '-created_at')

    @staticmethod
    @transaction.atomic
    def revoke_document(document: IssuedDocument, user, reason: str, request=None) -> IssuedDocument:
        """Mark an issued document as revoked with audit reason."""
        if document.status == IssuedDocument.STATUS_REVOKED:
            raise ValidationError({'detail': 'This document has already been revoked.'})

        document.status = IssuedDocument.STATUS_REVOKED
        document.revocation_reason = reason.strip()
        document.save(update_fields=['status', 'revocation_reason', 'updated_at'])

        if request is not None:
            DocumentService.record_audit_event(
                document=document,
                user=user,
                action=DocumentAuditLog.ACTION_REVOKED,
                request=request,
            )
        return document

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
        """Persist document view/download/issue/revoke audit entry in database."""
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
        """Render a dynamic multi-page TrustDoc PDF certificate with embedded QR verification code."""
        buffer = io.BytesIO()
        company_name = document.resolved_issuer_name or 'TrustDoc Verified Organization'
        company_address = (
            document.company.address
            if document.company and document.company.address
            else (document.location or '')
        )
        company_email = document.company.email if document.company and document.company.email else ''
        company_website = document.company.website if document.company and document.company.website else ''
        tagline = (
            document.company.tagline
            if document.company and document.company.tagline
            else 'TrustDoc Blockchain-Anchored Employment Credential'
        )
        issue_str = document.issue_date.strftime('%d %b %Y') if document.issue_date else 'Issued'

        def _draw_page_chrome(pdf_canvas, doc):
            pdf_canvas.saveState()
            page_w, page_h = A4

            # Header Banner
            pdf_canvas.setFillColor(colors.HexColor('#03392a'))
            pdf_canvas.rect(0, page_h - 30 * mm, page_w, 30 * mm, stroke=0, fill=1)
            pdf_canvas.setFillColor(colors.HexColor('#10b981'))
            pdf_canvas.rect(0, page_h - 31.5 * mm, page_w, 1.5 * mm, stroke=0, fill=1)

            pdf_canvas.setFillColor(colors.white)
            pdf_canvas.setFont('Helvetica-Bold', 15)
            pdf_canvas.drawString(16 * mm, page_h - 13 * mm, company_name[:55])

            pdf_canvas.setFont('Helvetica', 8.5)
            pdf_canvas.setFillColor(colors.HexColor('#d1fae5'))
            pdf_canvas.drawString(16 * mm, page_h - 20 * mm, tagline[:70])

            pdf_canvas.setFillColor(colors.white)
            pdf_canvas.setFont('Helvetica-Bold', 8.5)
            pdf_canvas.drawRightString(page_w - 16 * mm, page_h - 11 * mm, f'Ref: {document.reference_number}')
            pdf_canvas.setFont('Helvetica', 8.5)
            pdf_canvas.drawRightString(page_w - 16 * mm, page_h - 17.5 * mm, f'Date: {issue_str}')
            pdf_canvas.drawRightString(page_w - 16 * mm, page_h - 24 * mm, f'ID: {document.verification_id}')

            # Footer Strip with Page Number
            pdf_canvas.setStrokeColor(colors.HexColor('#e2e8f0'))
            pdf_canvas.setLineWidth(0.6)
            pdf_canvas.line(16 * mm, 14 * mm, page_w - 16 * mm, 14 * mm)

            meta_line = ' | '.join(filter(None, [company_address, company_email, company_website]))
            pdf_canvas.setFont('Helvetica', 7.5)
            pdf_canvas.setFillColor(colors.HexColor('#64748b'))
            if meta_line:
                pdf_canvas.drawString(16 * mm, 8.5 * mm, meta_line[:95])
            pdf_canvas.drawRightString(
                page_w - 16 * mm,
                8.5 * mm,
                f'Page {doc.page} • {document.verification_id}',
            )
            pdf_canvas.restoreState()

        doc_template = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=16 * mm,
            rightMargin=16 * mm,
            topMargin=38 * mm,
            bottomMargin=20 * mm,
            title=f'{document.get_document_type_display()} - {document.recipient_name}',
            author=company_name,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            alignment=TA_CENTER,
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=4,
        )
        salutation_style = ParagraphStyle(
            'Salutation',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10.5,
            leading=15,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=6,
        )
        body_style = ParagraphStyle(
            'BodyText',
            parent=styles['Normal'],
            fontSize=10,
            leading=15,
            textColor=colors.HexColor('#334155'),
            spaceAfter=8,
        )
        mono_style = ParagraphStyle(
            'MonoText',
            parent=styles['Normal'],
            fontName='Courier',
            fontSize=7.8,
            leading=11,
            textColor=colors.HexColor('#047857'),
        )
        label_style = ParagraphStyle(
            'CellLabel',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#475569'),
        )
        val_style = ParagraphStyle(
            'CellVal',
            parent=styles['Normal'],
            fontSize=9.2,
            leading=12,
            textColor=colors.HexColor('#0f172a'),
        )

        story = []
        story.append(Paragraph(escape(document.get_document_type_display().upper()), title_style))
        story.append(Spacer(1, 4 * mm))
        story.append(Paragraph(f'Dear {escape(document.recipient_name)},', salutation_style))

        # Dynamic multi-paragraph custom description (flows naturally across pages)
        default_body = (
            f'This official {document.get_document_type_display()} confirms your appointment as '
            f'{document.designation} in the {document.department or "Operations"} department at {company_name}.'
        )
        raw_desc = (document.custom_description or '').strip() or default_body
        paragraphs = [p.strip() for p in re.split(r'\n\s*\n|\r\n\r\n', raw_desc) if p.strip()]
        if not paragraphs:
            paragraphs = [raw_desc]

        for para in paragraphs:
            safe_para = escape(para).replace('\n', '<br/>')
            story.append(Paragraph(safe_para, body_style))

        if document.remarks:
            story.append(Paragraph(f'<b>Additional Remarks:</b> {escape(document.remarks)}', body_style))

        story.append(Spacer(1, 3 * mm))

        # Employment Metadata Table
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
        table_rows = [
            [Paragraph(escape(lbl), label_style), Paragraph(escape(str(val)), val_style)]
            for lbl, val in details
        ]
        details_table = Table(table_rows, colWidths=[52 * mm, 124 * mm])
        details_table.setStyle(
            TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
                ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#cbd5e1')),
                ('INNERGRID', (0, 0), (-1, -1), 0.35, colors.HexColor('#e2e8f0')),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ])
        )
        story.append(details_table)
        story.append(Spacer(1, 6 * mm))

        # Signatory & QR Verification Block kept together cleanly
        frontend_base = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:5173')
        verify_url = f'{frontend_base}/verify?id={document.verification_id}'
        qr_widget = QrCodeWidget(verify_url)
        qr_widget.barFillColor = colors.HexColor('#047857')
        qr_drawing = Drawing(28 * mm, 28 * mm)
        bounds = qr_widget.getBounds()
        qr_w = bounds[2] - bounds[0]
        qr_h = bounds[3] - bounds[1]
        qr_drawing = Drawing(
            28 * mm,
            28 * mm,
            transform=[(28 * mm) / qr_w, 0, 0, (28 * mm) / qr_h, 0, 0],
        )
        qr_drawing.add(qr_widget)

        sig_name = escape(document.signatory_name or document.reporting_manager or 'Authorized HR Representative')
        sig_role = escape(f'{document.signatory_role or "HR Manager"}, {company_name}')

        sig_block = Table(
            [
                [
                    Paragraph(
                        f'Authorized Signatory,<br/><br/><b>{sig_name}</b><br/>'
                        f'<font size="8.5" color="#64748b">{sig_role}</font>',
                        val_style,
                    ),
                    qr_drawing,
                ]
            ],
            colWidths=[136 * mm, 40 * mm],
        )
        sig_block.setStyle(
            TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ])
        )

        ledger_text = (
            f'<b>BLOCKCHAIN VERIFICATION METADATA</b><br/>'
            f'Verification ID : {escape(document.verification_id)}<br/>'
            f'Transaction Hash: {escape(document.transaction_hash or "Pending Anchor")}<br/>'
            f'File SHA-256    : {escape(document.file_hash or "Computed on Export")}<br/>'
            f'Verify Online   : {escape(verify_url)}'
        )
        ledger_box = Table([[Paragraph(ledger_text, mono_style)]], colWidths=[176 * mm])
        ledger_box.setStyle(
            TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#ecfdf5')),
                ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#a7f3d0')),
                ('TOPPADDING', (0, 0), (-1, -1), 7),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
                ('LEFTPADDING', (0, 0), (-1, -1), 9),
                ('RIGHTPADDING', (0, 0), (-1, -1), 9),
            ])
        )

        story.append(KeepTogether([sig_block, Spacer(1, 5 * mm), ledger_box]))

        doc_template.build(
            story,
            onFirstPage=_draw_page_chrome,
            onLaterPages=_draw_page_chrome,
        )

        pdf_bytes = buffer.getvalue()
        buffer.close()

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
