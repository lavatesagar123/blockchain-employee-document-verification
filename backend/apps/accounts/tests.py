"""Tests for Authentication and Role-Based Authorization."""

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.employees.models import EmployeeProfile

User = get_user_model()


class AuthenticationAndRBACTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('employee-register')
        self.login_url = reverse('auth-login')
        self.logout_url = reverse('auth-logout')
        self.me_url = reverse('auth-me')
        self.refresh_url = reverse('auth-refresh')
        self.employee_profile_url = reverse('employee-profile-me')
        self.employee_docs_url = reverse('employee-document-list')

        self.employee_user = User.objects.create_user(
            email='sagar.lavate@trustdoc.io',
            password='StrongPassword123',
            name='Sagar Lavate',
            role=User.ROLE_EMPLOYEE,
        )
        self.employee_profile = EmployeeProfile.objects.create(
            user=self.employee_user,
            employee_id='EMP-1092',
            designation='Full Stack Developer',
            company_name='TrustDoc Technologies',
        )

        self.hr_user = User.objects.create_user(
            email='hr@trustdoc.io',
            password='HrPassword123',
            name='Rohan Deshmukh',
            role=User.ROLE_HR,
        )

    def test_login_by_email_returns_tokens_and_user_payload(self):
        res = self.client.post(
            self.login_url,
            {'email': 'sagar.lavate@trustdoc.io', 'password': 'StrongPassword123'},
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertIn('token', res.data)
        self.assertEqual(res.data['user']['email'], 'sagar.lavate@trustdoc.io')
        self.assertEqual(res.data['user']['role'], 'employee')
        self.assertEqual(res.data['user']['employee_id'], 'EMP-1092')

    def test_login_by_employee_id_succeeds(self):
        res = self.client.post(
            self.login_url,
            {'username': 'EMP-1092', 'password': 'StrongPassword123'},
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['user']['email'], 'sagar.lavate@trustdoc.io')

    def test_invalid_credentials_rejected(self):
        res = self.client.post(
            self.login_url,
            {'email': 'sagar.lavate@trustdoc.io', 'password': 'WrongPassword'},
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_suspended_user_cannot_login(self):
        self.employee_user.status = User.STATUS_SUSPENDED
        self.employee_user.save(update_fields=['status'])
        res = self.client.post(
            self.login_url,
            {'email': 'sagar.lavate@trustdoc.io', 'password': 'StrongPassword123'},
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_me_endpoint_requires_authentication(self):
        res = self.client.get(self.me_url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(user=self.employee_user)
        res = self.client.get(self.me_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['employee_id'], 'EMP-1092')

    def test_hr_role_blocked_from_employee_only_endpoints(self):
        self.client.force_authenticate(user=self.hr_user)
        res_profile = self.client.get(self.employee_profile_url)
        res_docs = self.client.get(self.employee_docs_url)
        self.assertEqual(res_profile.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res_docs.status_code, status.HTTP_403_FORBIDDEN)

    def test_logout_blacklists_refresh_token(self):
        login_res = self.client.post(
            self.login_url,
            {'email': 'sagar.lavate@trustdoc.io', 'password': 'StrongPassword123'},
            format='json',
        )
        access = login_res.data['access']
        refresh = login_res.data['refresh']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        logout_res = self.client.post(self.logout_url, {'refresh': refresh}, format='json')
        self.assertEqual(logout_res.status_code, status.HTTP_204_NO_CONTENT)

        # Refresh token should now be rejected
        self.client.credentials()
        refresh_res = self.client.post(self.refresh_url, {'refresh': refresh}, format='json')
        self.assertEqual(refresh_res.status_code, status.HTTP_401_UNAUTHORIZED)
