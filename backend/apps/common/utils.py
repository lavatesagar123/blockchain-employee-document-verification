"""Shared validation, hashing, request metadata, and secure media streaming utilities."""

import hashlib
import io
import mimetypes
import os
import re
from pathlib import Path

from django.conf import settings
from django.http import FileResponse
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied


def validate_phone_number(value: str, required: bool = False) -> str:
    """Validate phone number contains between 7 and 15 numeric digits."""
    cleaned = (value or '').strip()
    if not cleaned:
        if required:
            raise serializers.ValidationError('Phone number is required.')
        return ''
    digits = re.sub(r'[^0-9]', '', cleaned)
    if len(digits) < 7 or len(digits) > 15:
        raise serializers.ValidationError('Enter a valid phone number (7 to 15 digits).')
    return cleaned


def validate_uploaded_file(file_obj, allowed_ext=('.pdf', '.png', '.jpg', '.jpeg'), max_mb: int = 5):
    """Validate uploaded file extension and size."""
    if file_obj is None:
        return None
    if file_obj.size > max_mb * 1024 * 1024:
        raise serializers.ValidationError(f'File size must not exceed {max_mb} MB.')
    if not file_obj.name.lower().endswith(allowed_ext):
        raise serializers.ValidationError(
            f'Unsupported file type. Allowed extensions: {", ".join(allowed_ext)}'
        )
    return file_obj


def extract_client_ip(request) -> str | None:
    """Extract client IP safely from request META."""
    if request is None:
        return None
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
    return forwarded.split(',')[0].strip() if forwarded else request.META.get('REMOTE_ADDR')


def extract_user_agent(request, max_len: int = 500) -> str:
    if request is None:
        return ''
    return (request.META.get('HTTP_USER_AGENT') or '')[:max_len]


def compute_sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def compute_sha256_file(file_obj) -> str:
    file_obj.seek(0)
    digest = hashlib.sha256()
    for chunk in iter(lambda: file_obj.read(65536), b''):
        digest.update(chunk)
    file_obj.seek(0)
    return digest.hexdigest()


def build_safe_media_stream(file_field, download_name: str | None = None) -> tuple[io.BytesIO, str, str] | None:
    """Safely read a stored FileField inside MEDIA_ROOT, preventing path traversal."""
    if not file_field:
        return None
    media_root = Path(os.path.realpath(settings.MEDIA_ROOT))
    target_path = Path(os.path.realpath(file_field.path))
    if media_root not in target_path.parents:
        raise PermissionDenied('Access to requested file path is denied.')
    if not target_path.is_file():
        return None

    with open(target_path, 'rb') as fh:
        content = fh.read()
    guessed_type, _ = mimetypes.guess_type(str(target_path))
    content_type = guessed_type or 'application/octet-stream'
    filename = download_name or target_path.name
    if download_name and target_path.suffix and not filename.lower().endswith(target_path.suffix.lower()):
        filename = f'{Path(download_name).stem}{target_path.suffix}'
    return io.BytesIO(content), content_type, filename


def build_secure_download_response(stream: io.BytesIO, content_type: str, filename: str) -> FileResponse:
    """Wrap binary stream in a FileResponse with strict download security headers."""
    response = FileResponse(
        stream,
        as_attachment=True,
        filename=filename,
        content_type=content_type,
    )
    response['X-Content-Type-Options'] = 'nosniff'
    response['Cache-Control'] = 'private, no-store'
    return response

