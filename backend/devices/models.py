import uuid
from django.db import models
from django.utils import timezone
from simple_history.models import HistoricalRecords

# Create your models here.
class Manufacturer(models.Model):
    name = models.CharField(max_length=100, unique=True)
    # country = models.CharField(max_length=100, blank=True, null=True)
    # website = models.URLField(blank=True, null=True)
    # history = HistoricalRecords()
    def __str__(self):
        return self.name

class Device (models.Model):

    number = models.IntegerField(unique=True, default=0)
    code = models.CharField(max_length=50, unique=True, default="UNKNOWN")
    location = models.CharField(max_length=100, default="UNKNOWN")
    status = models.CharField(max_length=10, choices=[('on', 'On'), ('off', 'Off')],default='off')
    temperature_min = models.FloatField(null=True, blank=True)
    temperature_max = models.FloatField(null=True, blank=True)
    humidity_min = models.FloatField(null=True, blank=True)
    humidity_max = models.FloatField(null=True, blank=True)
    #Recently added fields
    model = models.CharField(max_length=100, blank=True, null=True)
    manufacturer = models.ForeignKey(Manufacturer, on_delete=models.SET_NULL, blank=True, null=True)

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
    started_at = models.DateTimeField(default=timezone.now)
    # history = HistoricalRecords()
 
    def __str__(self):
        return self.code

class Reading(models.Model):

    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='readings')
    temperature = models.FloatField()
    humidity = models.FloatField()
    timestamp = models.DateTimeField(default=timezone.now)
class Alarm(models.Model):
    ALARM_TYPES = (
        ('TEMP_HI', 'Temperature Too High'),
        ('TEMP_LO', 'Temperature Too Low'),
        ('HUM_HI', 'Humidity Too High'),
        ('HUM_LO', 'Humidity Too Low'),
        ('DC', 'Device Disconnected'),
        ('SD', 'Stop button disabled'),
        ('MD', 'Mute Button disabled'),
    )

    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='alarms')
    alarm_type = models.CharField(max_length=10, choices=ALARM_TYPES)
    triggered_value = models.FloatField(null=True, blank=True)  # not needed for DC
    timestamp = models.DateTimeField(auto_now_add=True)
    acknowledged = models.BooleanField(default=False)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.device.name} - {self.get_alarm_type_display()} @ {self.timestamp.strftime('%Y-%m-%d %H:%M')}"

    def user_message(self):
        label = self.get_alarm_type_display()
        if self.alarm_type not in ('DC','SD','MD') and self.triggered_value is not None:
            return f"{label}: {self.triggered_value}"
        return label
