from rest_framework import generics
from .models import CustomUser
from .serializers import CustomUserSerializer
from .permissions import IsSuperAdmin, IsAdmin
from rest_framework.permissions import IsAuthenticated

class CreateUserView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]  # Only super admins can create admin users
