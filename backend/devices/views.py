import random
from django.shortcuts import render
from rest_framework import viewsets
from .models import Alarm, Device, Manufacturer
from .serializers import AlarmSerializer, DeviceSerializer
from .serializers import ReadingSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from io import BytesIO
import os
import zipfile 
from datetime import datetime,time, timedelta
from django.utils import timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
import matplotlib.pyplot as plt
from django.utils.dateparse import parse_datetime
import matplotlib
import matplotlib.dates as mdates
from reportlab.lib import colors
from rest_framework.parsers import JSONParser
from .simulation import backfill_readings
from .serializers import ManufacturerSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from audit.models import AuditLog

# from devices.reports.pdf_generator import generate_pdf_device_report

matplotlib.use('Agg')  # Use non-GUI backend for rendering

class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer
    permission_classes = [IsAuthenticated] 
    def perform_create(self, serializer):
        device = serializer.save()
        # Backfill readings for the device
        backfill_readings(device)
        print(f"Backfilled readings for device: {device.code}")

        # ✅ Audit log
        AuditLog.objects.create(
            user=self.request.user if self.request.user.is_authenticated else None,
            action='CREATE',
            model_name='Device',
            object_id=str(device.id),
            changes=f"Device '{device.code}' created"
        )

    def perform_update(self, serializer):
        device = serializer.save()

        # ✅ Audit log
        print(self.request.user)
        AuditLog.objects.create(

            user=self.request.user,
            action='UPDATE',
            model_name='Device',
            object_id=str(device.id),
            changes=f"Device '{device.code}' updated"
        )

    def perform_destroy(self, instance):
        # ✅ Audit log
        AuditLog.objects.create(
            user=self.request.user if self.request.user.is_authenticated else None,
            action='DELETE',
            model_name='Device',
            object_id=str(instance.id),
            changes=f"Device '{instance.code}' deleted"
        )
        instance.delete()
        
    def _get_readings_for_device(self, device, start=None, end=None):
        readings = device.readings.all().order_by('timestamp')
        if start:
            readings = readings.filter(timestamp__gte=start)
        if end:
            readings = readings.filter(timestamp__lte=end)
            # Localize timestamps to the current timezone
        localized_readings = []
        for r in readings:
            r.timestamp = timezone.localtime(r.timestamp)  # convert UTC → local
            localized_readings.append(r)
        return localized_readings

    def _generate_pdf_device_report(self, device, readings):
        buffer = BytesIO()

        # Extract readings
        temps = [r.temperature for r in readings]
        hums = [r.humidity for r in readings]
        times = [r.timestamp for r in readings]

        temp_max, temp_min, temp_avg = max(temps), min(temps), sum(temps) / len(temps)
        hum_max, hum_min, hum_avg = max(hums), min(hums), sum(hums) / len(hums)
        tz = timezone.get_current_timezone()
        # Generate Temperature Graph
        temp_graph_buf = BytesIO()
        plt.figure(figsize=(10, 3))
        plt.plot(times, temps, label='Temperature', color='red')
        plt.gca().xaxis.set_major_formatter(mdates.DateFormatter("%I:%M %p %d-%m-%Y",tz=tz),)
        plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
        plt.xlabel('Timestamp', weight='bold')
        plt.ylabel('Temperature (°C)', weight='bold')
        plt.title(f'Device {device.number} {device.code} - Temperature Over Time', weight='bold')
        plt.grid(True)
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(temp_graph_buf, format='png')
        plt.close()
        temp_graph_buf.seek(0)

        # Generate Humidity Graph
        hum_graph_buf = BytesIO()
        plt.figure(figsize=(10, 3))
        plt.plot(times, hums, label='Humidity', color='blue')
        plt.gca().xaxis.set_major_formatter(mdates.DateFormatter("%I:%M %p %d-%m-%Y",tz=tz))
        plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
        plt.xlabel('Timestamp', weight='bold')
        plt.ylabel('Humidity (%)', weight='bold')
        plt.title(f'{device.code} - Humidity Over Time', weight='bold')
        plt.grid(True)
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(hum_graph_buf, format='png')
        plt.close()
        hum_graph_buf.seek(0)

        # Start PDF
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        def draw_header():
            c.setFont("Helvetica-Bold", 28)
            c.drawCentredString(width / 2, height - 50, "Data Report")

            c.setFont("Helvetica-Bold", 20)
            c.setFillColorRGB(0, 0.7, 1)
            c.drawCentredString(width / 2, height - 80, device.code)

            logo_path = "./assets/goveeIcon.png"
            if os.path.exists(logo_path):
                c.drawImage(logo_path, 30, height - 60, width=40,
                            preserveAspectRatio=True, mask='auto')

            c.setFont("Helvetica-Bold", 12)
            c.setFillColor(colors.black)
            c.drawString(50, height - 100, "Location: ")
            c.setFillColorRGB(0, 0.6, 1)
            c.drawString(110, height - 100, device.location)

        def draw_device_info(y_pos):
            c.setFont("Helvetica-Bold", 12)
            c.setFillColorRGB(0, 0.75, 0.85)
            c.rect(50, y_pos - 20, width - 100, 20, fill=1, stroke=0)
            c.setFillColor(colors.black)
            c.drawString(55, y_pos - 15, "Device Information")

            c.setFont("Helvetica-Bold", 10)
            c.drawString(60, y_pos - 35, "Device Model:")
            c.setFont("Helvetica", 10)
            c.drawString(140, y_pos - 35, device.code)

            c.setFont("Helvetica-Bold", 10)
            c.drawString(250, y_pos - 35, "Probe Type:")
            c.setFont("Helvetica", 10)
            c.drawString(370, y_pos - 35, "Temperature & Humidity")

            c.setFont("Helvetica-Bold", 10)
            c.drawString(60, y_pos - 50, "Serial Number:")
            c.setFont("Helvetica", 10)
            c.drawString(140, y_pos - 50,
                        getattr(device, 'serial_number', None) or 'N/A')

            c.setFont("Helvetica-Bold", 10)
            c.drawString(250, y_pos - 50, "Firmware Version:")
            c.setFont("Helvetica", 10)
            c.drawString(370, y_pos - 50, "V5.10")

            return y_pos - 70

        def draw_device_settings(y_pos):
            c.setFont("Helvetica-Bold", 12)
            c.setFillColorRGB(0, 0.75, 0.85)
            c.rect(50, y_pos - 20, width - 100, 20, fill=1, stroke=0)
            c.setFillColor(colors.black)
            c.drawString(55, y_pos - 15, "Device Settings")

            c.setFont("Helvetica-Bold", 10)
            c.drawString(60, y_pos - 35, "Button stop: ")
            c.drawString(60, y_pos - 50, "Mute Button:")
            c.drawString(60, y_pos - 65, "Alarm Tone: ")
            c.drawString(250, y_pos - 35, "Logging Interval: ")
            c.drawString(250, y_pos - 50, "Alarm Logging Interval: ")
            c.drawString(250, y_pos - 65, "Storage Mode: ")
            button_stop="Enable" if device.button_stop_enabled else"Disable"
            mute_stop="Enable" if device.mute_button_enabled else"Disable"
            alarm_tone="Enable" if device.alarm_tone_enabled else"Disable"
            c.setFont("Helvetica", 10)
            c.drawString(140, y_pos - 35, button_stop)
            c.drawString(140, y_pos - 50, mute_stop)
            c.drawString(140, y_pos - 65, alarm_tone)
            c.drawString(370, y_pos - 35, "15m")
            c.drawString(370, y_pos - 50, "15m")
            c.drawString(370, y_pos - 65, "Loop")

            return y_pos - 85

        def draw_alarms(y_pos):
            c.setFont("Helvetica-Bold", 12)
            c.setFillColorRGB(0, 0.75, 0.85)
            c.rect(50, y_pos - 20, width - 100, 20, fill=1, stroke=0)
            c.setFillColor(colors.black)
            c.drawString(55, y_pos - 15, "Alarm Status")

            alarms = Alarm.objects.filter(device=device).order_by('-timestamp')[:5]
            y = y_pos - 35
            if alarms.exists():
                for alarm in alarms:
                    message = f"[{timezone.localtime(alarm.timestamp).strftime('%Y-%m-%d %H:%M')}] {alarm.alarm_type.upper()} - {alarm.user_message()}"
                    c.drawString(60, y, message[:100])
                    y -= 15
                    if y < 100:
                        c.showPage()
                        y = height - 50
            else:
                c.setFillColorRGB(0.2, 0.2, 0.8)
                c.drawString(60, y, "There are no available alarms.")
                y -= 15

            c.setFillColor(colors.black)
            return y

        def draw_summary(y_pos):
            c.setFont("Helvetica-Bold", 12)
            c.setFillColorRGB(0, 0.75, 0.85)
            c.rect(50, y_pos - 20, width - 100, 20, fill=1, stroke=0)
            c.setFillColor(colors.black)
            c.drawString(55, y_pos - 15, "Summary")

            c.setFillColorRGB(0.2, 0.4, 1)
            c.setFont("Helvetica-Bold", 11)
            c.drawString(110, y_pos - 40, "Temperature")

            y = y_pos - 60
            c.setFillColor(colors.black)

            temp_labels = ["Maximum:", "Minimum:", "Average:"]
            temp_values = [f"{temp_max:.1f}", f"{temp_min:.1f}", f"{temp_avg:.2f}"]

            for label, value in zip(temp_labels, temp_values):
                c.setFont("Helvetica-Bold", 10)
                c.drawString(90, y, label)
                c.setFont("Helvetica", 10)
                c.drawString(160, y, value)
                y -= 15

            c.setFillColorRGB(0.2, 0.4, 1)
            c.setFont("Helvetica-Bold", 11)
            c.drawString(400, y_pos - 40, "Humidity")

            y = y_pos - 60
            c.setFillColor(colors.black)

            hum_labels = ["Maximum:", "Minimum:", "Average:"]
            hum_values = [f"{hum_max:.1f}", f"{hum_min:.1f}", f"{hum_avg:.2f}"]

            for label, value in zip(hum_labels, hum_values):
                c.setFont("Helvetica-Bold", 10)
                c.drawString(380, y, label)
                c.setFont("Helvetica", 10)
                c.drawString(450, y, value)
                y -= 15

            return y_pos - 100

        def draw_graphs(y_pos):
            # Temperature Graph
            if y_pos - 180 < 50:
                c.showPage()
                y_pos = height - 50
            temp_img = ImageReader(temp_graph_buf)
            c.drawImage(temp_img, 70, y_pos - 150, width=450, height=150)
            y_pos -= 180

            # Humidity Graph
            if y_pos - 180 < 50:
                c.showPage()
                y_pos = height - 50
            hum_img = ImageReader(hum_graph_buf)
            c.drawImage(hum_img, 70, y_pos - 150, width=450, height=150)
            y_pos -= 180

            return y_pos

        def draw_readings_table(y_pos):
            table_data = []
            for r in readings:
                # reading_time =timezone.localtime(r.timestamp)
                reading_time=r.timestamp
                table_data.append({
                    'timestamp': reading_time.strftime("%I:%M %p %d-%m-%Y"),
                    'temperature': f"{r.temperature:.1f}°C",
                    'humidity': f"{r.humidity:.1f}%"
                })

            c.setFont("Helvetica-Bold", 12)
            c.setFillColorRGB(0, 0.75, 0.85)
            c.rect(50, y_pos - 20, width - 100, 20, fill=1, stroke=0)
            c.setFillColor(colors.black)
            c.drawString(55, y_pos - 15, "Readings Data")

            if y_pos - 250 < 50:
                c.showPage()
                y_pos = height - 50

            col_widths = [166, 164, 164]
            row_height = 20
            header_height = y_pos - 45
            data_start = header_height - row_height

            headers = ["Timestamp", "Temperature", "Humidity"]
            c.setFont("Helvetica-Bold", 10)

            x = 50
            for i, header in enumerate(headers):
                c.rect(x, header_height - row_height, col_widths[i], row_height)
                c.drawString(x + 5, header_height - row_height + 5, header)
                x += col_widths[i]

            c.setFont("Helvetica", 9)
            current_y = data_start
            rows_per_page = 36

            for i, reading in enumerate(table_data):
                if i > 0 and i % rows_per_page == 0:
                    c.showPage()
                    current_y = height - 50
                    c.setFont("Helvetica-Bold", 10)
                    x = 50
                    for j, header in enumerate(headers):
                        c.rect(x, current_y - row_height, col_widths[j], row_height)
                        c.drawString(x + 5, current_y - row_height + 5, header)
                        x += col_widths[j]
                    current_y -= row_height
                    c.setFont("Helvetica", 9)

                x = 50
                c.rect(x, current_y - row_height, col_widths[0], row_height)
                c.drawString(x + 5, current_y - row_height + 5, reading['timestamp'])
                x += col_widths[0]

                c.rect(x, current_y - row_height, col_widths[1], row_height)
                c.drawString(x + 5, current_y - row_height + 5, reading['temperature'])
                x += col_widths[1]

                c.rect(x, current_y - row_height, col_widths[2], row_height)
                c.drawString(x + 5, current_y - row_height + 5, reading['humidity'])

                current_y -= row_height

            return current_y - 20

        # ==== Main Drawing Sequence ====
        draw_header()
        current_y = height - 125

        current_y = draw_device_info(current_y)
        current_y = draw_device_settings(current_y)
        current_y = draw_alarms(current_y)

        if current_y < 100:
            c.showPage()
            current_y = height - 50

        current_y = draw_summary(current_y)
        current_y = draw_graphs(current_y)

        c.showPage()
        draw_readings_table(height - 50)

        c.save()
        buffer.seek(0)
        return buffer

        
    #report for single device
    @action(detail=True, methods=['get'], url_path='report')   
    def generate_pdf_report(self, request, pk=None):
        try:
            
            device = self.get_object()
            start_param = request.query_params.get('start')
            end_param = request.query_params.get('end')
            start = parse_datetime(start_param) if start_param else None
            end = parse_datetime(end_param) if end_param else None
            readings=self._get_readings_for_device(device,start,end)
            if not readings:
                return Response({'error': 'No readings in this time range'}, status=404)
            buffer= self._generate_pdf_device_report(device, readings)
            response = HttpResponse(buffer, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="device_{device.id}_report.pdf"'
            return response

        except Device.DoesNotExist:
            print(f"DEBUG: device with id {pk} not found")
            return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)
    # All Devices' Reports
    @action(detail=False, methods=['get'], url_path='report/all')
    def generate_all_devices_reports(self, request):
        devices = self.get_queryset()
        start_param = request.query_params.get('start')
        end_param = request.query_params.get('end')
        start = parse_datetime(start_param) if start_param else None
        end = parse_datetime(end_param) if end_param else None
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for device in devices:
                readings=self._get_readings_for_device(device,start,end)
                if not readings.exists():
                    continue
                pdf_buffer = self._generate_pdf_device_report(device,readings)
                pdf_filename = f"device_{device.id}_report.pdf"
                zip_file.writestr(pdf_filename, pdf_buffer.read())

        zip_buffer.seek(0)
        response = HttpResponse(zip_buffer, content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename="all_devices_reports.zip"'
        return response
    @action(detail=False, methods=['post'], url_path='report')
    def generate_multiple_devices_reports(self, request):
        device_ids = request.data.get('device_ids', [])
        if not device_ids:
            return Response({'error': 'No device_ids provided'}, status=400)
         
        start = parse_datetime(request.query_params.get('start'))
        end = parse_datetime(request.query_params.get('end'))

        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for device in Device.objects.filter(id__in=device_ids):
                readings = self._get_readings_for_device(device, start, end)
                if not readings.exists():
                    continue
                pdf_buffer = self._generate_pdf_device_report(device, readings)
                filename = f"device_{device.id}_report.pdf"
                zip_file.writestr(filename, pdf_buffer.read())

        zip_buffer.seek(0)
        response = HttpResponse(zip_buffer, content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename="selected_devices_reports.zip"'
        return response
    @action(detail=True, methods=['get'],url_path='readings')
    def readings(self,request, pk=None):
        device= self.get_object()
        start_date = request.query_params.get('start')
        end_date= request.query_params.get('end')
        readings= device.readings.all().order_by('timestamp')
        if start_date:
            start_date_time=datetime.combine(datetime.fromisoformat(start_date).date(), time.min    )
            readings= readings.filter(timestamp__gte=start_date_time)
        if end_date:
            end_date_time=datetime.combine(datetime.fromisoformat(end_date).date(), time.max    )
            readings= readings.filter(timestamp__lte=end_date_time)
        serializer= ReadingSerializer(readings,many=True)
        return Response(serializer.data)

#Reading 
from rest_framework import viewsets
from .models import Reading
from .serializers import ReadingSerializer

class ReadingViewSet(viewsets.ModelViewSet):
    queryset = Reading.objects.all()
    serializer_class = ReadingSerializer
    @action(detail=False, methods=['post'], url_path='inject')
    def inject_readings(self, request):
        mode = request.data.get('device_mode')
        device_ids = request.data.get('device_ids', [])
        start_time = parse_datetime(request.data.get('start_time'))
        end_time = parse_datetime(request.data.get('end_time'))
        # Round and tolerance slight values to handle the microseconds stored in the database for each reading
        start_time = (start_time - timedelta(seconds=30)).replace(microsecond=0)
        end_time = (end_time + timedelta(seconds=30)).replace(microsecond=999999)
        print(start_time) 
        temp_min = float(request.data.get('temp_min'))
        temp_max = float(request.data.get('temp_max'))
        hum_min = float(request.data.get('hum_min'))
        hum_max = float(request.data.get('hum_max'))

        if mode == 'all':
            readings = Reading.objects.filter(timestamp__gte=start_time, timestamp__lte=end_time)
        elif mode == 'single' or mode == 'multiple':
            readings = Reading.objects.filter(device_id__in=device_ids, timestamp__gte=start_time, timestamp__lte=end_time)
        else:
            return Response({"error": "Invalid mode"}, status=400)

        updated_count = 0
        for reading in readings:
            reading.temperature = round(random.uniform(temp_min, temp_max), 2)
            reading.humidity = round(random.uniform(hum_min, hum_max), 2)
            reading.save()
            updated_count += 1

        return Response({"message": f"{updated_count} readings updated"})



#Alarms
class AlarmViewSet(viewsets.ModelViewSet):
    queryset = Alarm.objects.all().order_by('-timestamp')
    serializer_class = AlarmSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        device_id = self.request.query_params.get('device')
        acknowledged = self.request.query_params.get('acknowledged')
        active = self.request.query_params.get('active')

        if device_id:
            queryset = queryset.filter(device_id=device_id)
        if acknowledged is not None:
            queryset = queryset.filter(acknowledged=acknowledged.lower() == 'true')
        if active is not None:
            queryset = queryset.filter(active=active.lower() == 'true')

        return queryset
    def _create_disconnection_alarm(self, device):
        Alarm.objects.create(
            device=device,
            alarm_type='disconnection',
            triggered_value='Status set to off',
            active=True,
            acknowledged=False
        )
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        previous_status = instance.status
        response = super().update(request, *args, **kwargs)
        
        # Check status change
        if previous_status != instance.status and instance.status.lower() in ['off', 'disabled']:
            self._create_disconnection_alarm(instance)
        
        return response
    @action(detail=True, methods=['patch'], url_path='acknowledge')
    def acknowledge(self, request, pk=None):
        alarm = self.get_object()
        alarm.acknowledged = True
        alarm.save()
        return Response({'status': 'acknowledged'}, status=status.HTTP_200_OK)
class ManufacturerViewSet(viewsets.ModelViewSet):
    queryset = Manufacturer.objects.all()
    serializer_class = ManufacturerSerializer
    permission_classes = [IsAuthenticated] 
    def perform_create(self, serializer):
        manufacturer = serializer.save()
        # ✅ Log creation
        AuditLog.objects.create(
            user=self.request.user,
            action='CREATE',
            model_name='Manufacturer',
            object_id=str(manufacturer.id),
            changes=f"Manufacturer '{manufacturer.name}' created"
        )

    def perform_update(self, serializer):
        manufacturer = serializer.save()
        # ✅ Log update
        AuditLog.objects.create(
            user=self.request.user,
            action='UPDATE',
            model_name='Manufacturer',
            object_id=str(manufacturer.id),
            changes=f"Manufacturer '{manufacturer.name}' updated"
        )

    def perform_destroy(self, instance):
        # ✅ Log delete before deleting
        AuditLog.objects.create(
            user=self.request.user,
            action='DELETE',
            model_name='Manufacturer',
            object_id=str(instance.id),
            changes=f"Manufacturer '{instance.name}' deleted"
        )
        instance.delete()
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from devices.models import Device, Reading, Alarm

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    device_count = Device.objects.count()
    alarm_count = Alarm.objects.filter(acknowledged=False).count()
    reading_count = Reading.objects.count()

    return Response({
        'devices': device_count,
        'alarms': alarm_count,
        'readings': reading_count,
    })
 