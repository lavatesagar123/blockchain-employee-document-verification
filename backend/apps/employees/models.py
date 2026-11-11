"""Models for Company affiliation and Employee Profile management."""

from django.conf import settings
from django.db import models


class Company(models.Model):
    """Corporate issuing organization linked to employees and issued documents."""

    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_SUSPENDED = 'suspended'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending Approval'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
        (STATUS_SUSPENDED, 'Suspended'),
    ]

    name = models.CharField(max_length=255)
    registration_number = models.CharField(max_length=100, unique=True)
    email = models.EmailField(max_length=255)
    phone = models.CharField(max_length=30, blank=True, default='')
    website = models.CharField(max_length=255, blank=True, default='')
    address = models.TextField(blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    tagline = models.CharField(
        max_length=255,
        blank=True,
        default='Secure Documents | Trusted Future',
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'companies'
        ordering = ['name']
        verbose_name = 'Company'
        verbose_name_plural = 'Companies'

    def __str__(self):
        return f'{self.name} ({self.registration_number})'


class EmployeeProfile(models.Model):
    """Profile record for an authenticated Employee user."""

    EMPLOYMENT_FULL_TIME = 'Full Time'
    EMPLOYMENT_PART_TIME = 'Part Time'
    EMPLOYMENT_CONTRACT = 'Contract'
    EMPLOYMENT_INTERN = 'Intern'

    EMPLOYMENT_TYPE_CHOICES = [
        (EMPLOYMENT_FULL_TIME, 'Full Time'),
        (EMPLOYMENT_PART_TIME, 'Part Time'),
        (EMPLOYMENT_CONTRACT, 'Contract'),
        (EMPLOYMENT_INTERN, 'Intern'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='employee_profile',
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employees',
    )
    company_name = models.CharField(max_length=255, blank=True, default='')
    employee_id = models.CharField(max_length=50, unique=True, db_index=True)
    phone = models.CharField(max_length=30, blank=True, default='')
    designation = models.CharField(max_length=150, blank=True, default='')
    department = models.CharField(max_length=150, blank=True, default='')
    employment_type = models.CharField(
        max_length=50,
        choices=EMPLOYMENT_TYPE_CHOICES,
        default=EMPLOYMENT_FULL_TIME,
    )
    joining_date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=200, blank=True, default='')
    bio = models.TextField(blank=True, default='')
    linkedin_url = models.URLField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'employee_profiles'
        ordering = ['-created_at']
        verbose_name = 'Employee Profile'
        verbose_name_plural = 'Employee Profiles'

    @property
    def resolved_company_name(self) -> str:
        if self.company:
            return self.company.name
        return self.company_name

    def __str__(self):
        return f'{self.employee_id} - {self.user.name}'
