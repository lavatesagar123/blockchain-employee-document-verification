"""Serializers for employee & HR document issuance, listing, inspection, and revocation."""

from django.conf import settings
from rest_framework import serializers
from apps.common.utils import validate_uploaded_file
from .models import IssuedDocument


class EmployeeDocumentSerializer(serializers.ModelSerializer):
    """Read serializer matching React DocumentCertificate, DocumentInfoPanel, and registry tables."""

    issuer_name = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()
    company_address = serializers.SerializerMethodField()
    company_email = serializers.SerializerMethodField()
    company_website = serializers.SerializerMethodField()
    company_tagline = serializers.SerializerMethodField()
    company_city = serializers.SerializerMethodField()
    type = serializers.CharField(source='document_type', read_only=True)
    ref_no = serializers.CharField(source='reference_number', read_only=True)
    has_file = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()
    verification_url = serializers.SerializerMethodField()

    class Meta:
        model = IssuedDocument
        fields = [
            'id',
            'verification_id',
            'reference_number',
            'ref_no',
            'document_type',
            'type',
            'issuer_name',
            'company_name',
            'company_address',
            'company_email',
            'company_website',
            'company_tagline',
            'company_city',
            'employee_id',
            'recipient_name',
            'recipient_email',
            'recipient_phone',
            'designation',
            'department',
            'employment_type',
            'start_date',
            'end_date',
            'resignation_date',
            'acceptance_deadline',
            'compensation',
            'monthly_salary',
            'location',
            'reporting_manager',
            'signatory_name',
            'signatory_role',
            'custom_description',
            'remarks',
            'status',
            'revocation_reason',
            'file_hash',
            'transaction_hash',
            'block_number',
            'issue_date',
            'created_at',
            'has_file',
            'download_url',
            'verification_url',
        ]
        read_only_fields = fields

    def get_issuer_name(self, obj):
        return obj.resolved_issuer_name

    def get_company_name(self, obj):
        return obj.resolved_issuer_name

    def get_company_address(self, obj):
        if obj.company and obj.company.address:
            return obj.company.address
        return obj.location or ''

    def get_company_email(self, obj):
        if obj.company and obj.company.email:
            return obj.company.email
        return ''

    def get_company_website(self, obj):
        if obj.company and obj.company.website:
            return obj.company.website
        return ''

    def get_company_tagline(self, obj):
        if obj.company and obj.company.tagline:
            return obj.company.tagline
        return 'Secure Documents | Trusted Future'

    def get_company_city(self, obj):
        if obj.company and obj.company.city:
            return obj.company.city
        return (obj.location or '').split(',')[0].strip()

    def get_has_file(self, obj):
        return bool(obj.file)

    def get_download_url(self, obj):
        return f'/api/documents/{obj.verification_id}/download/'

    def get_verification_url(self, obj):
        base_url = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:5173')
        return f'{base_url}/verify?id={obj.verification_id}'


class DocumentIssuanceSerializer(serializers.Serializer):
    """Validates HR document creation payload (Offer, LOI, Experience, Relieving)."""

    document_type = serializers.ChoiceField(choices=IssuedDocument.DOCUMENT_TYPE_CHOICES)
    recipient_name = serializers.CharField(max_length=255)
    recipient_email = serializers.EmailField(max_length=255)
    recipient_phone = serializers.CharField(max_length=30, required=False, allow_blank=True, default='')
    employee_id = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    designation = serializers.CharField(max_length=150)
    department = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    employment_type = serializers.CharField(max_length=50, required=False, allow_blank=True, default='Full Time')

    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)
    resignation_date = serializers.DateField(required=False, allow_null=True)
    acceptance_deadline = serializers.DateField(required=False, allow_null=True)

    compensation = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    monthly_salary = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    location = serializers.CharField(max_length=200, required=False, allow_blank=True, default='')
    reporting_manager = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    signatory_name = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    signatory_role = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    custom_description = serializers.CharField(required=False, allow_blank=True, default='')
    customDescription = serializers.CharField(required=False, allow_blank=True, default='')
    remarks = serializers.CharField(required=False, allow_blank=True, default='')
    file = serializers.FileField(required=False, allow_null=True)

    def validate_file(self, value):
        return validate_uploaded_file(value, allowed_ext=('.pdf', '.png', '.jpg', '.jpeg'), max_mb=10)

    def validate(self, attrs):
        doc_type = attrs.get('document_type')
        if doc_type in (IssuedDocument.TYPE_EXPERIENCE, IssuedDocument.TYPE_RELIEVING) and not attrs.get('end_date'):
            raise serializers.ValidationError({
                'end_date': 'End / relieving date is required for experience and relieving letters.'
            })
        if not attrs.get('custom_description') and attrs.get('customDescription'):
            attrs['custom_description'] = attrs['customDescription']
        return attrs


class DocumentRevokeSerializer(serializers.Serializer):
    """Validates document revocation reason."""

    reason = serializers.CharField(max_length=1000)

    def validate_reason(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError('Revocation reason cannot be empty.')
        return cleaned
