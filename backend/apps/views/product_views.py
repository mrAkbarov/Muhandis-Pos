from django.db.models import Sum
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.filter import ProductFilter
from apps.models import InventoryItem, Product
from apps.serializers.product_serializers import ProductSerializer
from apps.services.product_image import save_product_image_as_webp
from apps.views.pos_views import API_PERMISSIONS, BranchScopedMixin


@extend_schema(tags=['Product'])
class ProductViewSet(BranchScopedMixin, ModelViewSet):
    queryset = Product.objects.select_related('category', 'branch')
    serializer_class = ProductSerializer
    permission_classes = API_PERMISSIONS
    filterset_class = ProductFilter
    search_fields = ['name', 'barcode', 'category__name']
    ordering_fields = ['selling_price', 'cost_price', 'profit', 'stock']
    ordering = ['-id']

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        inv_total = InventoryItem.objects.filter(product=product).aggregate(total=Sum('quantity'))['total'] or 0
        if inv_total != 0:
            return Response(
                {'detail': "Faqat qoldiqi 0 ta bo'lgan mahsulotni o'chirish mumkin"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

    @extend_schema(
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'image': {'type': 'string', 'format': 'binary'},
                },
            }
        },
        responses=ProductSerializer,
    )
    @action(detail=True, methods=['post'], url_path='upload-image', parser_classes=[MultiPartParser, FormParser])
    def upload_image(self, request, pk=None):
        product = self.get_object()
        uploaded = request.FILES.get('image')
        if not uploaded:
            return Response({'detail': 'Rasm fayli kerak'}, status=status.HTTP_400_BAD_REQUEST)
        save_product_image_as_webp(product, uploaded)
        return Response(ProductSerializer(product, context={'request': request}).data)
