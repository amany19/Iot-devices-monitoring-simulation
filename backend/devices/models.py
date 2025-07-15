import uuid
from django.db import models

# Create your models here.

class Device (models.Model):

    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True, default="UNKNOWN")
    location = models.CharField(max_length=100, default="UNKNOWN")
    status = models.CharField(max_length=10, choices=[('on', 'On'), ('off', 'Off')],default='off')
    temperature_min = models.FloatField(null=True, blank=True)
    temperature_max = models.FloatField(null=True, blank=True)
    humidity_min = models.FloatField(null=True, blank=True)
    humidity_max = models.FloatField(null=True, blank=True)
    #Recently added fields
    model = models.CharField(max_length=100, blank=True, null=True)
    manufacturer = models.CharField(max_length=100, blank=True, null=True)
    serial_number = models.CharField(max_length=100, unique=True, blank=True, null=True)
    firmware_version = models.CharField(max_length=50, blank=True, null=True)

    alert_temp_min = models.FloatField(blank=True, null=True)
    alert_temp_max = models.FloatField(blank=True, null=True)
    alert_humidity_min = models.FloatField(blank=True, null=True)
    alert_humidity_max = models.FloatField(blank=True, null=True)

    logging_interval_minutes = models.PositiveIntegerField(default=15)

    # Toggleable settings
    button_stop_enabled = models.BooleanField(default=True)
    mute_button_enabled = models.BooleanField(default=True)
    alarm_tone_enabled = models.BooleanField(default=True)

    storage_mode = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Reading(models.Model):

    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='readings')
    temperature = models.FloatField()
    humidity = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reading from {self.device.name} at {self.timestamp}"