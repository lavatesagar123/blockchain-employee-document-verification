"""Serializers for employee document portfolio and inspection endpoints."""

from rest_framework import serializers
from .models import IssuedDocument


class EmployeeDocumentSerializer(serializers.ModelSerializer):
    """Serializer returning all fields expected by React EmployeeDashboard, MyDocumentsPage, and DocumentDetailsPage."""

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
        return f'/api/employee/documents/{obj.verification_id}/download/'
