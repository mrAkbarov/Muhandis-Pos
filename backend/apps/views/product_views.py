from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.models import Branch
from apps.permissions import IsAuthenticatedNotPlatformOwnerWriter
from apps.serializers.product_serializers import BranchModelSerializer

API_PERMISSIONS = [IsAuthenticated, IsAuthenticatedNotPlatformOwnerWriter]


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
