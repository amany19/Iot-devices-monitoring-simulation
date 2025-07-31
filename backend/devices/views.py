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
from datetime import datetime,time
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

# from devices.reports.pdf_generator import generate_pdf_device_report

matplotlib.use('Agg')  # Use non-GUI backend for rendering

class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer
    def perform_create(self, serializer):
        device = serializer.save()
        # Backfill readings for the device
        backfill_readings(device)
        print(f"Backfilled readings for device: {device.code}")
    def _get_readings_for_device(self, device, start=None, end=None):
        readings = device.readings.all().order_by('timestamp')
        if start:
            readings = readings.filter(timestamp__gte=start)
        if end:
            readings = readings.filter(timestamp__lte=end)
        return readings
  
    def _generate_pdf_device_report(self, device, readings):
        buffer = BytesIO()

        # Extract readings
        temps = [r.temperature for r in readings]
        hums = [r.humidity for r in readings]
        times = [r.timestamp for r in readings]

        temp_max, temp_min, temp_avg = max(temps), min(temps), sum(temps) / len(temps)
        hum_max, hum_min, hum_avg = max(hums), min(hums), sum(hums) / len(hums)

        # Generate Temperature Graph
        temp_graph_buf = BytesIO()
        plt.figure(figsize=(10, 3))
        plt.plot(times, temps, label='Temperature', color='red')
        plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d %H:%M'))
        plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
        plt.xlabel('Timestamp', weight='bold')
        plt.ylabel('Temperature (°C)', weight='bold')
        plt.title(f'Device {device.number}  {device.code}- Temperature Over Time', weight='bold')
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
        plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d %H:%M'))
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
            # Header
            c.setFont("Helvetica-Bold", 28)
            c.drawCentredString(width / 2, height - 50, "Data Report")

            # Device name as link-style
            c.setFont("Helvetica-Bold", 20)
            c.setFillColorRGB(0, 0.7, 1)
            c.drawCentredString(width / 2, height - 80, device.code)

            # Logo
            logo_path = "./assets/goveeIcon.png"
            if os.path.exists(logo_path):
                c.drawImage(logo_path, 30, height - 60, width=40, preserveAspectRatio=True, mask='auto')
            else:
                print(f"Logo not found at: {logo_path}")

            # Room Name
            c.setFont("Helvetica-Bold", 12)
            c.setFillColor(colors.black)
            c.drawString(50, height - 100, "Location: ")
            c.setFillColorRGB(0, 0.6, 1)
            c.drawString(110, height - 100, device.location)

        def draw_device_info(y_pos):
            # Device Information Section
            c.setFont("Helvetica-Bold", 12)
            c.setFillColorRGB(0, 0.75, 0.85)
            c.rect(50, y_pos - 20, width - 100, 20, fill=1, stroke=0)
            c.setFillColor(colors.black)
            c.drawString(55, y_pos - 15, "Device Information")
            
            # First row
            c.setFont("Helvetica-Bold", 10)
            c.drawString(60, y_pos - 35, "Device Model:")
            c.setFont("Helvetica", 10)
            c.drawString(140, y_pos - 35, device.code)

            c.setFont("Helvetica-Bold", 10)
            c.drawString(250, y_pos - 35, "Probe Type:")
            c.setFont("Helvetica", 10)
            c.drawString(370, y_pos - 35, "Temperature & Humidity")

            # Second row
            c.setFont("Helvetica-Bold", 10)
            c.drawString(60, y_pos - 50, "Serial Number:")
            c.setFont("Helvetica", 10)
            c.drawString(140, y_pos - 50, getattr(device, 'serial_number', None) or 'N/A')

            c.setFont("Helvetica-Bold", 10)
            c.drawString(250, y_pos - 50, "Firmware Version:")
            c.setFont("Helvetica", 10)
            c.drawString(370, y_pos - 50, "V5.10")

            return y_pos - 70

        def draw_device_settings(y_pos):
            # Device Settings
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

            # Values
            c.setFont("Helvetica", 10)
            c.drawString(140, y_pos - 35, "Disable")
            c.drawString(140, y_pos - 50, "Disable")
            c.drawString(140, y_pos - 65, "Enable")
            c.drawString(370, y_pos - 35, "15m")
            c.drawString(370, y_pos - 50, "15m")
            c.drawString(370, y_pos - 65, "Loop")

            return y_pos - 85

        def draw_alarms(y_pos):
            # Alarm Status
            c.setFont("Helvetica-Bold", 12)
            c.setFillColorRGB(0, 0.75, 0.85)
            c.rect(50, y_pos - 20, width - 100, 20, fill=1, stroke=0)
            c.setFillColor(colors.black)
            c.drawString(55, y_pos - 15, "Alarm Status")
            
            # Fetch recent alarms
            alarms = Alarm.objects.filter(device=device).order_by('-timestamp')[:5]
            
            y = y_pos - 35
            if alarms.exists():
                for alarm in alarms:
                    message = f"[{alarm.timestamp.strftime('%Y-%m-%d %H:%M')}] {alarm.alarm_type.upper()} - {alarm.user_message()}"
                    c.drawString(60, y, message[:100])  # trim long messages
                    y -= 15
                    if y < 100:  # Near bottom of page
                        c.showPage()
                        y = height - 50  # Reset to top of new page
            else:
                c.setFillColorRGB(0.2, 0.2, 0.8)
                c.drawString(60, y, "There are no available alarms.")
                y -= 15

            c.setFillColor(colors.black)
            return y

        def draw_summary(y_pos):
            # Summary Section
            c.setFont("Helvetica-Bold", 12)
            c.setFillColorRGB(0, 0.75, 0.85)
            c.rect(50, y_pos - 20, width - 100, 20, fill=1, stroke=0)
            c.setFillColor(colors.black)
            c.drawString(55, y_pos - 15, "Summary")

            # Temperature Table
            c.setFillColorRGB(0.2, 0.4, 1)
            c.setFont("Helvetica-Bold", 11)
            c.drawString(110, y_pos - 40, "Temperature")

            # Table content
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

            # Humidity Table
            c.setFillColorRGB(0.2, 0.4, 1)
            c.setFont("Helvetica-Bold", 11)
            c.drawString(400, y_pos - 40, "Humidity")

            # Table content
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
            # Insert Temperature Graph
            temp_img = ImageReader(temp_graph_buf)
            c.drawImage(temp_img, 70, y_pos - 150, width=450, height=150)

            # Check if we need a new page for humidity graph
            if y_pos - 330 < 50:  # Not enough space for next graph
                c.showPage()
                y_pos = height - 50  # Reset to top of new page

            # Insert Humidity Graph
            hum_img = ImageReader(hum_graph_buf)
            c.drawImage(hum_img, 70, y_pos - 150, width=450, height=150)

        def draw_readings_table(y_pos):
            # Prepare table data
            table_data = []
            for r in readings:
                table_data.append({
                    'timestamp': r.timestamp.strftime('%Y-%m-%d %H:%M'),
                    'temperature': f"{r.temperature:.1f}°C",
                    'humidity': f"{r.humidity:.1f}%"
                })

            # Readings Table Section
            c.setFont("Helvetica-Bold", 12)
            c.setFillColorRGB(0, 0.75, 0.85)
            c.rect(50, y_pos - 20, width - 100, 20, fill=1, stroke=0)
            c.setFillColor(colors.black)
            c.drawString(55, y_pos - 15, "Readings Data")
            
            # Check if we need a new page
            if y_pos - 250 < 50:  # Not enough space for table
                c.showPage()
                y_pos = height - 50
            
            # Table setup
            col_widths = [150, 100, 100]  # Timestamp, Temp, Humidity
            row_height = 20
            header_height = y_pos - 45
            data_start = header_height - row_height
            
            # Draw table headers with borders
            headers = ["Timestamp", "Temperature", "Humidity"]
            c.setFont("Helvetica-Bold", 10)
            
            x = 50
            for i, header in enumerate(headers):
                c.rect(x, header_height - row_height, col_widths[i], row_height)
                c.drawString(x + 5, header_height - row_height + 5, header)
                x += col_widths[i]
            
            # Draw table rows with data
            c.setFont("Helvetica", 9)
            current_y = data_start
            rows_per_page = 15  # Number of rows that fit on a page
            
            for i, reading in enumerate(table_data):
                if i > 0 and i % rows_per_page == 0:
                    # New page needed
                    c.showPage()
                    current_y = height - 50
                    # Redraw headers on new page
                    c.setFont("Helvetica-Bold", 10)
                    x = 50
                    for j, header in enumerate(headers):
                        c.rect(x, current_y - row_height, col_widths[j], row_height)
                        c.drawString(x + 5, current_y - row_height + 5, header)
                        x += col_widths[j]
                    current_y -= row_height
                    c.setFont("Helvetica", 9)
                
                # Draw row cells
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
            
            return current_y - 20  # Add some margin after table

        # Main drawing sequence
        draw_header()
        current_y = height - 125  # Starting position after header
        
        current_y = draw_device_info(current_y)
        current_y = draw_device_settings(current_y)
        current_y = draw_alarms(current_y)
        
        # After alarms, we might be on a new page, so reset current_y if needed
        if current_y < 100:  # We're near the bottom of the page
            c.showPage()
            current_y = height - 50
        
        current_y = draw_summary(current_y)
        draw_graphs(current_y)
        
        # Add the readings table after graphs
        c.showPage()  # Start table on new page
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
            if not readings.exists():
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
 