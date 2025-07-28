from apscheduler.schedulers.background import BackgroundScheduler
from .simulation import generate_random_reading, generate_random_gap_reading
from .models import Device

def start():
    print("Scheduler started...")
    scheduler = BackgroundScheduler()
    
    for device in Device.objects.all():
        generate_random_gap_reading(device.id)
        logging_interval_minutes = device.logging_interval_minutes   # Default to 15 minutes if not set
        
        print(f"Scheduling readings for {device.code} every {logging_interval_minutes} minutes")
        scheduler.add_job(
            generate_random_reading,
            'interval',
            minutes=logging_interval_minutes,
            args=[device.id],
            id=f'generate_readings_job_{device.code}'
        )
         
    scheduler.start()
