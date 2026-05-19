from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.fields import SerializerMethodField
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer
from rest_framework.viewsets import ModelViewSet

from models import Product, Sale, Inventory, User
from serializers import ProductSerializer, SaleSerializer, UserSerializer


class ProductViewSet(ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ("name", "barcode")
    ordering_fields = ("created_at", "price")
    ordering = ("-created_at",)

    http_method_names = ("get", "post", "patch", "delete")


class SaleViewSet(ModelViewSet):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ("id",)
    ordering = ("-id",)

    http_method_names = ("get", "post")

    @action(detail=False, methods=["get"], url_path="my-sales")
    def my_sales(self, request):
        qs = self.get_queryset().filter(cashier=request.user)

        serializer = self.get_serializer(qs, many=True)

        return Response(serializer.data)


class InventoryViewSet(ModelViewSet):

    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]

    filter_backends = [SearchFilter]
    search_fields = ("product__name",)


class UserViewSet(ModelViewSet):

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]





