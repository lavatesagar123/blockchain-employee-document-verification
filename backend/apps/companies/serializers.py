"""Serializers for Company Registration, Company Profiles, and Admin Company Auditing."""

from rest_framework import serializers

from apps.common.utils import validate_phone_number, validate_uploaded_file
from apps.employees.models import Company


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
        return validate_phone_number(value, required=True)

    def validate_hr_phone(self, value):
        return validate_phone_number(value)

    def validate_certificate_of_incorporation(self, value):
        return validate_uploaded_file(value)

    def validate_tax_id_document(self, value):
        return validate_uploaded_file(value)

    def validate_address_proof(self, value):
        return validate_uploaded_file(value)

    def validate_hr_authorization_letter(self, value):
        return validate_uploaded_file(value)

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
    """Shared read serializer for Company Profile and registration tracking."""

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
            'id', 'reference_id', 'name', 'registration_number', 'email', 'phone',
            'website', 'industry', 'company_size', 'street_address', 'address',
            'city', 'state', 'postal_code', 'country', 'tagline', 'status', 'remarks',
            'hr_name', 'hr_email', 'hr_designation', 'total_employees', 'total_documents',
            'documents_uploaded', 'created_at', 'updated_at',
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


class AdminCompanySerializer(CompanyProfileSerializer):
    """Extends CompanyProfileSerializer with secure verification document download metadata."""

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
        return validate_phone_number(value)

    def validate_logo(self, value):
        return validate_uploaded_file(value, allowed_ext=('.png', '.jpg', '.jpeg'), max_mb=3)


class CompanyActionRemarksSerializer(serializers.Serializer):
    remarks = serializers.CharField(required=False, allow_blank=True, default='', max_length=2000)

