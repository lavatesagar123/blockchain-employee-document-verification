from django.urls import path
from .views import PublicVerifyByIdView, PublicVerifyWithFileView

urlpatterns = [
    path('verify/', PublicVerifyWithFileView.as_view(), name='public-verify-file'),
    path('<str:verification_id>/', PublicVerifyByIdView.as_view(), name='public-verify-id'),
]

