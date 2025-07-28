# devices/serializers.py
from datetime import date, datetime
from django.utils import timezone
from rest_framework import serializers
from .models import Alarm, Device,Manufacturer, Reading

class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields='__all__'


class ReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reading
        fields = '__all__'
    def create(self, validated_data):
        # Automatically set the timestamp to the current time
        started_date=validated_data.get('started_at')
        if started_date:
            if isinstance(started_date, date) and not isinstance(started_date, datetime):
                now = timezone.now()
                started_date = datetime.combine(started_date,now.time())
                validated_data['started_at'] = timezone.make_aware(started_date, timezone.get_current_timezone())
        return super().create(validated_data)

 

class AlarmSerializer(serializers.ModelSerializer):
    user_message = serializers.SerializerMethodField()
    device_code = serializers.SerializerMethodField()
    class Meta:
        model = Alarm
        fields = ['id', 'device', 'device_code','alarm_type', 'triggered_value', 'timestamp', 'acknowledged', 'active', 'user_message']

    def get_user_message(self, obj):
        return obj.user_message()
    def get_device_code(self, obj):
        return obj.device.code
class ManufacturerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Manufacturer
        fields = '__all__'

