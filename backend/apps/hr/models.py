"""Models for HR Administrator profiles linked to Organizations."""

from django.conf import settings
from django.db import models
from apps.common.models import TimeStampedModel


class HRProfile(TimeStampedModel):
    """Profile record linking an HR Administrator user account to an issuing Company."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='hr_profile',
    )
    company = models.ForeignKey(
        'employees.Company',
        on_delete=models.CASCADE,
        related_name='hr_admins',
    )
    designation = models.CharField(max_length=150, default='HR Manager')
    phone = models.CharField(max_length=30, blank=True, default='')
    is_primary = models.BooleanField(default=True)

    class Meta:
        db_table = 'hr_profiles'
        ordering = ['-created_at']
        verbose_name = 'HR Profile'
        verbose_name_plural = 'HR Profiles'

    def __str__(self):
        return f'{self.user.name} ({self.designation} @ {self.company.name})'

