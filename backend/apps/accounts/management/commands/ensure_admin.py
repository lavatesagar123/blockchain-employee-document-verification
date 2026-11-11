"""Management command to seed or verify the platform Super Admin account from environment variables."""

import os
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

User = get_user_model()


class Command(BaseCommand):
    help = 'Create or update the platform Super Admin account from ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD env vars.'

    def handle(self, *args, **options):
        username = (os.environ.get('ADMIN_USERNAME') or 'admin').strip()
        email = (os.environ.get('ADMIN_EMAIL') or 'admin@trustdoc.local').strip().lower()
        password = os.environ.get('ADMIN_PASSWORD')

        if not password:
            raise CommandError(
                'ADMIN_PASSWORD environment variable is required to provision the admin account safely.'
            )

        user = User.objects.filter(username__iexact=username).first() or User.objects.filter(email__iexact=email).first()
        if user:
            user.username = username
            user.email = email
            user.role = User.ROLE_SUPERADMIN
            user.status = User.STATUS_ACTIVE
            user.is_active = True
            user.is_staff = True
            user.is_superuser = True
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Updated Super Admin '{username}' ({email})."))
        else:
            User.objects.create_superuser(
                email=email,
                username=username,
                name='Platform Administrator',
                password=password,
            )
            self.stdout.write(self.style.SUCCESS(f"Created Super Admin '{username}' ({email})."))

