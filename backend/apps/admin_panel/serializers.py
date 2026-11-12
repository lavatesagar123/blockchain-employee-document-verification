"""Serializers specific to Super Admin profile and user account administration."""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.documents.serializers import EmployeeDocumentSerializer

User = get_user_model()


class AdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'name', 'email', 'role',
            'status', 'date_joined', 'last_login', 'updated_at',
        ]
        read_only_fields = ['id', 'role', 'status', 'date_joined', 'last_login', 'updated_at']


class AdminProfileUpdateSerializer(serializers.Serializer):
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
        if attrs.get('new_password') and not attrs.get('current_password'):
            raise serializers.ValidationError({
                'current_password': 'Current password is required to set a new password.'
            })
        return attrs


class AdminUserSerializer(serializers.ModelSerializer):
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
            'id', 'username', 'name', 'email', 'role', 'status', 'is_active',
            'phone', 'designation', 'employee_id', 'company_id', 'company_name',
            'companyName', 'date_joined', 'created_at', 'last_login',
        ]
        read_only_fields = fields

    def get_phone(self, obj):
        hr = getattr(obj, 'hr_profile', None)
        if hr:
            return hr.phone
        emp = getattr(obj, 'employee_profile', None)
        return emp.phone if emp else ''

    def get_designation(self, obj):
        hr = getattr(obj, 'hr_profile', None)
        if hr:
            return hr.designation
        emp = getattr(obj, 'employee_profile', None)
        return emp.designation if emp else ('Platform Administrator' if obj.role == User.ROLE_SUPERADMIN else '')

    def get_employee_id(self, obj):
        emp = getattr(obj, 'employee_profile', None)
        return emp.employee_id if emp else ''

    def get_company_id(self, obj):
        hr = getattr(obj, 'hr_profile', None)
        if hr and hr.company_id:
            return hr.company_id
        emp = getattr(obj, 'employee_profile', None)
        return emp.company_id if emp and emp.company_id else None

    def get_company_name(self, obj):
        hr = getattr(obj, 'hr_profile', None)
        if hr and hr.company:
            return hr.company.name
        emp = getattr(obj, 'employee_profile', None)
        if emp:
            return emp.resolved_company_name
        return 'TrustDoc System' if obj.role == User.ROLE_SUPERADMIN else ''

    def get_companyName(self, obj):
        return self.get_company_name(obj)


class AdminUserUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    status = serializers.ChoiceField(choices=User.STATUS_CHOICES, required=False)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, required=False)


class AdminUserStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=User.STATUS_CHOICES)


class AdminDocumentDetailSerializer(EmployeeDocumentSerializer):
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

