"""Shared pagination classes and response helpers."""

from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


def paginated_response(request, queryset, serializer_cls, paginator_cls=StandardPagination):
    """Return a consistently paginated response using StandardPagination."""
    paginator = paginator_cls()
    page = paginator.paginate_queryset(queryset, request)
    if page is not None:
        return paginator.get_paginated_response(serializer_cls(page, many=True).data)
    return Response(serializer_cls(queryset, many=True).data, status=status.HTTP_200_OK)

