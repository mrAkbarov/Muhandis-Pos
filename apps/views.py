from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.auth_serializers import RegisterModelSerializer, LoginModelSerializer
from apps.models import Product, Sale, Inventory, User
from apps.serializers import ProductSerializer, SaleSerializer, UserSerializer, InventorySerializer


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
    permission_classes = [IsAuthenticated]

    filter_backends = [SearchFilter]
    search_fields = ("product__name",)


class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]



@extend_schema(tags=['Auth'])
class RegisterModelViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = RegisterModelSerializer
    permission_classes = [AllowAny]
    http_method_names = ['get', 'post']


@extend_schema(tags=['Auth'])
class LoginAPIView(GenericAPIView):
    queryset = User.objects.all()
    serializer_class = LoginModelSerializer

    def post(self, request):
        serializer = self.serializer_class(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        return Response({
            'message': 'Login Successful',
            'user_id': user.id,
        })