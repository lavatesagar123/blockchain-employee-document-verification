"""HR-specific service layer for HR personal profile and company workforce management."""

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.utils.crypto import get_random_string
from rest_framework.exceptions import NotFound, ValidationError

from apps.documents.models import IssuedDocument
from apps.employees.models import Company, EmployeeProfile
from apps.employees.services import EmployeeService
from .models import HRProfile

User = get_user_model()


class HRService:
    """Encapsulates HR personal profile updates and company-scoped employee directory management."""

    @staticmethod
    def get_hr_profile(user) -> HRProfile:
        hr_profile = HRProfile.objects.select_related('user', 'company').filter(user=user).first()
        if hr_profile is None:
            raise NotFound('HR profile is not linked to an organization.')
        return hr_profile

    @staticmethod
    @transaction.atomic
    def update_hr_profile(user, validated_data: dict) -> HRProfile:
        hr_profile = HRService.get_hr_profile(user)

        if 'name' in validated_data and validated_data['name']:
            user.name = validated_data['name'].strip()
            user.save(update_fields=['name', 'updated_at'])
            hr_profile.user = user

        updated_fields = []
        for field in ('phone', 'designation'):
            if field in validated_data:
                val = validated_data[field]
                setattr(hr_profile, field, val.strip() if isinstance(val, str) else val)
                updated_fields.append(field)

        if updated_fields:
            updated_fields.append('updated_at')
            hr_profile.save(update_fields=updated_fields)

        return hr_profile

    @staticmethod
    def get_company_employees(
        company: Company,
        search: str = '',
        department: str = '',
        employment_type: str = '',
        emp_status: str = '',
    ):
        queryset = EmployeeProfile.objects.select_related('user', 'company').filter(company=company)

        if department and department != 'all':
            queryset = queryset.filter(department__iexact=department.strip())
        if employment_type and employment_type != 'all':
            queryset = queryset.filter(employment_type__iexact=employment_type.strip())
        if emp_status and emp_status != 'all':
            queryset = queryset.filter(user__status=emp_status.strip())
        if search and search.strip():
            term = search.strip()
            queryset = queryset.filter(
                Q(user__name__icontains=term)
                | Q(user__email__icontains=term)
                | Q(employee_id__icontains=term)
                | Q(designation__icontains=term)
                | Q(department__icontains=term)
            )
        return queryset.order_by('-created_at')

    @staticmethod
    @transaction.atomic
    def onboard_employee_for_company(company: Company, validated_data: dict) -> EmployeeProfile:
        email = validated_data['email'].strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise ValidationError({'email': 'A user account with this email already exists.'})

        emp_id = (validated_data.get('employee_id') or '').strip()
        if emp_id:
            if EmployeeProfile.objects.filter(employee_id__iexact=emp_id).exists():
                raise ValidationError({'employee_id': 'This Employee ID is already assigned.'})
        else:
            emp_id = EmployeeService.generate_employee_id()

        raw_password = validated_data.get('password') or get_random_string(16)
        emp_user = User.objects.create_user(
            email=email,
            password=raw_password,
            name=validated_data['name'].strip(),
            role=User.ROLE_EMPLOYEE,
            status=User.STATUS_ACTIVE,
        )

        profile = EmployeeProfile.objects.create(
            user=emp_user,
            company=company,
            company_name=company.name,
            employee_id=emp_id,
            phone=(validated_data.get('phone') or '').strip(),
            designation=validated_data['designation'].strip(),
            department=(validated_data.get('department') or '').strip(),
            employment_type=validated_data.get('employment_type') or EmployeeProfile.EMPLOYMENT_FULL_TIME,
            joining_date=validated_data.get('joining_date'),
            location=(validated_data.get('location') or company.city or '').strip(),
        )

        IssuedDocument.objects.filter(
            company=company,
            employee_profile__isnull=True,
        ).filter(
            Q(recipient_email__iexact=email) | Q(employee_id__iexact=emp_id)
        ).update(employee_profile=profile)

        return profile

    @staticmethod
    def get_company_employee_by_identifier(company: Company, identifier: str) -> EmployeeProfile:
        clean = (identifier or '').strip()
        qs = EmployeeProfile.objects.select_related('user', 'company').filter(company=company)
        profile = qs.filter(employee_id__iexact=clean).first()
        if profile is None and clean.isdigit():
            profile = qs.filter(pk=int(clean)).first()
        if profile is None:
            raise NotFound(f'No employee found in organization for identifier: {clean}')
        return profile

    @staticmethod
    @transaction.atomic
    def update_company_employee(profile: EmployeeProfile, validated_data: dict) -> EmployeeProfile:
        user = profile.user
        user_fields = []
        if 'name' in validated_data and validated_data['name']:
            user.name = validated_data['name'].strip()
            user_fields.append('name')
        if 'status' in validated_data:
            user.status = validated_data['status']
            user.is_active = validated_data['status'] == User.STATUS_ACTIVE
            user_fields.extend(['status', 'is_active'])
        if user_fields:
            user_fields.append('updated_at')
            user.save(update_fields=user_fields)

        profile_fields = []
        for field in ('designation', 'department', 'phone', 'joining_date', 'employment_type', 'location'):
            if field in validated_data:
                val = validated_data[field]
                setattr(profile, field, val.strip() if isinstance(val, str) else val)
                profile_fields.append(field)

        if profile_fields:
            profile_fields.append('updated_at')
            profile.save(update_fields=profile_fields)

        return profile
