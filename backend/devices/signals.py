from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Device, Reading, Alarm

# === Reading-triggered alarms ===
@receiver(post_save, sender=Reading)
def handle_new_reading(sender, instance, **kwargs):
    device = instance.device

    # Only generate reading-based alarms when device is ON
    if device.status == 'on':
        check_and_create_reading_alarms(device, instance.temperature, instance.humidity,instance.timestamp)


def check_and_create_reading_alarms(device, temperature, humidity,reading_timestamp):
    def create_alarm_once(alarm_type, value=None):
        if not Alarm.objects.filter(
            device=device, alarm_type=alarm_type, acknowledged=False, active=True
        ).exists():
            Alarm.objects.create(
                device=device,
                alarm_type=alarm_type,
                triggered_value=value,
                timestamp=reading_timestamp 
            )

    if device.alert_temp_max is not None and temperature > device.alert_temp_max:
        create_alarm_once('TEMP_HI', temperature)
    elif device.alert_temp_min is not None and temperature < device.alert_temp_min:
        create_alarm_once('TEMP_LO', temperature)

    if device.alert_humidity_max is not None and humidity > device.alert_humidity_max:
        create_alarm_once('HUM_HI', humidity)
    elif device.alert_humidity_min is not None and humidity < device.alert_humidity_min:
        create_alarm_once('HUM_LO', humidity)


# === Status-triggered alarms ===
@receiver(post_save, sender=Device)
def handle_device_status_change(sender, instance, created, **kwargs):
    if created:
        return  # Skip alarm logic on device creation

    def create_status_alarm(alarm_type):
        if not Alarm.objects.filter(
            device=instance, alarm_type=alarm_type, acknowledged=False, active=True
        ).exists():
            Alarm.objects.create(
                device=instance,
                alarm_type=alarm_type
            )

    if instance.status == 'off':
        create_status_alarm('DC')

    if not instance.button_stop_enabled:
        create_status_alarm('SD')

    if not instance.mute_button_enabled:
        create_status_alarm('MD')
