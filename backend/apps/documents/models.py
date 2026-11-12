"""Models for Issued Employment Documents and Download/Access Audit Logging."""

from django.conf import settings
from django.db import models
from apps.common.models import TimeStampedModel


class IssuedDocument(TimeStampedModel):
    """Employment document anchored to the TrustDoc verification ledger."""

    TYPE_OFFER = 'offer_letter'
    TYPE_LOI = 'letter_of_intent'
    TYPE_EXPERIENCE = 'experience_letter'
    TYPE_RELIEVING = 'relieving_letter'

    DOCUMENT_TYPE_CHOICES = [
        (TYPE_OFFER, 'Offer Letter'),
        (TYPE_LOI, 'Letter of Intent'),
        (TYPE_EXPERIENCE, 'Experience Letter'),
        (TYPE_RELIEVING, 'Relieving Letter'),
    ]

    STATUS_VERIFIED = 'verified'
    STATUS_ACTIVE = 'active'
    STATUS_REVOKED = 'revoked'

    STATUS_CHOICES = [
        (STATUS_VERIFIED, 'Verified'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_REVOKED, 'Revoked'),
    ]

    verification_id = models.CharField(max_length=64, unique=True, db_index=True)
    reference_number = models.CharField(max_length=120, unique=True)
    document_type = models.CharField(
        max_length=40,
        choices=DOCUMENT_TYPE_CHOICES,
        db_index=True,
    )

    company = models.ForeignKey(
        'employees.Company',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='issued_documents',
    )
    issuer_name = models.CharField(max_length=255)

    employee_profile = models.ForeignKey(
        'employees.EmployeeProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documents',
    )
    employee_id = models.CharField(max_length=50, blank=True, default='', db_index=True)

    recipient_name = models.CharField(max_length=255)
    recipient_email = models.EmailField(max_length=255, db_index=True)
    recipient_phone = models.CharField(max_length=30, blank=True, default='')

    designation = models.CharField(max_length=150)
    department = models.CharField(max_length=150, blank=True, default='')
    employment_type = models.CharField(max_length=50, default='Full Time')

    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    resignation_date = models.DateField(null=True, blank=True)
    acceptance_deadline = models.DateField(null=True, blank=True)

    compensation = models.CharField(max_length=100, blank=True, default='')
    monthly_salary = models.CharField(max_length=100, blank=True, default='')
    location = models.CharField(max_length=200, blank=True, default='')
    reporting_manager = models.CharField(max_length=255, blank=True, default='')

    signatory_name = models.CharField(max_length=255, blank=True, default='')
    signatory_role = models.CharField(max_length=150, blank=True, default='HR Manager')
    custom_description = models.TextField(blank=True, default='')
    remarks = models.TextField(blank=True, default='')

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_VERIFIED,
        db_index=True,
    )
    revocation_reason = models.TextField(blank=True, default='')

    file = models.FileField(upload_to='issued_documents/%Y/%m/', null=True, blank=True)
    file_hash = models.CharField(max_length=64, blank=True, default='')
    transaction_hash = models.CharField(max_length=66, blank=True, default='')
    block_number = models.PositiveBigIntegerField(null=True, blank=True)

    issue_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'issued_documents'
        ordering = ['-issue_date', '-created_at']
        verbose_name = 'Issued Document'
        verbose_name_plural = 'Issued Documents'

    @property
    def resolved_issuer_name(self) -> str:
        if self.company:
            return self.company.name
        return self.issuer_name

    def __str__(self):
        return f'{self.verification_id} ({self.get_document_type_display()} - {self.recipient_name})'


class DocumentAuditLog(models.Model):
    """Audit trail recording authenticated document inspections and downloads."""

    ACTION_ISSUED = 'issued'
    ACTION_VIEWED = 'viewed'
    ACTION_DOWNLOADED = 'downloaded'
    ACTION_REVOKED = 'revoked'

    ACTION_CHOICES = [
        (ACTION_ISSUED, 'Issued'),
        (ACTION_VIEWED, 'Viewed'),
        (ACTION_DOWNLOADED, 'Downloaded'),
        (ACTION_REVOKED, 'Revoked'),
    ]

    document = models.ForeignKey(
        IssuedDocument,
        on_delete=models.CASCADE,
        related_name='audit_logs',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='document_audit_logs',
    )
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'document_audit_logs'
        ordering = ['-created_at']
        verbose_name = 'Document Audit Log'
        verbose_name_plural = 'Document Audit Logs'

    def __str__(self):
        return f'{self.document.verification_id} - {self.action} by {self.user_id}'
