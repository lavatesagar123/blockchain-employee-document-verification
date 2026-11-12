"""Centralized DRF exception handling for consistent API error responses."""

import logging
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """Normalize Django ValidationError and attach consistent detail/status structure."""
    if isinstance(exc, DjangoValidationError):
        detail = exc.message_dict if hasattr(exc, 'message_dict') else exc.messages
        exc = DRFValidationError(detail=detail)

    response = exception_handler(exc, context)
    if response is None:
        logger.exception('Unhandled exception in API view %s', context.get('view'))
        return Response(
            {'detail': 'An unexpected internal server error occurred.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    return response

