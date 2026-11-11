from django.urls import path
from .views import (
    CompanyProfileMeView,
    CompanyRegisterView,
    CompanyStatusView,
)

urlpatterns = [
    path('register/', CompanyRegisterView.as_view(), name='company-register'),
    path('status/', CompanyStatusView.as_view(), name='company-status'),
    path('me/', CompanyProfileMeView.as_view(), name='company-profile-me'),
]

