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


matplotlib.use('Agg')  # Use non-GUI backend for rendering

class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer
    def perform_create(self, serializer):
        device = serializer.save()
        # Backfill readings for the device
        backfill_readings(device)
        print(f"Backfilled readings for device: {device.name}")
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
        plt.xlabel('Timestamp',weight='bold')
        plt.ylabel('Temperature (°C)',weight='bold')
        plt.title(f'Device {device.number}  {device.code}- Temperature Over Time',weight='bold')
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
        plt.xlabel('Timestamp',weight='bold')
        plt.ylabel('Humidity (%)',weight='bold')
        plt.title(f'{device.name} - Humidity Over Time',weight='bold')
        plt.grid(True)
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(hum_graph_buf, format='png')
        plt.close()
        hum_graph_buf.seek(0)

        # Start PDF
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

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
            # c.drawImage(logo_path, width - 80, height - 80, width=40, preserveAspectRatio=True)
            c.drawImage(logo_path,  30, height - 60, width=40, preserveAspectRatio=True, mask='auto')

        else:
            print(f"Logo not found at: {logo_path}")

        # Room Name
        c.setFont("Helvetica-Bold", 12)
        c.setFillColor(colors.black)
        c.drawString(50, height - 100, "Location: ")
        c.setFillColorRGB(0, 0.6, 1)
        c.drawString(110, height - 100, device.location)

        # Device Information Section
        c.setFont("Helvetica-Bold", 12)
        c.setFillColorRGB(0, 0.75, 0.85)
        c.rect(50, height - 125, width - 100, 20, fill=1, stroke=0)
        c.setFillColor(colors.black)
        c.drawString(55, height - 120, "Device Information")
        c.setFillColor(colors.black)
        # First row
        c.setFont("Helvetica-Bold", 10)
        c.drawString(60, height - 140, "Device Model:")
        c.setFont("Helvetica", 10)
        c.drawString(140, height - 140, device.code)

        c.setFont("Helvetica-Bold", 10)
        c.drawString(250, height - 140, "Probe Type:")
        c.setFont("Helvetica", 10)
        c.drawString(370, height - 140, "Temperature & Humidity")

        # Second row
        c.setFont("Helvetica-Bold", 10)
        c.drawString(60, height - 155, "Serial Number:")
        c.setFont("Helvetica", 10)

        c.drawString(140, height - 155, getattr(device, 'serial_number', None) or 'N/A')

        c.setFont("Helvetica-Bold", 10)
        c.drawString(250, height - 155, "Firmware Version:")
        c.setFont("Helvetica", 10)
        c.drawString(370, height - 155, "V5.10")

        # Device Settings
        c.setFont("Helvetica-Bold", 12)
        c.setFillColorRGB(0, 0.75, 0.85)
        c.rect(50, height - 180, width - 100, 20, fill=1, stroke=0)
        c.setFillColor(colors.black)
        c.drawString(55, height - 175, "Device Settings")
        c.setFillColor(colors.black)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(60, height - 195, "Button stop: ")
        c.drawString(60, height - 210, "Mute Button:")
        c.drawString(60, height - 225, "Alarm Tone: ")
        c.drawString(250, height - 195, "Logging Interval: ")
        c.drawString(250, height - 210, "Alarm Logging Interval: ")
        c.drawString(250, height - 225, "Storage Mode: ")

        #Values
        c.setFont("Helvetica", 10)
        c.drawString(140, height - 195,"Disable")
        c.drawString(140, height - 210, "Disable")
        c.drawString(140, height - 225, "Enable")

        c.drawString(370, height - 195, "15m")
        c.drawString(370, height - 210, "15m")
        c.drawString(370, height - 225, "Loop")

        # Alarm Status
        c.setFont("Helvetica-Bold", 12)
        c.setFillColorRGB(0, 0.75, 0.85)

        c.rect(50, height - 250, width - 100, 20, fill=1, stroke=0)
        c.setFillColor(colors.black)
        c.drawString(55, height - 245, "Alarm Status")
        c.setFont("Helvetica", 10)
        c.setFillColorRGB(0.2, 0.2, 0.8)
        c.drawString(60, height - 265, "There are no available alarms.")
        c.setFillColor(colors.black)

        # Summary
        c.setFont("Helvetica-Bold", 12)
        c.setFillColorRGB(0, 0.75, 0.85)
        c.rect(50, height - 295, width - 100, 20, fill=1, stroke=0)
        c.setFillColor(colors.black)
        c.drawString(55, height - 290, "Summary")

        # Summary Title
        c.setFont("Helvetica-Bold", 12)
        c.setFillColorRGB(0, 0.75, 0.85)
        c.rect(50, height - 295, width - 100, 20, fill=1, stroke=0)
        c.setFillColor(colors.black)
        c.drawString(55, height - 290, "Summary")

        # --- Temperature Table ---
        c.setFillColorRGB(0.2, 0.4, 1)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(110, height - 320, "Temperature")

        # Table content
        y = height - 340
        c.setFillColor(colors.black)

        temp_labels = ["Maximum:", "Minimum:", "Average:"]
        temp_values = [f"{temp_max:.1f}", f"{temp_min:.1f}", f"{temp_avg:.2f}"]

        for label, value in zip(temp_labels, temp_values):
            c.setFont("Helvetica-Bold", 10)
            c.drawString(90, y, label)
            c.setFont("Helvetica", 10)
            c.drawString(160, y, value)
            y -= 15

        # --- Humidity Table ---
        c.setFillColorRGB(0.2, 0.4, 1)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(400, height - 320, "Humidity")

        # Table content
        y = height - 340
        c.setFillColor(colors.black)

        hum_labels = ["Maximum:", "Minimum:", "Average:"]
        hum_values = [f"{hum_max:.1f}", f"{hum_min:.1f}", f"{hum_avg:.2f}"]

        for label, value in zip(hum_labels, hum_values):
            c.setFont("Helvetica-Bold", 10)
            c.drawString(380, y, label)
            c.setFont("Helvetica", 10)
            c.drawString(450, y, value)
            y -= 15

        # Insert Temperature Graph
        c.setFont("Helvetica-Bold", 10)

        y = height - 550
        temp_img = ImageReader(temp_graph_buf)
        c.drawImage(temp_img, 70, y, width=450, height=150)

        # Insert Humidity Graph
        if y - 180 < 50:
            c.showPage()
            y = height - 80
        else:
            y -= 180

        hum_img = ImageReader(hum_graph_buf)
        c.drawImage(hum_img, 70, y, width=450, height=150)

        c.showPage()
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
    @action(detail=True, methods=['patch'], url_path='acknowledge')
    def acknowledge(self, request, pk=None):
        alarm = self.get_object()
        alarm.acknowledged = True
        alarm.save()
        return Response({'status': 'acknowledged'}, status=status.HTTP_200_OK)
class ManufacturerViewSet(viewsets.ModelViewSet):
    queryset = Manufacturer.objects.all()
    serializer_class = ManufacturerSerializer