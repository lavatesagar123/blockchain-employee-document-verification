from django.urls import path
from .views import (
    HRDashboardStatsView,
    HREmployeeDetailView,
    HREmployeeListCreateView,
    HRProfileMeView,
)

urlpatterns = [
    path('profile/', HRProfileMeView.as_view(), name='hr-profile-me'),
    path('dashboard/stats/', HRDashboardStatsView.as_view(), name='hr-dashboard-stats'),
    path('employees/', HREmployeeListCreateView.as_view(), name='hr-employee-list-create'),
    path('employees/<str:identifier>/', HREmployeeDetailView.as_view(), name='hr-employee-detail'),
]

