"""Serializers strictly for HR personal profile and company workforce management."""

from rest_framework import serializers

from apps.common.utils import validate_phone_number
from apps.employees.models import EmployeeProfile
from .models import HRProfile


class HRProfileSerializer(serializers.ModelSerializer):
    """Read serializer for the HR Administrator's personal profile."""

    user_id = serializers.IntegerField(source='user.id', read_only=True)
    name = serializers.CharField(source='user.name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    status = serializers.CharField(source='user.status', read_only=True)
    company_id = serializers.IntegerField(source='company.id', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_status = serializers.CharField(source='company.status', read_only=True)

    class Meta:
        model = HRProfile
        fields = [
            'id', 'user_id', 'name', 'email', 'role', 'status',
            'designation', 'phone', 'is_primary',
            'company_id', 'company_name', 'company_status',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields


class HRProfileUpdateSerializer(serializers.Serializer):
    """Validates updates to the HR administrator's personal profile."""

    name = serializers.CharField(max_length=255, required=False)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    designation = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError('Name cannot be blank.')
        return value.strip()

    def validate_phone(self, value):
        return validate_phone_number(value)


class HREmployeeCreateSerializer(serializers.Serializer):
    """Validates HR onboarding of a new employee from EmployeeManagementPage."""

    name = serializers.CharField(max_length=255)
    email = serializers.EmailField(max_length=255)
    employee_id = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    designation = serializers.CharField(max_length=150)
    department = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True, default='')
    joining_date = serializers.DateField(required=False, allow_null=True)
    employment_type = serializers.ChoiceField(
        choices=EmployeeProfile.EMPLOYMENT_TYPE_CHOICES,
        required=False,
        default=EmployeeProfile.EMPLOYMENT_FULL_TIME,
    )
    location = serializers.CharField(max_length=200, required=False, allow_blank=True, default='')
    password = serializers.CharField(write_only=True, min_length=6, required=False, allow_blank=True)

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError('Full name is required.')
        return value.strip()

    def validate_phone(self, value):
        return validate_phone_number(value)


class HREmployeeUpdateSerializer(serializers.Serializer):
    """Validates HR updates to an existing company employee."""

    name = serializers.CharField(max_length=255, required=False)
    designation = serializers.CharField(max_length=150, required=False)
    department = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    joining_date = serializers.DateField(required=False, allow_null=True)
    employment_type = serializers.ChoiceField(choices=EmployeeProfile.EMPLOYMENT_TYPE_CHOICES, required=False)
    location = serializers.CharField(max_length=200, required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=[('active', 'Active'), ('suspended', 'Suspended')], required=False)

    def validate_phone(self, value):
        return validate_phone_number(value)
