"""Super Admin service layer for Admin profile, user administration, and platform document queries."""

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import NotFound, ValidationError

from apps.audit_logs.services import AuditLogService
from apps.documents.models import IssuedDocument

User = get_user_model()


class AdminPanelService:
    """Super Admin domain operations (delegating Company/Verification/Dashboard/Audit to shared services)."""

    @staticmethod
    @transaction.atomic
    def update_admin_profile(admin_user, validated_data: dict, request=None):
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

        if validated_data.get('new_password'):
            curr_password = validated_data.get('current_password', '')
            if not admin_user.check_password(curr_password):
                raise ValidationError({'current_password': 'Current password is incorrect.'})
            admin_user.set_password(validated_data['new_password'])

        admin_user.save()
        AuditLogService.log(
            action='Admin Profile Updated',
            description=f'Super Admin {admin_user.email} updated account profile.',
            actor=admin_user,
            target_type='admin',
            target_id=str(admin_user.pk),
            request=request,
        )
        return admin_user

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
        target_user = AdminPanelService.get_user_or_404(user_id)
        if target_user.pk == actor.pk and new_status != User.STATUS_ACTIVE:
            raise ValidationError({'status': 'You cannot suspend or deactivate your own Super Admin account.'})
        if target_user.role == User.ROLE_SUPERADMIN and new_status != User.STATUS_ACTIVE:
            raise ValidationError({'status': 'Super Admin accounts cannot be deactivated via this endpoint.'})

        prev_status = target_user.status
        target_user.status = new_status
        target_user.is_active = new_status == User.STATUS_ACTIVE
        target_user.save(update_fields=['status', 'is_active', 'updated_at'])

        action_label = 'User Activated' if new_status == User.STATUS_ACTIVE else 'User Deactivated'
        AuditLogService.log(
            action=action_label,
            description=f'User {target_user.email} ({target_user.role}) status updated from {prev_status} to {new_status}.',
            actor=actor,
            target_type='user',
            target_id=str(target_user.pk),
            metadata={'previous_status': prev_status, 'new_status': new_status},
            request=request,
        )
        return target_user

    @staticmethod
    @transaction.atomic
    def update_user_account(user_id: int, validated_data: dict, actor, request=None):
        target_user = AdminPanelService.get_user_or_404(user_id)
        if 'status' in validated_data and validated_data['status'] != target_user.status:
            AdminPanelService.update_user_status(user_id, validated_data['status'], actor, request=request)
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
            AuditLogService.log(
                action='User Updated',
                description=f'Updated fields ({", ".join(changed)}) for user {target_user.email}.',
                actor=actor,
                target_type='user',
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

