"""Tests for unified Dashboard API endpoints and role-based access enforcement."""

from datetime import date

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.documents.models import IssuedDocument
from apps.employees.models import Company, EmployeeProfile
from apps.hr.models import HRProfile

User = get_user_model()


class DashboardApiTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            email='admin@dash.local',
            username='admin_dash',
            name='Admin User',
            password='AdminPassword123',
        )
        self.company = Company.objects.create(
            name='Dash Tech Pvt Ltd',
            registration_number='CIN-DASH-001',
            email='hr@dashtech.io',
            status=Company.STATUS_APPROVED,
        )
        self.hr_user = User.objects.create_user(
            email='hr@dashtech.io',
            password='HrPassword123',
            name='HR Lead',
            role=User.ROLE_HR,
        )
        HRProfile.objects.create(user=self.hr_user, company=self.company, designation='HR Manager')

        self.emp_user = User.objects.create_user(
            email='emp@dashtech.io',
            password='EmpPassword123',
            name='Priya Nair',
            role=User.ROLE_EMPLOYEE,
        )
        self.emp_profile = EmployeeProfile.objects.create(
            user=self.emp_user,
            company=self.company,
            employee_id='DT-001',
            designation='Analyst',
        )
        IssuedDocument.objects.create(
            verification_id='TD-DASH-001',
            reference_number='REF-DASH-001',
            document_type=IssuedDocument.TYPE_EXPERIENCE,
            company=self.company,
            issuer_name=self.company.name,
            employee_profile=self.emp_profile,
            employee_id=self.emp_profile.employee_id,
            recipient_name=self.emp_user.name,
            recipient_email=self.emp_user.email,
            designation='Analyst',
            status=IssuedDocument.STATUS_VERIFIED,
            issue_date=date(2026, 3, 1),
        )

    def test_admin_dashboard_requires_superadmin(self):
        url = reverse('dashboard-admin')
        self.client.force_authenticate(user=self.emp_user)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['approved_companies'], 1)
        self.assertEqual(resp.data['total_documents'], 1)

    def test_hr_dashboard_requires_hr_and_scopes_company(self):
        url = reverse('dashboard-hr')
        self.client.force_authenticate(user=self.emp_user)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.hr_user)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['company_name'], self.company.name)
        self.assertEqual(resp.data['total_employees'], 1)
        self.assertEqual(resp.data['verified_documents'], 1)

    def test_employee_dashboard_requires_employee_and_counts_documents(self):
        url = reverse('dashboard-employee')
        self.client.force_authenticate(user=self.hr_user)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.emp_user)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['total_documents'], 1)
        self.assertEqual(resp.data['verified_documents'], 1)
        self.assertEqual(resp.data['revoked_documents'], 0)

