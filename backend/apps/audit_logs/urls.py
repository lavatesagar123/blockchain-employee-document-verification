from django.urls import path
from .views import AdminActivityLogListView

urlpatterns = [
    path('', AdminActivityLogListView.as_view(), name='audit-log-list'),
]

