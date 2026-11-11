from django.contrib import admin
from .models import Company, EmployeeProfile


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'registration_number', 'email', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('name', 'registration_number', 'email')


@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'employee_id', 'user', 'designation', 'department', 'company_name', 'created_at')
    search_fields = ('employee_id', 'user__email', 'user__name', 'designation', 'company_name')
    list_filter = ('employment_type', 'department')
