from django.urls import path
from .views import EmployeeRegisterView, EmployeeProfileMeView

urlpatterns = [
    path('register/', EmployeeRegisterView.as_view(), name='employee-register'),
    path('me/', EmployeeProfileMeView.as_view(), name='employee-profile-me'),
]
