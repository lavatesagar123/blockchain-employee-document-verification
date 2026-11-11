"""Tests for Employee Document Portfolio, Inspection, and Secure PDF Download APIs."""

import tempfile
from datetime import date
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.employees.models import Company, EmployeeProfile
from .models import DocumentAuditLog, IssuedDocument

User = get_user_model()


class EmployeeDocumentTests(APITestCase):
    def setUp(self):
        self.company = Company.objects.create(
            name='TrustDoc Technologies',
            registration_number='CIN-U72200MH2021PTC123456',
            email='hr@trustdoc.com',
            website='https://trustdoc.com',
            address='Pune, Maharashtra - 411001',
            city='Pune',
            status=Company.STATUS_APPROVED,
        )

        self.emp1 = User.objects.create_user(
            email='sagar.lavate@email.com',
            password='Password123',
            name='Sagar Lavate',
            role=User.ROLE_EMPLOYEE,
        )
        self.profile1 = EmployeeProfile.objects.create(
            user=self.emp1,
            company=self.company,
            company_name=self.company.name,
            employee_id='EMP-1092',
            designation='Full Stack Developer',
        )

        self.emp2 = User.objects.create_user(
            email='other.employee@email.com',
            password='Password123',
            name='Other Employee',
            role=User.ROLE_EMPLOYEE,
        )
        self.profile2 = EmployeeProfile.objects.create(
            user=self.emp2,
            company=self.company,
            company_name=self.company.name,
            employee_id='EMP-2002',
            designation='QA Engineer',
        )

        self.doc1 = IssuedDocument.objects.create(
            verification_id='VC-2026-0001',
            reference_number='TD/HR/2026/001',
            document_type=IssuedDocument.TYPE_OFFER,
            company=self.company,
            issuer_name=self.company.name,
            employee_profile=self.profile1,
            employee_id='EMP-1092',
            recipient_name='Sagar Lavate',
            recipient_email='sagar.lavate@email.com',
            designation='Full Stack Developer',
            department='Engineering',
            start_date=date(2026, 5, 1),
            compensation='₹ 6,00,000',
            location='Pune, Maharashtra',
            reporting_manager='Rohan Deshmukh',
            transaction_hash='0x8f3a2e4d6c7b9e1f5a0c3b8e2d4f6a7b9c1d3e5f7a0b2c4d6e8f1a3b5c7d9e2a',
            block_number=42015,
            issue_date=date(2026, 4, 15),
        )

        self.doc2 = IssuedDocument.objects.create(
            verification_id='VC-2026-0002',
            reference_number='TD/EXP/2026/002',
            document_type=IssuedDocument.TYPE_EXPERIENCE,
            company=self.company,
            issuer_name=self.company.name,
            employee_profile=self.profile1,
            employee_id='EMP-1092',
            recipient_name='Sagar Lavate',
            recipient_email='sagar.lavate@email.com',
            designation='Full Stack Developer',
            department='Engineering',
            issue_date=date(2026, 4, 20),
        )

        self.other_doc = IssuedDocument.objects.create(
            verification_id='VC-2026-9999',
            reference_number='TD/HR/2026/999',
            document_type=IssuedDocument.TYPE_OFFER,
            company=self.company,
            issuer_name=self.company.name,
            employee_profile=self.profile2,
            employee_id='EMP-2002',
            recipient_name='Other Employee',
            recipient_email='other.employee@email.com',
            designation='QA Engineer',
            issue_date=date(2026, 4, 21),
        )

        self.list_url = reverse('employee-document-list')

    def test_list_returns_only_authenticated_employee_documents_and_filters(self):
        self.client.force_authenticate(user=self.emp1)

        res = self.client.get(self.list_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        ids = {item['verification_id'] for item in res.data}
        self.assertEqual(ids, {'VC-2026-0001', 'VC-2026-0002'})
        self.assertNotIn('VC-2026-9999', ids)

        res_filtered = self.client.get(self.list_url, {'type': 'experience_letter'})
        self.assertEqual(len(res_filtered.data), 1)
        self.assertEqual(res_filtered.data[0]['verification_id'], 'VC-2026-0002')

        res_search = self.client.get(self.list_url, {'search': 'TD/HR/2026/001'})
        self.assertEqual(len(res_search.data), 1)
        self.assertEqual(res_search.data[0]['verification_id'], 'VC-2026-0001')

    def test_document_detail_enforces_ownership_and_logs_view(self):
        self.client.force_authenticate(user=self.emp1)

        own_url = reverse('employee-document-detail', kwargs={'identifier': 'VC-2026-0001'})
        res = self.client.get(own_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['verification_id'], 'VC-2026-0001')
        self.assertEqual(res.data['company_email'], 'hr@trustdoc.com')
        self.assertTrue(
            DocumentAuditLog.objects.filter(
                document=self.doc1,
                user=self.emp1,
                action=DocumentAuditLog.ACTION_VIEWED,
            ).exists()
        )

        # Shared /api/documents/<id>/ endpoint works too
        shared_url = reverse('document-detail', kwargs={'identifier': 'VC-2026-0001'})
        self.assertEqual(self.client.get(shared_url).status_code, status.HTTP_200_OK)

        # Cannot inspect another employee's document
        other_url = reverse('employee-document-detail', kwargs={'identifier': 'VC-2026-9999'})
        res_forbidden = self.client.get(other_url)
        self.assertEqual(res_forbidden.status_code, status.HTTP_403_FORBIDDEN)

        # Missing ID returns 404
        missing_url = reverse('employee-document-detail', kwargs={'identifier': 'VC-DOES-NOT-EXIST'})
        self.assertEqual(self.client.get(missing_url).status_code, status.HTTP_404_NOT_FOUND)

    def test_secure_download_generates_pdf_streams_with_headers_and_audit_logs(self):
        dl_url = reverse('employee-document-download', kwargs={'identifier': 'VC-2026-0001'})

        # Unauthenticated blocked
        self.assertEqual(self.client.get(dl_url).status_code, status.HTTP_401_UNAUTHORIZED)

        # Wrong employee blocked
        self.client.force_authenticate(user=self.emp2)
        self.assertEqual(self.client.get(dl_url).status_code, status.HTTP_403_FORBIDDEN)

        # Owning employee succeeds and receives valid PDF bytes
        self.client.force_authenticate(user=self.emp1)
        res = self.client.get(dl_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res['Content-Type'], 'application/pdf')
        self.assertIn('attachment;', res['Content-Disposition'])
        self.assertEqual(res['X-Content-Type-Options'], 'nosniff')

        content = b''.join(res.streaming_content)
        self.assertTrue(content.startswith(b'%PDF-'))

        self.doc1.refresh_from_db()
        self.assertEqual(len(self.doc1.file_hash), 64)
        self.assertTrue(
            DocumentAuditLog.objects.filter(
                document=self.doc1,
                user=self.emp1,
                action=DocumentAuditLog.ACTION_DOWNLOADED,
            ).exists()
        )

    def test_secure_download_serves_stored_file_from_media_root(self):
        with tempfile.TemporaryDirectory() as tmp_media:
            with override_settings(MEDIA_ROOT=tmp_media):
                sample_pdf = SimpleUploadedFile(
                    'offer.pdf',
                    b'%PDF-1.4\n%TrustDocStoredPDF\n%%EOF',
                    content_type='application/pdf',
                )
                self.doc1.file = sample_pdf
                self.doc1.save()

                self.client.force_authenticate(user=self.emp1)
                dl_url = reverse('document-download', kwargs={'identifier': 'VC-2026-0001'})
                res = self.client.get(dl_url)
                self.assertEqual(res.status_code, status.HTTP_200_OK)
                content = b''.join(res.streaming_content)
                self.assertIn(b'%TrustDocStoredPDF', content)
