"""Serializers for Super Admin Profile, Company Auditing, User Management, Documents, and Activity Logs."""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.documents.models import IssuedDocument
from apps.documents.serializers import EmployeeDocumentSerializer
from apps.employees.models import Company
from apps.hr.serializers import CompanyProfileSerializer
from .models import ActivityLog

User = get_user_model()


class AdminProfileSerializer(serializers.ModelSerializer):
    """Super Admin personal account profile serializer."""

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'name',
            'email',
            'role',
            'status',
            'date_joined',
            'last_login',
            'updated_at',
        ]
        read_only_fields = ['id', 'role', 'status', 'date_joined', 'last_login', 'updated_at']


class AdminProfileUpdateSerializer(serializers.Serializer):
    """Validates Super Admin profile updates including optional password change."""

    name = serializers.CharField(max_length=255, required=False)
    email = serializers.EmailField(max_length=255, required=False)
    username = serializers.CharField(max_length=150, required=False)
    current_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    new_password = serializers.CharField(write_only=True, min_length=6, required=False, allow_blank=True)

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError('Name cannot be blank.')
        return value.strip()

    def validate_username(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError('Username cannot be blank.')
        return cleaned

    def validate(self, attrs):
        new_pw = attrs.get('new_password')
        curr_pw = attrs.get('current_password')
        if new_pw and not curr_pw:
            raise serializers.ValidationError({
                'current_password': 'Current password is required to set a new password.'
            })
        return attrs


class AdminCompanySerializer(CompanyProfileSerializer):
    """Extends CompanyProfileSerializer with secure verification document download metadata for Super Admin audit."""

    verification_documents = serializers.SerializerMethodField()

    class Meta(CompanyProfileSerializer.Meta):
        fields = CompanyProfileSerializer.Meta.fields + ['verification_documents']
        read_only_fields = fields

    def get_verification_documents(self, obj):
        docs = []
        mapping = [
            ('incorporation', 'Certificate of Incorporation', obj.certificate_of_incorporation),
            ('tax_id', 'Tax ID / PAN / GST Certificate', obj.tax_id_document),
            ('address_proof', 'Registered Address Proof', obj.address_proof),
            ('hr_authorization', 'HR Authorization Letter', obj.hr_authorization_letter),
        ]
        for key, label, field_file in mapping:
            if field_file:
                docs.append({
                    'key': key,
                    'label': label,
                    'filename': field_file.name.split('/')[-1],
                    'download_url': f'/api/admin/companies/{obj.id}/documents/{key}/download/',
                })
        return docs


class CompanyActionRemarksSerializer(serializers.Serializer):
    """Validates optional or mandatory audit remarks for company moderation actions."""

    remarks = serializers.CharField(required=False, allow_blank=True, default='', max_length=2000)


class AdminUserSerializer(serializers.ModelSerializer):
    """Read serializer for HR Admins, Employees, and Super Admins in UserManagementPage."""

    phone = serializers.SerializerMethodField()
    designation = serializers.SerializerMethodField()
    employee_id = serializers.SerializerMethodField()
    company_id = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()
    companyName = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(source='date_joined', read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'name',
            'email',
            'role',
            'status',
            'is_active',
            'phone',
            'designation',
            'employee_id',
            'company_id',
            'company_name',
            'companyName',
            'date_joined',
            'created_at',
            'last_login',
        ]
        read_only_fields = fields

    def _get_hr(self, obj):
        return getattr(obj, 'hr_profile', None)

    def _get_emp(self, obj):
        return getattr(obj, 'employee_profile', None)

    def get_phone(self, obj):
        hr = self._get_hr(obj)
        if hr:
            return hr.phone
        emp = self._get_emp(obj)
        return emp.phone if emp else ''

    def get_designation(self, obj):
        hr = self._get_hr(obj)
        if hr:
            return hr.designation
        emp = self._get_emp(obj)
        return emp.designation if emp else ('Platform Administrator' if obj.role == User.ROLE_SUPERADMIN else '')

    def get_employee_id(self, obj):
        emp = self._get_emp(obj)
        return emp.employee_id if emp else ''

    def get_company_id(self, obj):
        hr = self._get_hr(obj)
        if hr and hr.company_id:
            return hr.company_id
        emp = self._get_emp(obj)
        return emp.company_id if emp and emp.company_id else None

    def get_company_name(self, obj):
        hr = self._get_hr(obj)
        if hr and hr.company:
            return hr.company.name
        emp = self._get_emp(obj)
        if emp:
            return emp.resolved_company_name
        return 'TrustDoc System' if obj.role == User.ROLE_SUPERADMIN else ''

    def get_companyName(self, obj):
        return self.get_company_name(obj)


class AdminUserUpdateSerializer(serializers.Serializer):
    """Validates Super Admin user account edits."""

    name = serializers.CharField(max_length=255, required=False)
    status = serializers.ChoiceField(choices=User.STATUS_CHOICES, required=False)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, required=False)


class AdminUserStatusSerializer(serializers.Serializer):
    """Validates activation/deactivation status toggle payload."""

    status = serializers.ChoiceField(choices=User.STATUS_CHOICES)


class AdminDocumentDetailSerializer(EmployeeDocumentSerializer):
    """Extends EmployeeDocumentSerializer with audit history for Super Admin document oversight."""

    audit_logs = serializers.SerializerMethodField()

    class Meta(EmployeeDocumentSerializer.Meta):
        fields = EmployeeDocumentSerializer.Meta.fields + ['audit_logs']
        read_only_fields = fields

    def get_audit_logs(self, obj):
        logs = obj.audit_logs.select_related('user').order_by('-created_at')[:20]
        return [
            {
                'id': log.id,
                'action': log.action,
                'actor_email': log.user.email if log.user else 'System',
                'ip_address': log.ip_address,
                'created_at': log.created_at.isoformat(),
            }
            for log in logs
        ]


class ActivityLogSerializer(serializers.ModelSerializer):
    """Serializer matching ActivityLogPage columns."""

    timestamp = serializers.DateTimeField(source='created_at', read_only=True)
    actor_email = serializers.CharField(source='actor.email', read_only=True, default='')
    actor_role = serializers.CharField(source='actor.role', read_only=True, default='')

    class Meta:
        model = ActivityLog
        fields = [
            'id',
            'timestamp',
            'created_at',
            'action',
            'description',
            'performed_by',
            'actor_email',
            'actor_role',
            'target_type',
            'target_id',
            'ip_address',
            'metadata',
        ]
        read_only_fields = fields

