from django.urls import path
from .views import AdminDashboardView, EmployeeDashboardView, HRDashboardView

urlpatterns = [
    path('admin/', AdminDashboardView.as_view(), name='dashboard-admin'),
    path('hr/', HRDashboardView.as_view(), name='dashboard-hr'),
    path('employee/', EmployeeDashboardView.as_view(), name='dashboard-employee'),
]

