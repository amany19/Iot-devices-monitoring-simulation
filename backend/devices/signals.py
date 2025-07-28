# example logic inside views.py or signals.py

from devices.models import Alarm
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Device, Reading
@receiver(post_save, sender=Reading)
def handle_new_reading(sender, instance, **kwargs):
    device = instance.device
    temperature = instance.temperature
    humidity = instance.humidity

    check_and_create_alarms(device, temperature, humidity)
@receiver(post_save, sender=Device)
def handle_device_status_change(sender, instance, created, **kwargs):
    if created:
        return  # Skip on creation

    if instance.status == 'off':
        # Only create DC alarm if there's no active unacknowledged one
        if not Alarm.objects.filter(device=instance, alarm_type='DC', acknowledged=False, active=True).exists():
            Alarm.objects.create(
                device=instance,
                alarm_type='DC',
                triggered_value=None
            )
def check_and_create_alarms(device, temperature, humidity):
    def create_alarm_once(alarm_type, value):
        if not Alarm.objects.filter(device=device, alarm_type=alarm_type, acknowledged=False, active=True).exists():
            Alarm.objects.create(device=device, alarm_type=alarm_type, triggered_value=value)

    if device.alert_temp_max is not None and temperature > device.alert_temp_max:
        create_alarm_once('TEMP_HI', temperature)

    elif device.alert_temp_min is not None and temperature < device.alert_temp_min:
        create_alarm_once('TEMP_LO', temperature)

    if device.alert_humidity_max is not None and humidity > device.alert_humidity_max:
        create_alarm_once('HUM_HI', humidity)

    elif device.alert_humidity_min is not None and humidity < device.alert_humidity_min:
        create_alarm_once('HUM_LO', humidity)

    # if device.status == 'off':
    #     create_alarm_once('DC', None) 
    
    # # Must not sent here must apply when status is off
    #  don't create alarm when reading is created 
    # Or don't simulate device off readings at all