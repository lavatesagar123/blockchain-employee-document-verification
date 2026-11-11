"""Tests for HR Panel Backend: Auth, Profiles, Workforce Directory, Issuance, Multi-page QR PDFs, Revocation & Stats."""

import tempfile
from datetime import date
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.documents.models import DocumentAuditLog, IssuedDocument
from apps.employees.models import Company, EmployeeProfile
from .models import HRProfile

User = get_user_model()


class HRBackendTests(APITestCase):
    def setUp(self):
        self.company = Company.objects.create(
            name='TrustDoc Enterprise',
            registration_number='CIN-U72200MH2026PTC000001',
            email='contact@trustdoc-ent.com',
            phone='+91 9876543210',
            website='https://trustdoc-ent.com',
            address='Baner Road, Pune, Maharashtra - 411045',
            city='Pune',
            status=Company.STATUS_APPROVED,
        )
        self.hr_user = User.objects.create_user(
            email='rohan.hr@trustdoc-ent.com',
            password='HrSecurePassword123',
            name='Rohan Deshmukh',
            role=User.ROLE_HR,
        )
        self.hr_profile = HRProfile.objects.create(
            user=self.hr_user,
            company=self.company,
            designation='Head of HR',
            phone='+91 9876543211',
        )

        # Second isolated company to verify cross-tenant isolation
        self.other_company = Company.objects.create(
            name='Other Corp',
            registration_number='CIN-OTHER-9999',
            email='hr@othercorp.com',
            status=Company.STATUS_APPROVED,
        )
        self.other_hr = User.objects.create_user(
            email='hr@othercorp.com',
            password='Password123',
            name='Other HR',
            role=User.ROLE_HR,
        )
        HRProfile.objects.create(user=self.other_hr, company=self.other_company)

        self.company_me_url = reverse('company-profile-me')
        self.hr_profile_url = reverse('hr-profile-me')
        self.hr_stats_url = reverse('hr-dashboard-stats')
        self.hr_employees_url = reverse('hr-employee-list-create')
        self.hr_docs_url = reverse('hr-document-list-create')

    def test_company_registration_multipart_and_pending_lockdown(self):
        with tempfile.TemporaryDirectory() as tmp_media:
            with override_settings(MEDIA_ROOT=tmp_media):
                cert_file = SimpleUploadedFile(
                    'incorp.pdf',
                    b'%PDF-1.4\n%Incorporation\n%%EOF',
                    content_type='application/pdf',
                )
                tax_file = SimpleUploadedFile(
                    'tax.pdf',
                    b'%PDF-1.4\n%TaxID\n%%EOF',
                    content_type='application/pdf',
                )
                reg_url = reverse('company-register')
                res = self.client.post(
                    reg_url,
                    {
                        'name': 'NovaTech Systems',
                        'registration_number': 'CIN-NOVA-2026',
                        'email': 'contact@novatech.io',
                        'phone': '+91 9822001122',
                        'street_address': 'Plot 12, Hinjewadi',
                        'city': 'Pune',
                        'state': 'Maharashtra',
                        'postal_code': '411057',
                        'country': 'India',
                        'hr_name': 'Meera Joshi',
                        'hr_email': 'meera@novatech.io',
                        'hr_designation': 'HR Director',
                        'password': 'NovaPassword123',
                        'certificate_of_incorporation': cert_file,
                        'tax_id_document': tax_file,
                    },
                    format='multipart',
                )
                self.assertEqual(res.status_code, status.HTTP_201_CREATED)
                self.assertEqual(res.data['status'], 'pending')
                self.assertTrue(res.data['documents_uploaded']['incorporation'])
                self.assertTrue(res.data['documents_uploaded']['tax_id'])

                # Login as pending HR user and confirm pending status in JWT payload
                login_res = self.client.post(
                    reverse('auth-login'),
                    {'email': 'meera@novatech.io', 'password': 'NovaPassword123'},
                    format='json',
                )
                self.assertEqual(login_res.status_code, status.HTTP_200_OK)
                self.assertEqual(login_res.data['user']['companyStatus'], 'pending')

                # Pending HR can view company profile & stats, but is blocked (403) from operational HR endpoints
                self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login_res.data["access"]}')
                self.assertEqual(self.client.get(self.company_me_url).status_code, status.HTTP_200_OK)
                self.assertEqual(self.client.get(self.hr_stats_url).status_code, status.HTTP_200_OK)
                self.assertEqual(self.client.get(self.hr_employees_url).status_code, status.HTTP_403_FORBIDDEN)
                self.assertEqual(self.client.get(self.hr_docs_url).status_code, status.HTTP_403_FORBIDDEN)

    def test_hr_and_company_profile_view_and_update(self):
        self.client.force_authenticate(user=self.hr_user)

        res_comp = self.client.patch(
            self.company_me_url,
            {'phone': '+91 9000011111', 'website': 'https://trustdoc.io', 'city': 'Mumbai'},
            format='json',
        )
        self.assertEqual(res_comp.status_code, status.HTTP_200_OK)
        self.assertEqual(res_comp.data['phone'], '+91 9000011111')
        self.assertEqual(res_comp.data['city'], 'Mumbai')

        res_hr = self.client.patch(
            self.hr_profile_url,
            {'name': 'Rohan D.', 'designation': 'VP People Operations'},
            format='json',
        )
        self.assertEqual(res_hr.status_code, status.HTTP_200_OK)
        self.assertEqual(res_hr.data['name'], 'Rohan D.')
        self.assertEqual(res_hr.data['designation'], 'VP People Operations')

    def test_hr_employee_onboarding_search_filter_update_and_deactivate(self):
        self.client.force_authenticate(user=self.hr_user)

        # Onboard 2 employees
        r1 = self.client.post(
            self.hr_employees_url,
            {
                'name': 'Sagar Lavate',
                'email': 'sagar@trustdoc-ent.com',
                'employee_id': 'EMP-3001',
                'designation': 'Full Stack Developer',
                'department': 'Engineering',
                'phone': '+91 98765 11111',
                'joining_date': '2026-05-01',
            },
            format='json',
        )
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)

        r2 = self.client.post(
            self.hr_employees_url,
            {
                'name': 'Ananya Kulkarni',
                'email': 'ananya@trustdoc-ent.com',
                'employee_id': 'EMP-3002',
                'designation': 'Product Designer',
                'department': 'Design',
            },
            format='json',
        )
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED)

        # Directory search & department filter
        res_all = self.client.get(self.hr_employees_url)
        self.assertEqual(len(res_all.data), 2)

        res_search = self.client.get(self.hr_employees_url, {'search': 'EMP-3001'})
        self.assertEqual(len(res_search.data), 1)
        self.assertEqual(res_search.data[0]['name'], 'Sagar Lavate')

        res_dept = self.client.get(self.hr_employees_url, {'department': 'Design'})
        self.assertEqual(len(res_dept.data), 1)
        self.assertEqual(res_dept.data[0]['employee_id'], 'EMP-3002')

        # Update & deactivate employee
        detail_url = reverse('hr-employee-detail', kwargs={'identifier': 'EMP-3001'})
        res_patch = self.client.patch(detail_url, {'designation': 'Senior Engineer'}, format='json')
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.assertEqual(res_patch.data['designation'], 'Senior Engineer')

        res_del = self.client.delete(detail_url)
        self.assertEqual(res_del.status_code, status.HTTP_204_NO_CONTENT)
        emp = EmployeeProfile.objects.get(employee_id='EMP-3001')
        self.assertEqual(emp.user.status, User.STATUS_SUSPENDED)

    def test_issue_all_document_types_multipage_qr_pdf_revoke_isolation_and_stats(self):
        self.client.force_authenticate(user=self.hr_user)

        # Long multi-paragraph description to trigger multi-page PDF pagination
        long_description = '\n\n'.join(
            [f'Paragraph {i}: Comprehensive employment clause detailing compensation, benefits, confidentiality, intellectual property assignment, compliance standards, and verification terms.' for i in range(1, 28)]
        )

        # 1. Issue Offer Letter with long multi-page description
        offer_res = self.client.post(
            self.hr_docs_url,
            {
                'document_type': 'offer_letter',
                'recipient_name': 'Sagar Lavate',
                'recipient_email': 'sagar@trustdoc-ent.com',
                'employee_id': 'EMP-3001',
                'designation': 'Full Stack Developer',
                'department': 'Engineering',
                'start_date': '2026-05-01',
                'compensation': '₹ 8,00,000',
                'custom_description': long_description,
            },
            format='json',
        )
        self.assertEqual(offer_res.status_code, status.HTTP_201_CREATED)
        offer_vid = offer_res.data['verification_id']
        self.assertTrue(offer_vid.startswith('VC-'))
        self.assertIn('/verify?id=', offer_res.data['verification_url'])
        self.assertEqual(len(offer_res.data['file_hash']), 64)
        self.assertTrue(offer_res.data['transaction_hash'].startswith('0x'))

        # Verify dynamic multi-page PDF generation & download
        dl_url = reverse('document-download', kwargs={'identifier': offer_vid})
        dl_res = self.client.get(dl_url)
        self.assertEqual(dl_res.status_code, status.HTTP_200_OK)
        pdf_bytes = b''.join(dl_res.streaming_content)
        self.assertTrue(pdf_bytes.startswith(b'%PDF-'))
        # Confirm multiple PDF pages were generated
        self.assertGreaterEqual(pdf_bytes.count(b'/Type /Page\n'), 2)

        # 2. Issue LOI, Experience Letter, Relieving Letter (confirm end_date validation)
        bad_exp = self.client.post(
            self.hr_docs_url,
            {
                'document_type': 'experience_letter',
                'recipient_name': 'A',
                'recipient_email': 'a@trustdoc-ent.com',
                'designation': 'Dev',
                'start_date': '2024-01-01',
            },
            format='json',
        )
        self.assertEqual(bad_exp.status_code, status.HTTP_400_BAD_REQUEST)

        for dtype in ('letter_of_intent', 'experience_letter', 'relieving_letter'):
            r = self.client.post(
                self.hr_docs_url,
                {
                    'document_type': dtype,
                    'recipient_name': 'Ananya Kulkarni',
                    'recipient_email': 'ananya@trustdoc-ent.com',
                    'designation': 'Designer',
                    'start_date': '2024-01-01',
                    'end_date': '2026-03-31',
                },
                format='json',
            )
            self.assertEqual(r.status_code, status.HTTP_201_CREATED)

        # 3. Listing & filtering
        list_res = self.client.get(self.hr_docs_url, {'type': 'offer_letter'})
        self.assertEqual(len(list_res.data), 1)

        # 4. Revocation & audit log
        revoke_url = reverse('document-revoke', kwargs={'identifier': offer_vid})
        revoke_res = self.client.post(revoke_url, {'reason': 'Offer revised with updated CTC'}, format='json')
        self.assertEqual(revoke_res.status_code, status.HTTP_200_OK)
        self.assertEqual(revoke_res.data['status'], 'revoked')
        self.assertTrue(
            DocumentAuditLog.objects.filter(
                document__verification_id=offer_vid,
                action=DocumentAuditLog.ACTION_REVOKED,
            ).exists()
        )

        # 5. Cross-company isolation: other company HR cannot view, download, or revoke
        self.client.force_authenticate(user=self.other_hr)
        self.assertEqual(
            self.client.get(reverse('document-detail', kwargs={'identifier': offer_vid})).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(self.client.get(dl_url).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            self.client.post(revoke_url, {'reason': 'Unauthorized'}, format='json').status_code,
            status.HTTP_403_FORBIDDEN,
        )

        # 6. Dashboard stats reflect actual database records
        self.client.force_authenticate(user=self.hr_user)
        stats_res = self.client.get(self.hr_stats_url)
        self.assertEqual(stats_res.status_code, status.HTTP_200_OK)
        self.assertEqual(stats_res.data['total_documents'], 4)
        self.assertEqual(stats_res.data['verified_documents'], 3)
        self.assertEqual(stats_res.data['revoked_documents'], 1)
        self.assertEqual(stats_res.data['documents_by_type']['offer_letter'], 1)

