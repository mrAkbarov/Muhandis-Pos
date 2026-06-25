from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.filters import OrderingFilter  # 7 va 9-mashqlar uchun ulandi

from apps.models import (
    AgentOrder,
    Category,
    CreditAccount,
    InventoryItem,
    PosCartDraft,
    PurchaseOrder,
    Sale,
    Supplier,
    SupplierCatalogItem,
    User,
    Warehouse,
)
from apps.models.base import PurchaseOrderStatus
from apps.permissions import IsAuthenticatedNotPlatformOwnerWriter, is_platform_owner
from apps.serializers.pos_serializers import (
    AgentOrderSerializer,
    CreditAccountSerializer,
    CreditPaymentSerializer,
    InventoryItemSerializer,
    PosCartDraftSerializer,
    PurchaseOrderSerializer,
    PurchaseReceiveSerializer,
    SaleSerializer,
    StaffCreateSerializer,
    SupplierCatalogItemSerializer,
    SupplierSerializer,
    UserStaffSerializer,
    WarehouseSerializer,
)
from apps.serializers.product_serializers import CategorySerializer, ProductSerializer
from apps.services.branch_access import filter_queryset_by_user_branch, user_has_global_branch_access
from apps.services.catalog import register_catalog_item_as_product
from apps.services.credit import record_credit_payment
from apps.services.purchase import receive_purchase_order

API_PERMISSIONS = [IsAuthenticated, IsAuthenticatedNotPlatformOwnerWriter]


class BranchScopedMixin:
    """Filial bo'yicha filtrlash — platform admin hammasini, do'kon xodimlari o'z filialini."""

    branch_field = 'branch'

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return qs.none()
        return filter_queryset_by_user_branch(qs, user, self.branch_field)


@extend_schema(tags=['Category'])
class CategoryViewSet(ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = API_PERMISSIONS
    search_fields = ['name']

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.order_by('name')


@extend_schema(tags=['Supplier'])
class SupplierViewSet(BranchScopedMixin, ModelViewSet):
    queryset = Supplier.objects.select_related('branch').prefetch_related('catalog').all()
    serializer_class = SupplierSerializer
    permission_classes = API_PERMISSIONS
    filterset_fields = ['branch', 'status']

    @extend_schema(
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'catalog_item_id': {'type': 'integer'},
                    'selling_price': {'type': 'number'},
                },
            }
        },
        responses=ProductSerializer,
    )
    @action(detail=True, methods=['post'], url_path='register-catalog-product')
    def register_catalog_product(self, request, pk=None):
        supplier = self.get_object()
        catalog_id = request.data.get('catalog_item_id')
        if not catalog_id:
            return Response({'detail': 'catalog_item_id kerak'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            catalog_item = supplier.catalog.get(pk=catalog_id)
        except SupplierCatalogItem.DoesNotExist:
            return Response({'detail': 'Katalog elementi topilmadi'}, status=status.HTTP_404_NOT_FOUND)

        already_linked = bool(catalog_item.product_id)
        product = register_catalog_item_as_product(
            catalog_item,
            supplier.branch,
            selling_price=request.data.get('selling_price'),
            barcode=request.data.get('barcode'),
        )
        return Response(
            ProductSerializer(product).data,
            status=status.HTTP_200_OK if already_linked else status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'], url_path='catalog', serializer_class=SupplierCatalogItemSerializer)
    def add_catalog_item(self, request, pk=None):
        from decimal import Decimal

        supplier = self.get_object()
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if not data.get('category'):
            data['category'] = data.get('category') or ''
        serializer = self.serializer_class(data=data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save(supplier=supplier)
        cost = item.default_cost or Decimal('0')
        selling = (cost * Decimal('1.3')).quantize(Decimal('1')) if cost else Decimal('1000')
        register_catalog_item_as_product(
            item,
            supplier.branch,
            selling_price=selling,
            barcode=(item.barcode or '').strip() or None,
        )
        item.refresh_from_db()
        return Response(self.serializer_class(item).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Warehouse'])
class WarehouseViewSet(BranchScopedMixin, ModelViewSet):
    queryset = Warehouse.objects.select_related('branch')
    serializer_class = WarehouseSerializer
    permission_classes = API_PERMISSIONS
    filterset_fields = ['branch']


@extend_schema(tags=['Inventory'])
class InventoryViewSet(ModelViewSet):
    queryset = InventoryItem.objects.select_related('product', 'warehouse')
    serializer_class = InventoryItemSerializer
    permission_classes = API_PERMISSIONS
    filterset_fields = ['warehouse', 'product']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return qs.none()

        branch_id = self.request.query_params.get('branch')
        if branch_id and user_has_global_branch_access(user):
            return qs.filter(warehouse__branch_id=branch_id)

        return filter_queryset_by_user_branch(qs, user, 'warehouse__branch')


MAX_POS_DRAFTS = 15


@extend_schema(tags=['POS'])
class PosCartDraftViewSet(BranchScopedMixin, ModelViewSet):
    queryset = PosCartDraft.objects.select_related('branch', 'cashier').filter(is_draft=True)
    serializer_class = PosCartDraftSerializer
    permission_classes = API_PERMISSIONS
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['branch']
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_admin:
            return qs
        return qs.filter(cashier=self.request.user)

    def perform_create(self, serializer):
        branch = serializer.validated_data['branch']

        count = PosCartDraft.objects.filter(branch=branch, cashier=self.request.user, is_draft=True).count()
        if count >= MAX_POS_DRAFTS:
            raise ValidationError({'detail': f"Eng ko'pi bilan {MAX_POS_DRAFTS} ta chernovik saqlash mumkin"})
        serializer.save(cashier=self.request.user, is_draft=True)


@extend_schema(tags=['Sale'])
class SaleViewSet(BranchScopedMixin, ModelViewSet):
    queryset = Sale.objects.select_related('branch', 'cashier').prefetch_related('lines')
    serializer_class = SaleSerializer
    permission_classes = API_PERMISSIONS
    filterset_fields = ['branch', 'date', 'method']
    search_fields = ['external_id', 'cashier_name']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == User.Role.CASHIER:
            from datetime import timedelta

            from django.db.models import Q
            from django.utils import timezone

            since = timezone.localdate() - timedelta(days=30)
            qs = qs.filter(date__gte=since)
            legacy_name = (user.full_name or user.first_name or user.username or '').strip()
            name_q = Q(cashier=user)
            if legacy_name:
                name_q |= Q(cashier__isnull=True, cashier_name__icontains=legacy_name)
            if user.first_name:
                name_q |= Q(cashier__isnull=True, cashier_name__icontains=user.first_name)
            qs = qs.filter(name_q)
        return qs.order_by('-date', '-time', '-external_id')


@extend_schema(tags=['Purchase'])
class PurchaseOrderViewSet(BranchScopedMixin, ModelViewSet):
    queryset = PurchaseOrder.objects.select_related('supplier', 'branch').prefetch_related('lines')
    serializer_class = PurchaseOrderSerializer
    permission_classes = API_PERMISSIONS
    filterset_fields = ['branch', 'status', 'supplier']

    @extend_schema(request=PurchaseReceiveSerializer, responses=PurchaseOrderSerializer)
    @action(detail=True, methods=['post'], url_path='receive')
    def receive(self, request, pk=None):
        order = self.get_object()
        if order.status == PurchaseOrderStatus.DELIVERED:
            return Response({'detail': 'Buyurtma allaqachon qabul qilingan'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = PurchaseReceiveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            warehouse = Warehouse.objects.get(pk=data['warehouse'])
        except Warehouse.DoesNotExist:
            return Response({'detail': 'Sklad topilmadi'}, status=status.HTTP_404_NOT_FOUND)

        receive_purchase_order(order, warehouse, data.get('receipt_date'), data['lines'])
        order.refresh_from_db()
        return Response(PurchaseOrderSerializer(order).data)


@extend_schema(tags=['Agent order'])
class AgentOrderViewSet(BranchScopedMixin, ModelViewSet):
    queryset = AgentOrder.objects.select_related('supplier', 'branch')
    serializer_class = AgentOrderSerializer
    permission_classes = API_PERMISSIONS
    filterset_fields = ['branch', 'supplier']


@extend_schema(tags=['Credit'])
class CreditAccountViewSet(BranchScopedMixin, ModelViewSet):
    queryset = CreditAccount.objects.select_related('branch').prefetch_related('transactions')
    serializer_class = CreditAccountSerializer
    permission_classes = API_PERMISSIONS


    filter_backends = [DjangoFilterBackend, OrderingFilter]

    # phone filtri va search_fields ga telefon raqam qo'shildi
    filterset_fields = ['branch', 'phone']
    search_fields = ['customer_name', 'phone']
    http_method_names = ['get', 'head', 'options', 'post']

    # balance va created_at bo'yicha saralash
    ordering_fields = ['balance', 'created_at', 'customer_name']

    # eng oxirgi olingan qarzdor
    ordering = ['-created_at']

    def get_queryset(self):
        return super().get_queryset().filter(balance__gt=0)

    @extend_schema(request=CreditPaymentSerializer, responses=CreditAccountSerializer)
    @action(detail=True, methods=['post'], url_path='pay')
    def pay(self, request, pk=None):
        account = self.get_object()
        serializer = CreditPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cashier = request.user.full_name or request.user.username
        record_credit_payment(
            account,
            serializer.validated_data['amount'],
            cashier_name=cashier,
            note=serializer.validated_data.get('note', ''),
        )
        account.refresh_from_db()
        return Response(CreditAccountSerializer(account).data)


@extend_schema(tags=['Staff'])
class UserStaffViewSet(ModelViewSet):
    queryset = User.objects.select_related('branch')
    serializer_class = UserStaffSerializer
    permission_classes = API_PERMISSIONS
    http_method_names = ['get', 'head', 'options']
    filterset_fields = ['role', 'branch', 'is_active']

    def get_queryset(self):
        from apps.services.branch_access import filter_queryset_by_user_branch

        return filter_queryset_by_user_branch(
            User.objects.select_related('branch').all(),
            self.request.user,
        )


@extend_schema(tags=['Staff'])
class StaffCreateAPIView(GenericAPIView):
    serializer_class = StaffCreateSerializer
    permission_classes = API_PERMISSIONS

    def post(self, request):
        if is_platform_owner(request.user):
            return Response(
                {'detail': "Platform egasi faqat ko'ruvchi rejimda"},
                status=status.HTTP_403_FORBIDDEN,
            )
        if request.user.role not in (User.Role.ADMIN, User.Role.BOSS):
            return Response(
                {'detail': "Faqat admin yoki boss xodim qo'sha oladi"},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserStaffSerializer(user).data, status=status.HTTP_201_CREATED)