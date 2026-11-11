"""Serializers for employee registration and profile management."""

import re
from rest_framework import serializers
from .models import EmployeeProfile


def _validate_phone_digits(value: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        return ''
    digits = re.sub(r'[^0-9]', '', cleaned)
    if len(digits) < 7 or len(digits) > 15:
        raise serializers.ValidationError('Enter a valid phone number (7 to 15 digits).')
    return cleaned


class EmployeeRegistrationSerializer(serializers.Serializer):
    """Validates employee registration input from EmployeeRegistrationPage."""

    name = serializers.CharField(max_length=255)
    email = serializers.EmailField(max_length=255)
    password = serializers.CharField(write_only=True, min_length=6)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True, default='')
    designation = serializers.CharField(max_length=150, required=False, allow_blank=True, default='Professional')
    company_name = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    department = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    location = serializers.CharField(max_length=200, required=False, allow_blank=True, default='')

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError('Full legal name is required.')
        return value.strip()

    def validate_phone(self, value):
        return _validate_phone_digits(value)


class EmployeeProfileSerializer(serializers.ModelSerializer):
    """Read serializer matching frontend EmployeeDashboard and EmployeeProfilePage."""

    user_id = serializers.IntegerField(source='user.id', read_only=True)
    name = serializers.CharField(source='user.name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    status = serializers.CharField(source='user.status', read_only=True)
    company_id = serializers.IntegerField(source='company.id', read_only=True, allow_null=True)
    company_name = serializers.SerializerMethodField()
    companyName = serializers.SerializerMethodField()
    employeeId = serializers.CharField(source='employee_id', read_only=True)

    class Meta:
        model = EmployeeProfile
        fields = [
            'id',
            'user_id',
            'employee_id',
            'employeeId',
            'name',
            'email',
            'role',
            'status',
            'phone',
            'designation',
            'department',
            'employment_type',
            'company_id',
            'company_name',
            'companyName',
            'joining_date',
            'location',
            'bio',
            'linkedin_url',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields

    def get_company_name(self, obj):
        return obj.resolved_company_name

    def get_companyName(self, obj):
        return obj.resolved_company_name


class EmployeeProfileUpdateSerializer(serializers.Serializer):
    """Validates profile update payload (PATCH/PUT /api/employees/me/)."""

    name = serializers.CharField(max_length=255, required=False)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    designation = serializers.CharField(max_length=150, required=False, allow_blank=True)
    department = serializers.CharField(max_length=150, required=False, allow_blank=True)
    location = serializers.CharField(max_length=200, required=False, allow_blank=True)
    bio = serializers.CharField(max_length=2000, required=False, allow_blank=True)
    linkedin_url = serializers.URLField(max_length=255, required=False, allow_blank=True)

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError('Name cannot be blank.')
        return value.strip()

    def validate_phone(self, value):
        return _validate_phone_digits(value)
