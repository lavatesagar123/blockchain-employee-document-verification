"""Tests for Public Document Verification (by ID and uploaded PDF SHA-256 checksum)."""

import tempfile
from datetime import date

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.documents.models import IssuedDocument
from apps.documents.services import DocumentService
from apps.employees.models import Company, EmployeeProfile

User = get_user_model()


class VerificationApiTests(APITestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_dir.cleanup)
        self.media_override = override_settings(MEDIA_ROOT=self.temp_dir.name)
        self.media_override.enable()
        self.addCleanup(self.media_override.disable)

        self.company = Company.objects.create(
            name='VeriCorp Systems',
            registration_number='CIN-VERI-001',
            email='info@vericorp.io',
            status=Company.STATUS_APPROVED,
        )
        self.emp_user = User.objects.create_user(
            email='emp@vericorp.io',
            password='EmpPassword123',
            name='Aarav Mehta',
            role=User.ROLE_EMPLOYEE,
        )
        self.emp_profile = EmployeeProfile.objects.create(
            user=self.emp_user,
            company=self.company,
            employee_id='VC-EMP-101',
            designation='Software Engineer',
        )
        self.document = IssuedDocument.objects.create(
            verification_id='TD-VERI-2026-001',
            reference_number='REF-VERI-001',
            document_type=IssuedDocument.TYPE_OFFER,
            company=self.company,
            issuer_name=self.company.name,
            employee_profile=self.emp_profile,
            employee_id=self.emp_profile.employee_id,
            recipient_name=self.emp_user.name,
            recipient_email=self.emp_user.email,
            designation='Software Engineer',
            status=IssuedDocument.STATUS_VERIFIED,
            issue_date=date(2026, 2, 1),
        )
        self.pdf_bytes = DocumentService.generate_certificate_pdf_bytes(self.document)

    def test_public_verify_by_id_returns_authentic_record(self):
        url = reverse('public-verify-id', kwargs={'verification_id': self.document.verification_id})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data['is_authentic'])
        self.assertTrue(resp.data['hash_matches'])
        self.assertEqual(resp.data['verification_id'], self.document.verification_id)

    def test_public_verify_with_matching_and_tampered_pdf(self):
        url = reverse('public-verify-file')

        matching_file = SimpleUploadedFile(
            'offer.pdf',
            self.pdf_bytes,
            content_type='application/pdf',
        )
        resp_match = self.client.post(
            url,
            {'verification_id': self.document.verification_id, 'document_file': matching_file},
            format='multipart',
        )
        self.assertEqual(resp_match.status_code, status.HTTP_200_OK)
        self.assertTrue(resp_match.data['is_authentic'])
        self.assertTrue(resp_match.data['hash_matches'])

        tampered_file = SimpleUploadedFile(
            'tampered.pdf',
            b'%PDF-1.4 tampered content',
            content_type='application/pdf',
        )
        resp_tamper = self.client.post(
            url,
            {'verification_id': self.document.verification_id, 'document_file': tampered_file},
            format='multipart',
        )
        self.assertEqual(resp_tamper.status_code, status.HTTP_200_OK)
        self.assertFalse(resp_tamper.data['hash_matches'])
        self.assertFalse(resp_tamper.data['is_authentic'])

    def test_revoked_document_is_not_authentic(self):
        self.document.status = IssuedDocument.STATUS_REVOKED
        self.document.revocation_reason = 'Superseded'
        self.document.save(update_fields=['status', 'revocation_reason'])

        url = reverse('public-verify-id', kwargs={'verification_id': self.document.verification_id})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['status'], IssuedDocument.STATUS_REVOKED)
        self.assertFalse(resp.data['is_authentic'])

