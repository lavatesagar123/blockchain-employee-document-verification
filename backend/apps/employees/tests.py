"""Tests for Employee Registration and Employee Profile Management APIs."""

from datetime import date
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.documents.models import IssuedDocument
from .models import Company, EmployeeProfile

User = get_user_model()


class EmployeeProfileTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('employee-register')
        self.profile_url = reverse('employee-profile-me')

        self.company = Company.objects.create(
            name='TrustDoc Technologies',
            registration_number='CIN-U72200MH2021PTC123456',
            email='hr@trustdoc.com',
            city='Pune',
            address='Pune, Maharashtra - 411001',
            status=Company.STATUS_APPROVED,
        )

        self.emp_user = User.objects.create_user(
            email='employee@trustdoc.io',
            password='Password123',
            name='Priya Sharma',
            role=User.ROLE_EMPLOYEE,
        )
        self.emp_profile = EmployeeProfile.objects.create(
            user=self.emp_user,
            company=self.company,
            company_name=self.company.name,
            employee_id='EMP-1001',
            phone='+91 98220 12345',
            designation='UI/UX Designer',
            department='Design',
        )

    def test_employee_registration_creates_user_profile_and_links_documents(self):
        # Pre-issue a document before employee registers
        doc = IssuedDocument.objects.create(
            verification_id='VC-2026-0999',
            reference_number='TD/HR/2026/0999',
            document_type=IssuedDocument.TYPE_OFFER,
            company=self.company,
            issuer_name=self.company.name,
            recipient_name='Amit Patel',
            recipient_email='amit.patel@example.com',
            designation='Blockchain Engineer',
            issue_date=date(2026, 4, 15),
        )

        res = self.client.post(
            self.register_url,
            {
                'name': 'Amit Patel',
                'email': 'amit.patel@example.com',
                'phone': '+91 97110 54321',
                'designation': 'Blockchain Engineer',
                'company_name': 'TrustDoc Technologies',
                'password': 'SecurePass123',
            },
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        profile_data = res.data['profile']
        self.assertEqual(profile_data['email'], 'amit.patel@example.com')
        self.assertEqual(profile_data['company_name'], 'TrustDoc Technologies')
        self.assertTrue(profile_data['employee_id'].startswith('EMP-'))

        doc.refresh_from_db()
        self.assertIsNotNone(doc.employee_profile)
        self.assertEqual(doc.employee_profile.user.email, 'amit.patel@example.com')

    def test_get_own_employee_profile(self):
        self.client.force_authenticate(user=self.emp_user)
        res = self.client.get(self.profile_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['name'], 'Priya Sharma')
        self.assertEqual(res.data['employee_id'], 'EMP-1001')
        self.assertEqual(res.data['company_name'], 'TrustDoc Technologies')

    def test_patch_employee_profile_updates_editable_fields_only(self):
        self.client.force_authenticate(user=self.emp_user)
        res = self.client.patch(
            self.profile_url,
            {
                'phone': '+91 99999 88888',
                'designation': 'Lead Product Designer',
                'location': 'Bengaluru, Karnataka',
                'employee_id': 'HACK-9999',  # immutable
                'role': 'superadmin',  # immutable
            },
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['phone'], '+91 99999 88888')
        self.assertEqual(res.data['designation'], 'Lead Product Designer')
        self.assertEqual(res.data['location'], 'Bengaluru, Karnataka')
        self.assertEqual(res.data['employee_id'], 'EMP-1001')
        self.assertEqual(res.data['role'], 'employee')

    def test_patch_employee_profile_rejects_invalid_phone(self):
        self.client.force_authenticate(user=self.emp_user)
        res = self.client.patch(self.profile_url, {'phone': '123'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone', res.data)
