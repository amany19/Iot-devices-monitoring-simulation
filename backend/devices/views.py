from django.shortcuts import render
from rest_framework import viewsets
from .models import Device
from .serializers import DeviceSerializer
from .serializers import ReadingSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from io import BytesIO
import zipfile 
from datetime import datetime,time
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
import matplotlib.pyplot as plt
from django.utils.dateparse import parse_datetime
import matplotlib
import matplotlib.dates as mdates
from rest_framework.parsers import JSONParser
matplotlib.use('Agg')  # Use non-GUI backend for rendering

class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer

    def _get_readings_for_device(self, device, start=None, end=None):
        readings = device.readings.all().order_by('timestamp')
        if start:
            readings = readings.filter(timestamp__gte=start)
        if end:
            readings = readings.filter(timestamp__lte=end)
        return readings
    def _generate_pdf_device_report(seld,device,readings):
        buffer = BytesIO() 
        temps = [r.temperature for r in readings]
        hums = [r.humidity for r in readings]
        times = [r.timestamp for r in readings]
        temp_max, temp_min, temp_avg = max(temps), min(temps), sum(temps)/len(temps)
        hum_max, hum_min, hum_avg = max(hums), min(hums), sum(hums)/len(hums)

        #Temperature Graph
        temp_graph_buf = BytesIO()
        plt.figure(figsize=(10, 3))
        plt.plot(times, temps, label='Temperature', color='red')
        plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d %H:%M'))
        plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
        plt.xlabel('Timestamp')
        plt.ylabel('Temperature (°C)')
        plt.title(f'{device.name} - Temperature Over Time')
        plt.grid(True)
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(temp_graph_buf, format='png')
        plt.close()
        temp_graph_buf.seek(0)

        # Humidity Graph
        hum_graph_buf = BytesIO()
        plt.figure(figsize=(10, 3))
        plt.plot(times, hums, label='Humidity', color='blue')
        plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d %H:%M'))
        plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
        plt.xlabel('Timestamp')
        plt.ylabel('Humidity (%)')
        plt.title(f'{device.name} - Humidity Over Time')
        plt.grid(True)
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(hum_graph_buf, format='png')
        plt.close()
        hum_graph_buf.seek(0)

        #Start PDF Report
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        # Header
        c.setFont("Helvetica-Bold", 18)
        c.drawString(200, height - 50, "Device Data Report")

        # Device Info
        c.setFont("Helvetica-Bold", 14)
        c.drawString(100, height - 80, device.name)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, height - 120, "Device Information:")
        c.setFont("Helvetica", 10)
        c.drawString(70, height - 140, f"Model: {device.code}")
        c.drawString(250, height - 140, f"Location: {device.location}")
        c.drawString(70, height - 160, f"Status: {device.status}")
        c.drawString(250, height - 160, f"Created at: {device.created_at.strftime('%Y-%m-%d')}")

        # Summary Stats
        y = height - 200
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, y, "Summary:")
        y -= 20
        c.setFont("Helvetica-Bold", 10)
        c.drawString(70, y, f"Temperature - Max: {temp_max:.2f}, Min: {temp_min:.2f}, Avg: {temp_avg:.2f}")
        y -= 15
        c.drawString(70, y, f"Humidity - Max: {hum_max:.2f}, Min: {hum_min:.2f}, Avg: {hum_avg:.2f}")

        # Insert Temperature Graph
        y -= 220
        temp_img = ImageReader(temp_graph_buf)
        c.drawImage(temp_img, 70, y, width=450, height=150)

        # Insert Humidity Graph below or on next page
        if y - 180 < 50:  # in case no space
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
