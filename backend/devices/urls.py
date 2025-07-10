from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeviceViewSet, ReadingViewSet

router =DefaultRouter()
router.register(r'devices', DeviceViewSet, basename='device')
router.register(r'readings', ReadingViewSet)


urlpatterns = [
    path('', include(router.urls)),
]