"""Service layer for HR Management, Company Registration/Profile, Workforce Directory, and Dashboard Metrics."""

import re
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Q
from django.utils.crypto import get_random_string
from rest_framework.exceptions import NotFound, ValidationError

from apps.documents.models import IssuedDocument
from apps.documents.serializers import EmployeeDocumentSerializer
from apps.employees.models import Company, EmployeeProfile
from apps.employees.services import EmployeeService
from .models import HRProfile

User = get_user_model()


class HRService:
    """Encapsulates Company registration/profiles, HR profiles, company workforce management, and KPIs."""

    @staticmethod
    @transaction.atomic
    def register_company_and_hr(validated_data: dict) -> tuple[Company, HRProfile]:
        """Register a new Company (pending Super Admin approval) and its primary HR Administrator atomically."""
        reg_num = validated_data['registration_number'].strip()
        hr_email = validated_data['hr_email'].strip().lower()

        if Company.objects.filter(registration_number__iexact=reg_num).exists():
            raise ValidationError({
                'registration_number': 'A company with this registration number / CIN is already registered.'
            })

        if User.objects.filter(email__iexact=hr_email).exists():
            raise ValidationError({
                'hr_email': 'A user account with this HR work email already exists.'
            })

        company = Company.objects.create(
            name=validated_data['name'].strip(),
            registration_number=reg_num,
            email=validated_data['email'].strip().lower(),
            phone=validated_data['phone'].strip(),
            website=(validated_data.get('website') or '').strip(),
            industry=(validated_data.get('industry') or '').strip(),
            company_size=(validated_data.get('company_size') or '').strip(),
            street_address=(validated_data.get('street_address') or '').strip(),
            address=validated_data['address'].strip(),
            city=(validated_data.get('city') or '').strip(),
            state=(validated_data.get('state') or '').strip(),
            postal_code=(validated_data.get('postal_code') or '').strip(),
            country=(validated_data.get('country') or 'India').strip(),
            certificate_of_incorporation=validated_data.get('certificate_of_incorporation'),
            tax_id_document=validated_data.get('tax_id_document'),
            address_proof=validated_data.get('address_proof'),
            hr_authorization_letter=validated_data.get('hr_authorization_letter'),
            status=Company.STATUS_PENDING,
        )

        hr_user = User.objects.create_user(
            email=hr_email,
            password=validated_data['password'],
            name=validated_data['hr_name'].strip(),
            role=User.ROLE_HR,
            status=User.STATUS_ACTIVE,
        )

        hr_profile = HRProfile.objects.create(
            user=hr_user,
            company=company,
            designation=(validated_data.get('hr_designation') or 'HR Manager').strip(),
            phone=(validated_data.get('hr_phone') or validated_data['phone']).strip(),
            is_primary=True,
        )

        return company, hr_profile

    @staticmethod
    def get_company_by_query(query: str) -> Company:
        """Resolve a company by registration_number, numeric ID, or TD-REG-YYYY-NNNNN reference ID."""
        clean = (query or '').strip()
        if not clean:
            raise NotFound('Query parameter is required.')

        company = Company.objects.filter(registration_number__iexact=clean).first()
        if company is None and clean.isdigit():
            company = Company.objects.filter(pk=int(clean)).first()
        if company is None:
            match = re.match(r'^TD-REG-\d{4}-(\d+)$', clean, re.IGNORECASE)
            if match:
                company = Company.objects.filter(pk=int(match.group(1))).first()

        if company is None:
            raise NotFound(f'No company application found for: {clean}')
        return company

    @staticmethod
    def get_hr_profile(user) -> HRProfile:
        hr_profile = (
            HRProfile.objects.select_related('user', 'company')
            .filter(user=user)
            .first()
        )
        if hr_profile is None:
            raise NotFound('HR profile is not linked to an organization.')
        return hr_profile

    @staticmethod
    @transaction.atomic
    def update_company_profile(company: Company, validated_data: dict) -> Company:
        """Update editable corporate profile fields."""
        editable = [
            'phone',
            'address',
            'street_address',
            'city',
            'state',
            'postal_code',
            'country',
            'website',
            'tagline',
            'logo',
        ]
        updated_fields = []
        for field in editable:
            if field in validated_data:
                val = validated_data[field]
                if val is not None or field == 'logo':
                    setattr(company, field, val.strip() if isinstance(val, str) else val)
                    updated_fields.append(field)

        if updated_fields:
            updated_fields.append('updated_at')
            company.save(update_fields=updated_fields)
        return company

    @staticmethod
    @transaction.atomic
    def update_hr_profile(user, validated_data: dict) -> HRProfile:
        """Update HR Administrator's personal profile details."""
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
        """List employees belonging strictly to the HR user's company with search and filters."""
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
        """Create User and EmployeeProfile linked to HR's company."""
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

        # Link any pre-issued documents for this company/email/employee_id
        IssuedDocument.objects.filter(
            company=company,
            employee_profile__isnull=True,
        ).filter(
            Q(recipient_email__iexact=email) | Q(employee_id__iexact=emp_id)
        ).update(employee_profile=profile)

        return profile

    @staticmethod
    def get_company_employee_by_identifier(company: Company, identifier: str) -> EmployeeProfile:
        """Look up a company employee by numeric ID or employee_id."""
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
        """Update employee attributes or status within HR's company."""
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

    @staticmethod
    def get_hr_dashboard_stats(company: Company) -> dict:
        """Compute live HR dashboard statistics strictly from database records."""
        emp_qs = EmployeeProfile.objects.filter(company=company)
        doc_qs = IssuedDocument.objects.filter(company=company)

        type_counts_raw = doc_qs.values('document_type').annotate(count=Count('id'))
        documents_by_type = {row['document_type']: row['count'] for row in type_counts_raw}

        recent_docs = doc_qs.select_related('company', 'employee_profile').order_by('-issue_date', '-created_at')[:5]

        return {
            'company_id': company.id,
            'company_name': company.name,
            'company_status': company.status,
            'total_employees': emp_qs.count(),
            'active_employees': emp_qs.filter(user__status=User.STATUS_ACTIVE).count(),
            'total_documents': doc_qs.count(),
            'verified_documents': doc_qs.filter(
                status__in=[IssuedDocument.STATUS_VERIFIED, IssuedDocument.STATUS_ACTIVE]
            ).count(),
            'revoked_documents': doc_qs.filter(status=IssuedDocument.STATUS_REVOKED).count(),
            'documents_by_type': documents_by_type,
            'recent_documents': EmployeeDocumentSerializer(recent_docs, many=True).data,
        }
