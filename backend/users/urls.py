from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.urls import path,include
from rest_framework.routers import DefaultRouter

from .views import UserViewSet
# from .views import RegisterView
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include(router.urls))
]
