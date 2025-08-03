from rest_framework import serializers
from .models import AuditLog

from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    user_id = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ['id', 'user_id', 'username', 'action', 'model_name', 'object_id', 'changes', 'timestamp']

    def get_user_id(self, obj):
        return obj.user.id if obj.user else None

    def get_username(self, obj):
        return obj.user.username if obj.user else None
