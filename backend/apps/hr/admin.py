from django.contrib import admin
from .models import HRProfile


@admin.register(HRProfile)
class HRProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'company', 'designation', 'is_primary', 'created_at')
    list_filter = ('is_primary', 'company')
    search_fields = ('user__name', 'user__email', 'company__name', 'designation')

