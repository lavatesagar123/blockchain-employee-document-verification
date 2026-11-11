"""Serializers for Company Registration, Company Profile, HR Profile, and HR Employee Directory."""

from rest_framework import serializers
from apps.employees.models import Company, EmployeeProfile
from apps.employees.serializers import _validate_phone_digits
from .models import HRProfile


def _validate_upload_doc(file_obj, allowed_ext=('.pdf', '.png', '.jpg', '.jpeg'), max_mb=5):
    if file_obj is None:
        return None
    if file_obj.size > max_mb * 1024 * 1024:
        raise serializers.ValidationError(f'File size must not exceed {max_mb} MB.')
    if not file_obj.name.lower().endswith(allowed_ext):
        raise serializers.ValidationError(
            f'Unsupported file type. Allowed extensions: {", ".join(allowed_ext)}'
        )
    return file_obj


class CompanyRegistrationSerializer(serializers.Serializer):
    """Validates organization registration payload from CompanyRegistrationPage."""

    name = serializers.CharField(max_length=255)
    registration_number = serializers.CharField(max_length=100)
    email = serializers.EmailField(max_length=255)
    phone = serializers.CharField(max_length=30)
    website = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    industry = serializers.CharField(max_length=120, required=False, allow_blank=True, default='')
    company_size = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')

    street_address = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    city = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    state = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    postal_code = serializers.CharField(max_length=30, required=False, allow_blank=True, default='')
    country = serializers.CharField(max_length=100, required=False, allow_blank=True, default='India')
    address = serializers.CharField(required=False, allow_blank=True, default='')

    hr_name = serializers.CharField(max_length=255)
    hr_email = serializers.EmailField(max_length=255)
    hr_designation = serializers.CharField(max_length=150, required=False, allow_blank=True, default='HR Manager')
    hr_phone = serializers.CharField(max_length=30, required=False, allow_blank=True, default='')
    password = serializers.CharField(write_only=True, min_length=6)

    certificate_of_incorporation = serializers.FileField(required=False, allow_null=True)
    tax_id_document = serializers.FileField(required=False, allow_null=True)
    address_proof = serializers.FileField(required=False, allow_null=True)
    hr_authorization_letter = serializers.FileField(required=False, allow_null=True)

    def validate_registration_number(self, value):
        cleaned = value.strip()
        if len(cleaned) < 4:
            raise serializers.ValidationError('Registration number must be at least 4 characters.')
        return cleaned

    def validate_phone(self, value):
        cleaned = _validate_phone_digits(value)
        if not cleaned:
            raise serializers.ValidationError('Corporate phone number is required.')
        return cleaned

    def validate_hr_phone(self, value):
        return _validate_phone_digits(value)

    def validate_certificate_of_incorporation(self, value):
        return _validate_upload_doc(value)

    def validate_tax_id_document(self, value):
        return _validate_upload_doc(value)

    def validate_address_proof(self, value):
        return _validate_upload_doc(value)

    def validate_hr_authorization_letter(self, value):
        return _validate_upload_doc(value)

    def validate(self, attrs):
        if not attrs.get('address'):
            parts = [
                attrs.get('street_address', '').strip(),
                attrs.get('city', '').strip(),
                attrs.get('state', '').strip(),
                attrs.get('postal_code', '').strip(),
                attrs.get('country', '').strip(),
            ]
            attrs['address'] = ', '.join(p for p in parts if p)
        if not attrs.get('address'):
            raise serializers.ValidationError({'address': 'Registered office address is required.'})
        return attrs


class CompanyProfileSerializer(serializers.ModelSerializer):
    """Read serializer for Company Profile and registration tracking."""

    hr_name = serializers.SerializerMethodField()
    hr_email = serializers.SerializerMethodField()
    hr_designation = serializers.SerializerMethodField()
    total_employees = serializers.SerializerMethodField()
    total_documents = serializers.SerializerMethodField()
    reference_id = serializers.SerializerMethodField()
    documents_uploaded = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            'id',
            'reference_id',
            'name',
            'registration_number',
            'email',
            'phone',
            'website',
            'industry',
            'company_size',
            'street_address',
            'address',
            'city',
            'state',
            'postal_code',
            'country',
            'tagline',
            'status',
            'remarks',
            'hr_name',
            'hr_email',
            'hr_designation',
            'total_employees',
            'total_documents',
            'documents_uploaded',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields

    def _get_primary_hr(self, obj):
        return obj.hr_admins.select_related('user').order_by('-is_primary', 'id').first()

    def get_hr_name(self, obj):
        hr = self._get_primary_hr(obj)
        return hr.user.name if hr else ''

    def get_hr_email(self, obj):
        hr = self._get_primary_hr(obj)
        return hr.user.email if hr else ''

    def get_hr_designation(self, obj):
        hr = self._get_primary_hr(obj)
        return hr.designation if hr else ''

    def get_total_employees(self, obj):
        return obj.employees.count()

    def get_total_documents(self, obj):
        return obj.issued_documents.count()

    def get_reference_id(self, obj):
        year = obj.created_at.year if obj.created_at else 2026
        return f'TD-REG-{year}-{obj.id:05d}'

    def get_documents_uploaded(self, obj):
        return {
            'incorporation': bool(obj.certificate_of_incorporation),
            'tax_id': bool(obj.tax_id_document),
            'address_proof': bool(obj.address_proof),
            'hr_authorization': bool(obj.hr_authorization_letter),
            'logo': bool(obj.logo),
        }


class CompanyProfileUpdateSerializer(serializers.Serializer):
    """Validates editable company fields (PATCH/PUT /api/companies/me/)."""

    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    street_address = serializers.CharField(max_length=255, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    state = serializers.CharField(max_length=100, required=False, allow_blank=True)
    postal_code = serializers.CharField(max_length=30, required=False, allow_blank=True)
    country = serializers.CharField(max_length=100, required=False, allow_blank=True)
    website = serializers.CharField(max_length=255, required=False, allow_blank=True)
    tagline = serializers.CharField(max_length=255, required=False, allow_blank=True)
    logo = serializers.ImageField(required=False, allow_null=True)

    def validate_phone(self, value):
        return _validate_phone_digits(value)

    def validate_logo(self, value):
        return _validate_upload_doc(value, allowed_ext=('.png', '.jpg', '.jpeg'), max_mb=3)


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
            'id',
            'user_id',
            'name',
            'email',
            'role',
            'status',
            'designation',
            'phone',
            'is_primary',
            'company_id',
            'company_name',
            'company_status',
            'created_at',
            'updated_at',
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
        return _validate_phone_digits(value)


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
        return _validate_phone_digits(value)


class HREmployeeUpdateSerializer(serializers.Serializer):
    """Validates HR updates to an existing company employee."""

    name = serializers.CharField(max_length=255, required=False)
    designation = serializers.CharField(max_length=150, required=False)
    department = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    joining_date = serializers.DateField(required=False, allow_null=True)
    employment_type = serializers.ChoiceField(
        choices=EmployeeProfile.EMPLOYMENT_TYPE_CHOICES,
        required=False,
    )
    location = serializers.CharField(max_length=200, required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=[('active', 'Active'), ('suspended', 'Suspended')], required=False)

    def validate_phone(self, value):
        return _validate_phone_digits(value)

