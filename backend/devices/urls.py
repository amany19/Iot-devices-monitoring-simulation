from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AlarmViewSet, DeviceViewSet, ManufacturerViewSet, ReadingViewSet

router =DefaultRouter()
router.register(r'devices', DeviceViewSet, basename='device')
router.register(r'readings', ReadingViewSet)
router.register(r'alarms', AlarmViewSet)
router.register(r'manufacturers', ManufacturerViewSet)
urlpatterns = [
    path('', include(router.urls)),
]