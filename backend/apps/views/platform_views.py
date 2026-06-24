from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from apps.models import Branch
from apps.permissions import IsAuthenticatedNotPlatformOwnerWriter, IsPlatformOwner
from apps.serializers.product_serializers import BranchModelSerializer
from apps.services.platform_monitor import get_magazin_status_report

API_PERMISSIONS = [IsAuthenticated, IsAuthenticatedNotPlatformOwnerWriter]


@extend_schema(tags=['Platform'])
class MagazinStatusAPIView(APIView):
    """Platform egasi uchun — qaysi magazinlar ishlayapti, qaysi biri yo'q."""

    permission_classes = [IsAuthenticated, IsPlatformOwner]

    def get(self, request):
        return Response(get_magazin_status_report())


@extend_schema(tags=['Branch'])
class BranchModelViewSet(ModelViewSet):
    """Filiallar ro'yxati — UUID alohida primary key."""

    queryset = Branch.objects.all()
    serializer_class = BranchModelSerializer
    permission_classes = API_PERMISSIONS

    def get_queryset(self):
        from apps.services.branch_access import filter_queryset_by_user_branch

        qs = Branch.objects.all().order_by('name')
        return filter_queryset_by_user_branch(qs, self.request.user)
