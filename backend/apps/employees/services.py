"""Service layer for employee registration and profile management."""

import re
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework.exceptions import ValidationError

from .models import Company, EmployeeProfile

User = get_user_model()


class EmployeeService:
    """Handles employee onboarding, ID assignment, and profile updates."""

    @staticmethod
    def generate_employee_id() -> str:
        """Generate a unique sequential employee identifier like EMP-1001."""
        max_num = 1000
        existing_ids = EmployeeProfile.objects.values_list('employee_id', flat=True)
        for emp_id in existing_ids:
            match = re.match(r'^EMP-(\d+)$', emp_id or '', re.IGNORECASE)
            if match:
                num = int(match.group(1))
                if num > max_num:
                    max_num = num

        candidate_num = max_num + 1
        while EmployeeProfile.objects.filter(employee_id=f'EMP-{candidate_num}').exists():
            candidate_num += 1
        return f'EMP-{candidate_num}'

    @staticmethod
    @transaction.atomic
    def register_employee(validated_data: dict) -> EmployeeProfile:
        """Create User and EmployeeProfile atomically, linking any matching issued documents."""
        email = validated_data['email'].strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise ValidationError({'email': 'An account with this email already exists.'})

        user = User.objects.create_user(
            email=email,
            password=validated_data['password'],
            name=validated_data['name'].strip(),
            role=User.ROLE_EMPLOYEE,
            status=User.STATUS_ACTIVE,
        )

        company_name_input = (validated_data.get('company_name') or '').strip()
        matched_company = None
        if company_name_input:
            matched_company = Company.objects.filter(name__iexact=company_name_input).first()

        employee_id = validated_data.get('employee_id') or EmployeeService.generate_employee_id()

        profile = EmployeeProfile.objects.create(
            user=user,
            company=matched_company,
            company_name=matched_company.name if matched_company else company_name_input,
            employee_id=employee_id,
            phone=(validated_data.get('phone') or '').strip(),
            designation=(validated_data.get('designation') or 'Professional').strip(),
            department=(validated_data.get('department') or '').strip(),
            employment_type=validated_data.get('employment_type') or EmployeeProfile.EMPLOYMENT_FULL_TIME,
            location=(validated_data.get('location') or '').strip(),
        )

        # Attach any documents already issued to this email before registration
        from apps.documents.models import IssuedDocument

        IssuedDocument.objects.filter(
            employee_profile__isnull=True,
            recipient_email__iexact=email,
        ).update(employee_profile=profile)

        return profile

    @staticmethod
    def get_profile_for_user(user) -> EmployeeProfile:
        """Retrieve the EmployeeProfile for an authenticated employee, creating one if absent."""
        profile = (
            EmployeeProfile.objects.select_related('user', 'company')
            .filter(user=user)
            .first()
        )
        if profile is None:
            profile = EmployeeProfile.objects.create(
                user=user,
                employee_id=EmployeeService.generate_employee_id(),
                designation='Employee',
            )
        return profile

    @staticmethod
    @transaction.atomic
    def update_profile_for_user(user, validated_data: dict) -> EmployeeProfile:
        """Update editable employee profile fields and optionally user display name."""
        profile = EmployeeService.get_profile_for_user(user)

        if 'name' in validated_data and validated_data['name']:
            user.name = validated_data['name'].strip()
            user.save(update_fields=['name', 'updated_at'])

        editable_fields = ['phone', 'designation', 'department', 'location', 'bio', 'linkedin_url']
        updated_profile_fields = []
        for field in editable_fields:
            if field in validated_data:
                value = validated_data[field]
                setattr(profile, field, value.strip() if isinstance(value, str) else value)
                updated_profile_fields.append(field)

        if updated_profile_fields:
            updated_profile_fields.append('updated_at')
            profile.save(update_fields=updated_profile_fields)

        return profile
