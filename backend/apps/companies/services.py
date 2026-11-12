"""Shared CompanyService handling registration, status lookup, profile updates, and Super Admin moderation."""

import re
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import NotFound, ValidationError

from apps.audit_logs.services import AuditLogService
from apps.common.utils import build_safe_media_stream
from apps.employees.models import Company
from apps.hr.models import HRProfile

User = get_user_model()


class CompanyService:
    """Single domain service for Company operations across Public, HR, and Super Admin panels."""

    DOC_FIELD_MAP = {
        'incorporation': 'certificate_of_incorporation',
        'tax_id': 'tax_id_document',
        'address_proof': 'address_proof',
        'hr_authorization': 'hr_authorization_letter',
    }

    @staticmethod
    @transaction.atomic
    def register_company_and_hr(validated_data: dict, request=None) -> tuple[Company, HRProfile]:
        """Register a new Company (pending Super Admin approval) and its primary HR Administrator."""
        reg_num = validated_data['registration_number'].strip()
        hr_email = validated_data['hr_email'].strip().lower()

        if Company.objects.filter(registration_number__iexact=reg_num).exists():
            raise ValidationError({
                'registration_number': 'A company with this registration number / CIN is already registered.'
            })

        if User.objects.filter(email__iexact=hr_email).exists():
            raise ValidationError({
                'hr_email': 'A user account with this HR work email already exists.'
            })

        company = Company.objects.create(
            name=validated_data['name'].strip(),
            registration_number=reg_num,
            email=validated_data['email'].strip().lower(),
            phone=validated_data['phone'].strip(),
            website=(validated_data.get('website') or '').strip(),
            industry=(validated_data.get('industry') or '').strip(),
            company_size=(validated_data.get('company_size') or '').strip(),
            street_address=(validated_data.get('street_address') or '').strip(),
            address=validated_data['address'].strip(),
            city=(validated_data.get('city') or '').strip(),
            state=(validated_data.get('state') or '').strip(),
            postal_code=(validated_data.get('postal_code') or '').strip(),
            country=(validated_data.get('country') or 'India').strip(),
            certificate_of_incorporation=validated_data.get('certificate_of_incorporation'),
            tax_id_document=validated_data.get('tax_id_document'),
            address_proof=validated_data.get('address_proof'),
            hr_authorization_letter=validated_data.get('hr_authorization_letter'),
            status=Company.STATUS_PENDING,
        )

        hr_user = User.objects.create_user(
            email=hr_email,
            password=validated_data['password'],
            name=validated_data['hr_name'].strip(),
            role=User.ROLE_HR,
            status=User.STATUS_ACTIVE,
        )

        hr_profile = HRProfile.objects.create(
            user=hr_user,
            company=company,
            designation=(validated_data.get('hr_designation') or 'HR Manager').strip(),
            phone=(validated_data.get('hr_phone') or validated_data['phone']).strip(),
            is_primary=True,
        )

        AuditLogService.log(
            action='Company Registered',
            description=f'Organization {company.name} ({company.registration_number}) registered for audit.',
            actor=hr_user,
            target_type='company',
            target_id=str(company.id),
            request=request,
        )

        return company, hr_profile

    @staticmethod
    def get_company_by_query(query: str) -> Company:
        """Resolve a company by registration_number, numeric ID, or TD-REG-YYYY-NNNNN reference ID."""
        clean = (query or '').strip()
        if not clean:
            raise NotFound('Query parameter is required.')

        company = Company.objects.filter(registration_number__iexact=clean).first()
        if company is None and clean.isdigit():
            company = Company.objects.filter(pk=int(clean)).first()
        if company is None:
            match = re.match(r'^TD-REG-\d{4}-(\d+)$', clean, re.IGNORECASE)
            if match:
                company = Company.objects.filter(pk=int(match.group(1))).first()

        if company is None:
            raise NotFound(f'No company application found for: {clean}')
        return company

    @staticmethod
    def get_company_or_404(company_id) -> Company:
        company = Company.objects.prefetch_related('hr_admins__user').filter(pk=company_id).first()
        if company is None:
            raise NotFound(f'Company with id={company_id} not found.')
        return company

    @staticmethod
    def list_companies(status_filter: str = '', search: str = ''):
        qs = Company.objects.prefetch_related('hr_admins__user', 'employees', 'issued_documents').all()
        if status_filter and status_filter != 'all':
            qs = qs.filter(status=status_filter.strip().lower())
        if search and search.strip():
            term = search.strip()
            qs = qs.filter(
                Q(name__icontains=term)
                | Q(email__icontains=term)
                | Q(registration_number__icontains=term)
                | Q(city__icontains=term)
                | Q(hr_admins__user__name__icontains=term)
                | Q(hr_admins__user__email__icontains=term)
            ).distinct()
        return qs.order_by('-created_at')

    @staticmethod
    @transaction.atomic
    def update_company_profile(company: Company, validated_data: dict) -> Company:
        """Update editable corporate profile fields."""
        editable = [
            'phone', 'address', 'street_address', 'city', 'state',
            'postal_code', 'country', 'website', 'tagline', 'logo',
        ]
        updated_fields = []
        for field in editable:
            if field in validated_data:
                val = validated_data[field]
                if val is not None or field == 'logo':
                    setattr(company, field, val.strip() if isinstance(val, str) else val)
                    updated_fields.append(field)

        if updated_fields:
            updated_fields.append('updated_at')
            company.save(update_fields=updated_fields)
        return company

    @staticmethod
    @transaction.atomic
    def moderate_company(company_id: int, action: str, remarks: str, actor, request=None) -> Company:
        """Unified moderation handler for approve, reject, suspend, and reactivate."""
        company = CompanyService.get_company_or_404(company_id)
        clean_remarks = (remarks or '').strip()

        transitions = {
            'approve': {
                'target_status': Company.STATUS_APPROVED,
                'allowed_from': {Company.STATUS_PENDING, Company.STATUS_REJECTED},
                'log_action': 'Company Approved',
                'require_remarks': False,
            },
            'reject': {
                'target_status': Company.STATUS_REJECTED,
                'allowed_from': {Company.STATUS_PENDING},
                'log_action': 'Company Rejected',
                'require_remarks': True,
            },
            'suspend': {
                'target_status': Company.STATUS_SUSPENDED,
                'allowed_from': {Company.STATUS_APPROVED},
                'log_action': 'Company Suspended',
                'require_remarks': False,
            },
            'reactivate': {
                'target_status': Company.STATUS_APPROVED,
                'allowed_from': {Company.STATUS_SUSPENDED, Company.STATUS_REJECTED},
                'log_action': 'Company Reactivated',
                'require_remarks': False,
            },
        }

        cfg = transitions.get(action)
        if not cfg:
            raise ValidationError({'action': f'Unsupported company moderation action: {action}'})
        if cfg['require_remarks'] and not clean_remarks:
            raise ValidationError({'remarks': 'Audit remarks are required when rejecting a company.'})
        if company.status not in cfg['allowed_from']:
            raise ValidationError({
                'status': f"Cannot {action} a company currently in '{company.status}' status."
            })

        prev_status = company.status
        company.status = cfg['target_status']
        if clean_remarks or action == 'reject':
            company.remarks = clean_remarks
        company.save(update_fields=['status', 'remarks', 'updated_at'])

        AuditLogService.log(
            action=cfg['log_action'],
            description=f"{company.name} ({company.registration_number}) transitioned from '{prev_status}' to '{company.status}'.",
            actor=actor,
            target_type='company',
            target_id=str(company.id),
            metadata={'previous_status': prev_status, 'new_status': company.status, 'remarks': company.remarks},
            request=request,
        )
        return company

    @staticmethod
    def get_verification_doc_stream(company: Company, doc_key: str):
        field_name = CompanyService.DOC_FIELD_MAP.get(doc_key)
        if not field_name:
            raise NotFound(f'Unknown verification document type: {doc_key}')

        file_field = getattr(company, field_name, None)
        payload = build_safe_media_stream(file_field)
        if payload is None:
            raise NotFound(f"No '{doc_key}' verification file was uploaded for {company.name}.")
        return payload

