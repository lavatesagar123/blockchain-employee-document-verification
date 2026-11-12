from rest_framework import serializers
from apps.superadmin.models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    """Shared serializer for activity and audit history."""

    timestamp = serializers.DateTimeField(source='created_at', read_only=True)
    actor_email = serializers.CharField(source='actor.email', read_only=True, default='')
    actor_role = serializers.CharField(source='actor.role', read_only=True, default='')

    class Meta:
        model = ActivityLog
        fields = [
            'id',
            'timestamp',
            'created_at',
            'action',
            'description',
            'performed_by',
            'actor_email',
            'actor_role',
            'target_type',
            'target_id',
            'ip_address',
            'metadata',
        ]
        read_only_fields = fields

