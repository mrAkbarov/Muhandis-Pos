import random
from rest_framework.serializers import (
    BooleanField,
    CharField,
    ChoiceField,
    DateField,
    DecimalField,
    IntegerField,
    ModelSerializer,
    Serializer,
    SerializerMethodField,
    UUIDField,
    ValidationError,
)

from apps.models import (
    AgentOrder,
    CreditAccount,
    CreditTransaction,
    InventoryItem,
    PosCartDraft,
    PurchaseOrder,
    PurchaseOrderLine,
    Sale,
    SaleLine,
    Supplier,
    SupplierCatalogItem,
    User,
    Warehouse,
)
from apps.serializers.fields import UzPhoneField
from apps.services.credit import record_credit_charge
from apps.services.sale import create_sale_with_stock


class SupplierCatalogItemSerializer(ModelSerializer):
    """Diler katalogidagi bitta mahsulot — hajm va shtrix-kod shu yerda."""

    product_id = IntegerField(read_only=True, allow_null=True)
    default_cost = DecimalField(max_digits=12, decimal_places=2, required=False)

    class Meta:
        model = SupplierCatalogItem
        fields = [
            'id',
            'name',
            'category',
            'default_cost',
            'item_type',
            'size',
            'unit',
            'barcode',
            'product',
            'product_id',
            'created_at',
        ]
        read_only_fields = ['product', 'product_id', 'created_at']


class SupplierSerializer(ModelSerializer):
    """Diler + agent ma'lumotlari — agent alohida."""

    catalog = SupplierCatalogItemSerializer(many=True, read_only=True)
    business_id = UUIDField(source='branch_id', read_only=True, allow_null=True)
    phone = UzPhoneField(required=False, allow_blank=True)
    agent_phone = UzPhoneField(required=False, allow_blank=True)

    class Meta:
        model = Supplier
        fields = [
            'id',
            'branch',
            'business_id',
            'name',
            'phone',
            'address',
            'agent_name',
            'agent_phone',
            'total_orders',
            'status',
            'catalog',
            'created_at',
        ]
        read_only_fields = ['total_orders', 'created_at']


class WarehouseSerializer(ModelSerializer):
    business_id = UUIDField(source='branch_id', read_only=True, allow_null=True)

    class Meta:
        model = Warehouse
        fields = ['id', 'branch', 'business_id', 'name', 'created_at']
        read_only_fields = ['created_at']


class InventoryItemSerializer(ModelSerializer):
    product_name = CharField(source='product.name', read_only=True)
    barcode = CharField(source='product.barcode', read_only=True)
    selling_price = DecimalField(source='product.selling_price', max_digits=12, decimal_places=2, read_only=True)
    warehouse_name = CharField(source='warehouse.name', read_only=True)

    class Meta:
        model = InventoryItem
        fields = [
            'id',
            'product',
            'product_name',
            'barcode',
            'selling_price',
            'warehouse',
            'warehouse_name',
            'quantity',
            'created_at',
        ]
        read_only_fields = ['created_at']


class PosCartDraftSerializer(ModelSerializer):
    cashier_name = CharField(source='cashier.username', read_only=True)

    class Meta:
        model = PosCartDraft
        fields = [
            'id',
            'branch',
            'cashier',
            'cashier_name',
            'label',
            'pay_method',
            'items',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['cashier', 'created_at', 'updated_at']


class SaleLineSerializer(ModelSerializer):
    class Meta:
        model = SaleLine
        fields = ['id', 'product_name', 'quantity', 'unit_price']


class SaleSerializer(ModelSerializer):
    lines = SaleLineSerializer(many=True, required=False)
    draft_id = CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Sale
        fields = [
            'id',
            'branch',
            'external_id',
            'date',
            'time',
            'amount',
            'method',
            'payment_breakdown',
            'cashier',
            'cashier_name',
            'items',
            'lines',
            'draft_id',
            'created_at',
        ]
        read_only_fields = ['cashier_name', 'created_at']

    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        draft_id = validated_data.pop('draft_id', None)

        request = self.context.get('request')
        user = getattr(request, 'user', None)

        sale = create_sale_with_stock(validated_data, lines_data, user=user, draft_id=draft_id)
        return sale


class PurchaseOrderLineSerializer(ModelSerializer):
    class Meta:
        model = PurchaseOrderLine
        fields = [
            'id',
            'product',
            'name',
            'quantity',
            'item_type',
            'size',
            'unit',
            'cost_price',
        ]


class PurchaseOrderSerializer(ModelSerializer):
    lines = PurchaseOrderLineSerializer(many=True, read_only=True)
    supplier_display_name = CharField(source='supplier.name', read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id',
            'branch',
            'external_id',
            'supplier',
            'supplier_name',
            'supplier_display_name',
            'date',
            'receipt_date',
            'total',
            'status',
            'lines',
            'created_at',
        ]
        read_only_fields = ['created_at']


class PurchaseReceiveLineSerializer(Serializer):
    line_id = IntegerField()
    quantity_received = IntegerField(min_value=0)


class PurchaseReceiveSerializer(Serializer):
    warehouse = IntegerField()
    receipt_date = DateField(required=False, allow_null=True)
    lines = PurchaseReceiveLineSerializer(many=True)


class AgentOrderSerializer(ModelSerializer):
    supplier_name = CharField(source='supplier.name', read_only=True)

    class Meta:
        model = AgentOrder
        fields = [
            'id',
            'branch',
            'supplier',
            'supplier_name',
            'agent_name',
            'customer_name',
            'items',
            'total',
            'date',
            'created_at',
        ]
        read_only_fields = ['created_at']


class CreditTransactionSerializer(ModelSerializer):
    class Meta:
        model = CreditTransaction
        fields = [
            'id',
            'kind',
            'amount',
            'note',
            'sale',
            'cashier_name',
            'created_at',
        ]


class CreditAccountSerializer(ModelSerializer):
    business_id = UUIDField(source='branch_id', read_only=True, allow_null=True)
    transactions = CreditTransactionSerializer(many=True, read_only=True)
    phone = UzPhoneField(required=False, allow_blank=True)

    class Meta:
        model = CreditAccount
        fields = [
            'id',
            'branch',
            'business_id',
            'customer_name',
            'phone',
            'balance',
            'transactions',
            'created_at',
        ]
        read_only_fields = ['balance', 'created_at']

    def validate(self, attrs):
        """Bitta filial ichida bir xil telefon raqamli
        qarzdor takroriy ochilishini tekshirish.
        """
        branch = attrs.get('branch')
        phone = attrs.get('phone')

        if phone and branch:
            from apps.validators.phone import normalize_uz_phone
            try:
                normalized_phone = normalize_uz_phone(phone)
            except Exception:
                normalized_phone = phone

            qs = CreditAccount.objects.filter(branch=branch, phone=normalized_phone)

            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)

            if qs.exists():
                raise ValidationError(
                    {'phone': "Ushbu filialda bu telefon raqamli qarzdor mijoz allaqachon mavjud!"}
                )

        return attrs


class CreditPaymentSerializer(Serializer):
    amount = DecimalField(max_digits=14, decimal_places=2, min_value=0.01)
    note = CharField(max_length=20, required=False, allow_blank=True)


class UserStaffSerializer(ModelSerializer):
    branch_name = CharField(source='branch.name', read_only=True, allow_null=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'phone',
            'first_name',
            'last_name',
            'role',
            'branch',
            'branch_name',
            'is_active',
            'created_at',
        ]


class StaffCreateSerializer(Serializer):
    username = CharField(max_length=150)
    password = CharField(write_only=True)
    name = CharField(max_length=150)
    phone = UzPhoneField(required=False, allow_blank=True)
    role = ChoiceField(choices=[('manager', 'Manager'), ('cashier', 'Cashier'), ('admin', 'Admin')])

    def validate_username(self, value):
        value = value.strip().lower()
        if User.objects.filter(username=value).exists():
            raise ValidationError('Bu login band')
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        creator = getattr(request, 'user', None)

        name = validated_data.pop('name').strip()
        parts = name.split(' ', 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else '—'
        phone = validated_data.pop('phone', '') or ''
        if not phone:
            phone = f'901{random.randint(100000, 999999)}'
            while User.objects.filter(phone=phone).exists():
                phone = f'901{random.randint(100000, 999999)}'

        branch = None
        role = validated_data['role']
        if role in ('manager', 'cashier', 'admin'):
            if creator and creator.branch_id:
                branch = creator.branch
            elif creator and creator.role in (User.Role.ADMIN, User.Role.BOSS) and not creator.branch_id:
                raise ValidationError(
                    {
                        'branch': "Platform admin xodim qo'shish uchun avval filialni tanlang",
                    }
                )
            else:
                raise ValidationError(
                    {
                        'branch': 'Xodim filialga biriktirilmagan',
                    }
                )

        return User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role=role,
            branch=branch,
        )