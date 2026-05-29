from drf_spectacular.utils import extend_schema
from rest_framework.permissions import  IsAdminUser, AllowAny
from rest_framework.viewsets import ModelViewSet

from apps.models import Branch
from serializers.product_serializers import BranchModelSerializer


@extend_schema(tags=['Branch'])
class BranchModelViewSet(ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchModelSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [AllowAny]
        return [AllowAny]
