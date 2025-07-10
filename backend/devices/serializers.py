# devices/serializers.py
from rest_framework import serializers
from .models import Device, Reading

class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields='__all__'


class ReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reading
        fields = '__all__'
