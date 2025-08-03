from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import AuditLog
from devices.models import Device, Manufacturer
from .middleware import get_current_user  # ✅ use the one from middleware

@receiver(post_save, sender=Device)
def log_device_change(sender, instance, created, **kwargs):
    AuditLog.objects.create(
        user=get_current_user(),  # now actually returns logged-in user
        action='CREATE' if created else 'UPDATE',
        model_name='Device',
        object_id=str(instance.id),
        changes=f"Device '{instance.code}' {'created' if created else 'updated'}"
    )

@receiver(post_delete, sender=Device)
def log_device_delete(sender, instance, **kwargs):
    AuditLog.objects.create(
        user=get_current_user(),
        action='DELETE',
        model_name='Device',
        object_id=str(instance.id),
        changes=f"Device '{instance.code}' deleted"
    )

@receiver(post_save, sender=Manufacturer)
def log_manufacturer_change(sender, instance, created, **kwargs):
    AuditLog.objects.create(
        user=get_current_user(),
        action='CREATE' if created else 'UPDATE',
        model_name='Manufacturer',
        object_id=str(instance.id),
        changes=f"Manufacturer '{instance.name}' {'created' if created else 'updated'}"
    )

@receiver(post_delete, sender=Manufacturer)
def log_manufacturer_delete(sender, instance, **kwargs):
    AuditLog.objects.create(
        user=get_current_user(),
        action='DELETE',
        model_name='Manufacturer',
        object_id=str(instance.id),
        changes=f"Manufacturer '{instance.name}' deleted"
    )
