"""Tests for Super Admin Backend: Admin Auth, Profile, Company Moderation, Verification Docs, Users, Documents, Stats & Logs."""

import os
import tempfile
from datetime import date
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.documents.models import IssuedDocument
from apps.employees.models import Company, EmployeeProfile
from apps.hr.models import HRProfile
from .models import ActivityLog

User = get_user_model()


class SuperAdminBackendTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            email='admin@trustdoc.local',
            username='admin',
            name='Platform Administrator',
            password='AdminSecurePassword123',
        )

        self.pending_company = Company.objects.create(
            name='Apex Cloud Labs',
            registration_number='CIN-APEX-2026',
            email='contact@apexcloud.io',
            phone='+91 9876543210',
            city='Pune',
            address='Hinjewadi Phase 2, Pune',
            status=Company.STATUS_PENDING,
        )
        self.hr_user = User.objects.create_user(
            email='hr@apexcloud.io',
            password='HrPassword123',
            name='Meera Nair',
            role=User.ROLE_HR,
        )
        HRProfile.objects.create(
            user=self.hr_user,
            company=self.pending_company,
            designation='HR Director',
            phone='+91 9876543211',
        )

        self.emp_user = User.objects.create_user(
            email='dev@apexcloud.io',
            password='EmpPassword123',
            name='Karan Verma',
            role=User.ROLE_EMPLOYEE,
        )
        self.emp_profile = EmployeeProfile.objects.create(
            user=self.emp_user,
            company=self.pending_company,
            company_name=self.pending_company.name,
            employee_id='EMP-5001',
            designation='Software Engineer',
        )

        self.doc = IssuedDocument.objects.create(
            verification_id='VC-2026-8801',
            reference_number='TD/HR/2026/8801',
            document_type=IssuedDocument.TYPE_OFFER,
            company=self.pending_company,
            issuer_name=self.pending_company.name,
            employee_profile=self.emp_profile,
            employee_id='EMP-5001',
            recipient_name='Karan Verma',
            recipient_email='dev@apexcloud.io',
            designation='Software Engineer',
            issue_date=date(2026, 5, 1),
            transaction_hash='0xabc123',
            block_number=42088,
        )

    def test_admin_username_login_ensure_admin_command_and_rbac(self):
        # Verify ensure_admin command provisions/updates via env without committing secrets
        prev = os.environ.get('ADMIN_PASSWORD')
        os.environ['ADMIN_PASSWORD'] = 'EnvSeededAdminPass99'
        try:
            call_command('ensure_admin')
        finally:
            if prev is None:
                os.environ.pop('ADMIN_PASSWORD', None)
            else:
                os.environ['ADMIN_PASSWORD'] = prev

        login_res = self.client.post(
            reverse('auth-login'),
            {'username': 'admin', 'password': 'EnvSeededAdminPass99'},
            format='json',
        )
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertEqual(login_res.data['user']['role'], 'superadmin')
        self.assertEqual(login_res.data['user']['username'], 'admin')

        # Confirm HR and Employee users cannot access Super Admin endpoints
        for non_admin in (self.hr_user, self.emp_user):
            self.client.force_authenticate(user=non_admin)
            self.assertEqual(
                self.client.get(reverse('admin-company-list')).status_code,
                status.HTTP_403_FORBIDDEN,
            )
            self.assertEqual(
                self.client.get(reverse('admin-user-list')).status_code,
                status.HTTP_403_FORBIDDEN,
            )

    def test_admin_profile_management_and_password_update(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('admin-profile')

        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['username'], 'admin')

        # Update name & password
        res_patch = self.client.patch(
            url,
            {
                'name': 'Chief Platform Auditor',
                'current_password': 'AdminSecurePassword123',
                'new_password': 'UpdatedAdminPassword456',
            },
            format='json',
        )
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.assertEqual(res_patch.data['name'], 'Chief Platform Auditor')

        self.admin_user.refresh_from_db()
        self.assertTrue(self.admin_user.check_password('UpdatedAdminPassword456'))

    def test_company_moderation_verification_doc_download_and_pagination(self):
        with tempfile.TemporaryDirectory() as tmp_media:
            with override_settings(MEDIA_ROOT=tmp_media):
                self.pending_company.certificate_of_incorporation = SimpleUploadedFile(
                    'apex_incorp.pdf',
                    b'%PDF-1.4\n%ApexIncorp\n%%EOF',
                    content_type='application/pdf',
                )
                self.pending_company.save()

                self.client.force_authenticate(user=self.admin_user)

                # Listing with search + pagination
                list_res = self.client.get(
                    reverse('admin-company-list'),
                    {'status': 'pending', 'search': 'Apex', 'page': 1, 'page_size': 10},
                )
                self.assertEqual(list_res.status_code, status.HTTP_200_OK)
                self.assertEqual(list_res.data['count'], 1)
                self.assertEqual(len(list_res.data['results']), 1)

                # Detail includes verification_documents
                detail_res = self.client.get(
                    reverse('admin-company-detail', kwargs={'company_id': self.pending_company.id})
                )
                self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
                self.assertEqual(len(detail_res.data['verification_documents']), 1)

                # Download verification file
                dl_res = self.client.get(
                    reverse(
                        'admin-company-doc-download',
                        kwargs={'company_id': self.pending_company.id, 'doc_key': 'incorporation'},
                    )
                )
                self.assertEqual(dl_res.status_code, status.HTTP_200_OK)
                self.assertIn(b'%ApexIncorp', b''.join(dl_res.streaming_content))

                # Reject without remarks fails
                reject_url = reverse('admin-company-reject', kwargs={'company_id': self.pending_company.id})
                self.assertEqual(
                    self.client.post(reject_url, {'remarks': ''}, format='json').status_code,
                    status.HTTP_400_BAD_REQUEST,
                )

                # Approve -> Suspend -> Reactivate lifecycle
                approve_url = reverse('admin-company-approve', kwargs={'company_id': self.pending_company.id})
                suspend_url = reverse('admin-company-suspend', kwargs={'company_id': self.pending_company.id})
                reactivate_url = reverse('admin-company-reactivate', kwargs={'company_id': self.pending_company.id})

                r_app = self.client.post(approve_url, {'remarks': 'CIN verified'}, format='json')
                self.assertEqual(r_app.status_code, status.HTTP_200_OK)
                self.assertEqual(r_app.data['status'], 'approved')

                r_sus = self.client.post(suspend_url, {'remarks': 'Compliance audit'}, format='json')
                self.assertEqual(r_sus.status_code, status.HTTP_200_OK)
                self.assertEqual(r_sus.data['status'], 'suspended')

                r_re = self.client.post(reactivate_url, {}, format='json')
                self.assertEqual(r_re.status_code, status.HTTP_200_OK)
                self.assertEqual(r_re.data['status'], 'approved')

    def test_user_management_activation_deactivation_and_self_guard(self):
        self.client.force_authenticate(user=self.admin_user)

        res_list = self.client.get(reverse('admin-user-list'), {'role': 'hr'})
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(res_list.data['count'], 1)
        self.assertEqual(res_list.data['results'][0]['company_name'], 'Apex Cloud Labs')

        # Deactivate & reactivate HR user
        status_url = reverse('admin-user-status', kwargs={'user_id': self.hr_user.id})
        r_deact = self.client.post(status_url, {'status': 'suspended'}, format='json')
        self.assertEqual(r_deact.status_code, status.HTTP_200_OK)
        self.assertEqual(r_deact.data['status'], 'suspended')
        self.hr_user.refresh_from_db()
        self.assertFalse(self.hr_user.is_active)

        r_act = self.client.post(status_url, {'status': 'active'}, format='json')
        self.assertEqual(r_act.status_code, status.HTTP_200_OK)
        self.assertEqual(r_act.data['status'], 'active')

        # Cannot deactivate self
        self_status_url = reverse('admin-user-status', kwargs={'user_id': self.admin_user.id})
        self.assertEqual(
            self.client.post(self_status_url, {'status': 'suspended'}, format='json').status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_document_oversight_verify_revoke_stats_and_activity_logs(self):
        self.client.force_authenticate(user=self.admin_user)

        # List all documents
        docs_res = self.client.get(reverse('admin-document-list'), {'search': 'VC-2026-8801'})
        self.assertEqual(docs_res.status_code, status.HTTP_200_OK)
        self.assertEqual(docs_res.data['count'], 1)

        # Verify cryptographic integrity
        verify_res = self.client.post(
            reverse('admin-document-verify', kwargs={'identifier': 'VC-2026-8801'})
        )
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.assertTrue(verify_res.data['is_authentic'])
        self.assertTrue(verify_res.data['hash_matches'])

        # Admin revoke document
        revoke_res = self.client.post(
            reverse('admin-document-revoke', kwargs={'identifier': 'VC-2026-8801'}),
            {'reason': 'Fraudulent submission flagged during audit'},
            format='json',
        )
        self.assertEqual(revoke_res.status_code, status.HTTP_200_OK)
        self.assertEqual(revoke_res.data['status'], 'revoked')

        # Re-verify shows revoked / not authentic
        verify_after = self.client.post(
            reverse('admin-document-verify', kwargs={'identifier': 'VC-2026-8801'})
        )
        self.assertFalse(verify_after.data['is_authentic'])

        # Real DB platform stats
        stats_res = self.client.get(reverse('admin-company-stats'))
        self.assertEqual(stats_res.status_code, status.HTTP_200_OK)
        self.assertEqual(stats_res.data['total_companies'], 1)
        self.assertEqual(stats_res.data['pending_companies'], 1)
        self.assertEqual(stats_res.data['total_hr_users'], 1)
        self.assertEqual(stats_res.data['total_employees'], 1)
        self.assertEqual(stats_res.data['total_documents'], 1)
        self.assertEqual(stats_res.data['revoked_documents'], 1)

        # Activity logs filtered by action
        logs_res = self.client.get(reverse('admin-activity-logs'), {'action': 'Document Revoked'})
        self.assertEqual(logs_res.status_code, status.HTTP_200_OK)
        self.assertEqual(logs_res.data['count'], 1)
        self.assertEqual(logs_res.data['results'][0]['performed_by'], 'admin@trustdoc.local')

