"""Service layer for Super Admin orchestration, auditing, moderation, and platform telemetry."""

import hashlib
import io
import mimetypes
import os
from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from apps.documents.models import IssuedDocument
from apps.documents.services import DocumentService
from apps.employees.models import Company, EmployeeProfile
from .models import ActivityLog

User = get_user_model()


class ActivityLogService:
    """Centralized immutable audit trail writer."""

    @staticmethod
    def _extract_ip(request):
        if request is None:
            return None
        forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
        return forwarded.split(',')[0].strip() if forwarded else request.META.get('REMOTE_ADDR')

    @staticmethod
    def log(
        action: str,
        description: str,
        actor=None,
        target_type: str = ActivityLog.TARGET_ADMIN,
        target_id: str = '',
        metadata: dict | None = None,
        request=None,
    ) -> ActivityLog:
        actor_obj = actor if getattr(actor, 'is_authenticated', False) else None
        performed_by = actor_obj.email if actor_obj else 'System'
        return ActivityLog.objects.create(
            action=action,
            description=description,
            actor=actor_obj,
            performed_by=performed_by,
            target_type=target_type,
            target_id=str(target_id or ''),
            ip_address=ActivityLogService._extract_ip(request),
            metadata=metadata or {},
        )


class SuperAdminService:
    """Encapsulates all Super Admin business logic over real database records."""

    DOC_FIELD_MAP = {
        'incorporation': 'certificate_of_incorporation',
        'tax_id': 'tax_id_document',
        'address_proof': 'address_proof',
        'hr_authorization': 'hr_authorization_letter',
    }

    @staticmethod
    @transaction.atomic
    def update_admin_profile(admin_user, validated_data: dict, request=None):
        """Update Super Admin display name, email, username, or password securely."""
        if 'email' in validated_data:
            new_email = validated_data['email'].strip().lower()
            if User.objects.filter(email__iexact=new_email).exclude(pk=admin_user.pk).exists():
                raise ValidationError({'email': 'Email is already in use by another account.'})
            admin_user.email = new_email

        if 'username' in validated_data:
            new_username = validated_data['username'].strip()
            if User.objects.filter(username__iexact=new_username).exclude(pk=admin_user.pk).exists():
                raise ValidationError({'username': 'Username is already taken.'})
            admin_user.username = new_username

        if 'name' in validated_data:
            admin_user.name = validated_data['name'].strip()

        new_password = validated_data.get('new_password')
        if new_password:
            curr_password = validated_data.get('current_password', '')
            if not admin_user.check_password(curr_password):
                raise ValidationError({'current_password': 'Current password is incorrect.'})
            admin_user.set_password(new_password)

        admin_user.save()
        ActivityLogService.log(
            action='Admin Profile Updated',
            description=f'Super Admin {admin_user.email} updated account profile.',
            actor=admin_user,
            target_type=ActivityLog.TARGET_ADMIN,
            target_id=str(admin_user.pk),
            request=request,
        )
        return admin_user

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
    def get_company_or_404(company_id) -> Company:
        company = Company.objects.prefetch_related('hr_admins__user').filter(pk=company_id).first()
        if company is None:
            raise NotFound(f'Company with id={company_id} not found.')
        return company

    @staticmethod
    @transaction.atomic
    def moderate_company(
        company_id: int,
        action: str,
        remarks: str,
        actor,
        request=None,
    ) -> Company:
        """Unified moderation handler for approve, reject, suspend, and reactivate."""
        company = SuperAdminService.get_company_or_404(company_id)
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

        ActivityLogService.log(
            action=cfg['log_action'],
            description=f"{company.name} ({company.registration_number}) transitioned from '{prev_status}' to '{company.status}'.",
            actor=actor,
            target_type=ActivityLog.TARGET_COMPANY,
            target_id=str(company.id),
            metadata={'previous_status': prev_status, 'new_status': company.status, 'remarks': company.remarks},
            request=request,
        )
        return company

    @staticmethod
    def get_company_verification_doc_stream(company: Company, doc_key: str) -> tuple[io.BytesIO, str, str]:
        """Stream an uploaded company verification file with path-traversal protection."""
        field_name = SuperAdminService.DOC_FIELD_MAP.get(doc_key)
        if not field_name:
            raise NotFound(f'Unknown verification document type: {doc_key}')

        file_field = getattr(company, field_name, None)
        if not file_field:
            raise NotFound(f"No '{doc_key}' verification file was uploaded for {company.name}.")

        media_root = Path(os.path.realpath(settings.MEDIA_ROOT))
        target_path = Path(os.path.realpath(file_field.path))
        if media_root not in target_path.parents or not target_path.is_file():
            raise PermissionDenied('Verification file path could not be resolved securely.')

        with open(target_path, 'rb') as fh:
            data = fh.read()
        guessed_type, _ = mimetypes.guess_type(str(target_path))
        content_type = guessed_type or 'application/octet-stream'
        return io.BytesIO(data), content_type, target_path.name

    @staticmethod
    def list_users(role_filter: str = '', status_filter: str = '', search: str = ''):
        qs = User.objects.select_related('hr_profile__company', 'employee_profile__company').all()

        if role_filter and role_filter != 'all':
            qs = qs.filter(role=role_filter.strip().lower())

        if status_filter and status_filter != 'all':
            qs = qs.filter(status=status_filter.strip().lower())

        if search and search.strip():
            term = search.strip()
            qs = qs.filter(
                Q(name__icontains=term)
                | Q(email__icontains=term)
                | Q(username__icontains=term)
                | Q(hr_profile__company__name__icontains=term)
                | Q(employee_profile__company_name__icontains=term)
                | Q(employee_profile__company__name__icontains=term)
                | Q(employee_profile__employee_id__icontains=term)
            ).distinct()

        return qs.order_by('-date_joined')

    @staticmethod
    def get_user_or_404(user_id):
        user = (
            User.objects.select_related('hr_profile__company', 'employee_profile__company')
            .filter(pk=user_id)
            .first()
        )
        if user is None:
            raise NotFound(f'User with id={user_id} not found.')
        return user

    @staticmethod
    @transaction.atomic
    def update_user_status(user_id: int, new_status: str, actor, request=None):
        target_user = SuperAdminService.get_user_or_404(user_id)
        if target_user.pk == actor.pk and new_status != User.STATUS_ACTIVE:
            raise ValidationError({'status': 'You cannot suspend or deactivate your own Super Admin account.'})
        if target_user.role == User.ROLE_SUPERADMIN and new_status != User.STATUS_ACTIVE:
            raise ValidationError({'status': 'Super Admin accounts cannot be deactivated via this endpoint.'})

        prev_status = target_user.status
        target_user.status = new_status
        target_user.is_active = new_status == User.STATUS_ACTIVE
        target_user.save(update_fields=['status', 'is_active', 'updated_at'])

        action_label = 'User Activated' if new_status == User.STATUS_ACTIVE else 'User Deactivated'
        ActivityLogService.log(
            action=action_label,
            description=f'User {target_user.email} ({target_user.role}) status updated from {prev_status} to {new_status}.',
            actor=actor,
            target_type=ActivityLog.TARGET_USER,
            target_id=str(target_user.pk),
            metadata={'previous_status': prev_status, 'new_status': new_status},
            request=request,
        )
        return target_user

    @staticmethod
    @transaction.atomic
    def update_user_account(user_id: int, validated_data: dict, actor, request=None):
        target_user = SuperAdminService.get_user_or_404(user_id)
        if 'status' in validated_data and validated_data['status'] != target_user.status:
            SuperAdminService.update_user_status(user_id, validated_data['status'], actor, request=request)
            target_user.refresh_from_db()

        changed = []
        if 'name' in validated_data and validated_data['name'].strip():
            target_user.name = validated_data['name'].strip()
            changed.append('name')
        if 'role' in validated_data:
            if target_user.pk == actor.pk and validated_data['role'] != User.ROLE_SUPERADMIN:
                raise ValidationError({'role': 'You cannot demote your own Super Admin role.'})
            target_user.role = validated_data['role']
            changed.append('role')
        if changed:
            changed.append('updated_at')
            target_user.save(update_fields=changed)
            ActivityLogService.log(
                action='User Updated',
                description=f'Updated fields ({", ".join(changed)}) for user {target_user.email}.',
                actor=actor,
                target_type=ActivityLog.TARGET_USER,
                target_id=str(target_user.pk),
                request=request,
            )
        return target_user

    @staticmethod
    def list_all_documents(doc_type: str = '', doc_status: str = '', company_id: str = '', search: str = ''):
        qs = IssuedDocument.objects.select_related('company', 'employee_profile').all()

        if doc_type and doc_type != 'all':
            qs = qs.filter(document_type=doc_type.strip())
        if doc_status and doc_status != 'all':
            if doc_status.strip() == 'verified':
                qs = qs.filter(status__in=[IssuedDocument.STATUS_VERIFIED, IssuedDocument.STATUS_ACTIVE])
            else:
                qs = qs.filter(status=doc_status.strip())
        if company_id and str(company_id).isdigit():
            qs = qs.filter(company_id=int(company_id))
        if search and search.strip():
            term = search.strip()
            qs = qs.filter(
                Q(verification_id__icontains=term)
                | Q(reference_number__icontains=term)
                | Q(recipient_name__icontains=term)
                | Q(recipient_email__icontains=term)
                | Q(issuer_name__icontains=term)
                | Q(company__name__icontains=term)
                | Q(employee_id__icontains=term)
            )
        return qs.order_by('-issue_date', '-created_at')

    @staticmethod
    def verify_document_integrity(identifier: str, actor, request=None) -> dict:
        """Perform administrative cryptographic integrity audit of an issued document."""
        doc = DocumentService.get_document_by_identifier(identifier)

        computed_hash = ''
        if doc.file and os.path.isfile(doc.file.path):
            with open(doc.file.path, 'rb') as fh:
                computed_hash = hashlib.sha256(fh.read()).hexdigest()
        else:
            # Verify generated hash exists cleanly
            if not doc.file_hash:
                DocumentService.generate_certificate_pdf_bytes(doc)
            computed_hash = doc.file_hash

        hash_matches = bool(doc.file_hash and computed_hash == doc.file_hash)
        is_authentic = hash_matches and doc.status != IssuedDocument.STATUS_REVOKED

        ActivityLogService.log(
            action='Document Verified',
            description=f'Super Admin audited integrity of {doc.verification_id} (status={doc.status}, authentic={is_authentic}).',
            actor=actor,
            target_type=ActivityLog.TARGET_DOCUMENT,
            target_id=doc.verification_id,
            metadata={'status': doc.status, 'hash_matches': hash_matches},
            request=request,
        )

        return {
            'verification_id': doc.verification_id,
            'reference_number': doc.reference_number,
            'document_type': doc.document_type,
            'issuer_name': doc.resolved_issuer_name,
            'recipient_name': doc.recipient_name,
            'status': doc.status,
            'is_authentic': is_authentic,
            'hash_matches': hash_matches,
            'stored_file_hash': doc.file_hash,
            'computed_file_hash': computed_hash,
            'transaction_hash': doc.transaction_hash,
            'block_number': doc.block_number,
            'revocation_reason': doc.revocation_reason,
        }

    @staticmethod
    def get_platform_stats() -> dict:
        """Compute real-time platform KPI metrics directly from MySQL tables."""
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
    def list_activity_logs(action_filter: str = '', target_type: str = '', search: str = ''):
        qs = ActivityLog.objects.select_related('actor').all()

        if action_filter and action_filter != 'all':
            qs = qs.filter(action__iexact=action_filter.strip())
        if target_type and target_type != 'all':
            qs = qs.filter(target_type=target_type.strip().lower())
        if search and search.strip():
            term = search.strip()
            qs = qs.filter(
                Q(action__icontains=term)
                | Q(description__icontains=term)
                | Q(performed_by__icontains=term)
                | Q(target_id__icontains=term)
            )

        return qs.order_by('-created_at')

