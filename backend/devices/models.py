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