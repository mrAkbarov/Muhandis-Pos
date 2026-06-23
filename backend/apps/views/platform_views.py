from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.permissions import IsPlatformOwner
from apps.services.platform_monitor import get_magazin_status_report


@extend_schema(tags=['Platform'])
class MagazinStatusAPIView(APIView):
    """Platform egasi uchun — qaysi magazinlar ishlayapti, qaysi biri yo'q."""

    permission_classes = [IsAuthenticated, IsPlatformOwner]

    def get(self, request):
        return Response(get_magazin_status_report())
