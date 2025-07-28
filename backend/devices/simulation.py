import random
from datetime import timedelta
from django.utils import timezone
from .models import Reading

def generate_random_reading(device_id):
    from .models import Device  # Local import to avoid circular dependency
    device = Device.objects.get(id=device_id)

    temp = round(random.uniform(device.temperature_min, device.temperature_max), 2)
    humidity = round(random.uniform(device.humidity_min, device.humidity_max), 2)
    timestamp = timezone.now()

    Reading.objects.create(
        device=device,
        temperature=temp,
        humidity=humidity,
        timestamp=timestamp
    )

    print(f"[Realtime] {device.number}: Temp={temp}, Humidity={humidity}, Time={timestamp}")


def backfill_readings(device):
    start_date = device.started_at
    interval = timedelta(minutes=device.logging_interval_minutes or 15)
    next_timestamp = start_date + interval
    now = timezone.now()

    print(f"Backfilling readings for {device.number} from {start_date} to {now}")

    while next_timestamp <= now:
        temp = round(random.uniform(device.temperature_min, device.temperature_max), 2)
        humidity = round(random.uniform(device.humidity_min, device.humidity_max), 2)

        Reading.objects.create(
            device=device,
            temperature=temp,
            humidity=humidity,
            timestamp=next_timestamp
        )

        print(f"[Backfill] {device.number}: Temp={temp}, Humidity={humidity}, Time={next_timestamp}")
        next_timestamp += interval


def generate_random_gap_reading(device_id):
    from .models import Device  # Local import to avoid circular dependency
    device = Device.objects.get(id=device_id)
    now = timezone.now()

    last_reading = Reading.objects.filter(device=device).order_by('-timestamp').first()

    if not last_reading:
        print(f"[Gap Fill] No previous readings for {device.number}. Backfilling from start.")
        backfill_readings(device)
        return

    interval = timedelta(minutes=device.logging_interval_minutes or 15)
    next_timestamp = last_reading.timestamp + interval
    readings_to_create = []

    while next_timestamp <= now:
        temp = round(random.uniform(device.temperature_min, device.temperature_max), 2)
        humidity = round(random.uniform(device.humidity_min, device.humidity_max), 2)

        readings_to_create.append(
            Reading(
                device=device,
                temperature=temp,
                humidity=humidity,
                timestamp=next_timestamp
            )
        )

        next_timestamp += interval

    if readings_to_create:
        Reading.objects.bulk_create(readings_to_create)
        print(f"[Gap Fill] Filled {len(readings_to_create)} missing readings for {device.name}")
    else:
        print(f"[Gap Fill] No gap detected for {device.code}")
