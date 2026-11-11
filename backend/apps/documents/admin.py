from django.contrib import admin
from .models import DocumentAuditLog, IssuedDocument


@admin.register(IssuedDocument)
class IssuedDocumentAdmin(admin.ModelAdmin):
    list_display = (
        'verification_id',
        'reference_number',
        'document_type',
        'recipient_name',
        'recipient_email',
        'issuer_name',
        'status',
        'issue_date',
    )
    list_filter = ('document_type', 'status')
    search_fields = ('verification_id', 'reference_number', 'recipient_name', 'recipient_email', 'employee_id')


@admin.register(DocumentAuditLog)
class DocumentAuditLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'document', 'user', 'action', 'ip_address', 'created_at')
    list_filter = ('action',)
    search_fields = ('document__verification_id', 'user__email')
