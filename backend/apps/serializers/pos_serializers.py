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
    """Diler + agent ma'lumotlari — agent alohida jadval emas, shu yerda."""

    business_id = UUIDField(source='branch_id', read_only=True)
    catalog = SupplierCatalogItemSerializer(many=True, required=False)
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

    def create(self, validated_data):
        from decimal import Decimal

        from apps.services.catalog import register_catalog_item_as_product

        catalog_data = validated_data.pop('catalog', [])
        supplier = Supplier.objects.create(**validated_data)
        branch = supplier.branch
        for item in catalog_data:
            catalog_item = SupplierCatalogItem.objects.create(supplier=supplier, **item)
            cost = catalog_item.default_cost or Decimal('0')
            selling = (cost * Decimal('1.3')).quantize(Decimal('1')) if cost else Decimal('1000')
            register_catalog_item_as_product(
                catalog_item,
                branch,
                selling_price=selling,
                barcode=(catalog_item.barcode or '').strip() or None,
            )
        return supplier


class WarehouseSerializer(ModelSerializer):
    business_id = UUIDField(source='branch_id', read_only=True)

    class Meta:
        model = Warehouse
        fields = ['id', 'branch', 'business_id', 'name', 'created_at']
        read_only_fields = ['created_at']


class InventoryItemSerializer(ModelSerializer):
    product_id = IntegerField(read_only=True)
    warehouse_id = IntegerField(read_only=True)

    class Meta:
        model = InventoryItem
        fields = ['id', 'product', 'product_id', 'warehouse', 'warehouse_id', 'quantity', 'created_at']
        read_only_fields = ['created_at']


class SaleLineSerializer(ModelSerializer):
    class Meta:
        model = SaleLine
        fields = ['id', 'product_name', 'quantity', 'unit_price']


class PosCartDraftSerializer(ModelSerializer):
    """Kassa chernovigi — is_draft shu modelda (Product emas)."""

    business_id = UUIDField(source='branch_id', read_only=True)
    cashier_id = UUIDField(read_only=True)
    item_count = SerializerMethodField()

    class Meta:
        model = PosCartDraft
        fields = [
            'id',
            'branch',
            'business_id',
            'cashier',
            'cashier_id',
            'label',
            'pay_method',
            'items',
            'total',
            'item_count',
            'is_draft',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['cashier', 'cashier_id', 'created_at', 'updated_at']

    def get_item_count(self, obj):
        return sum(int(i.get('qty', 0)) for i in (obj.items or []))

    def validate_items(self, value):
        if not value:
            raise ValidationError("Savat bo'sh bo'lishi mumkin emas")
        return value

    def validate(self, attrs):
        from apps.services.stock import get_available_qty

        branch = attrs.get('branch')
        if not branch:
            return attrs
        for item in attrs.get('items') or []:
            pid = item.get('id')
            if pid is None:
                continue
            qty = int(item.get('qty') or 0)
            available = get_available_qty(branch.id, int(pid))
            if qty > available:
                name = item.get('name') or f'#{pid}'
                raise ValidationError(
                    {
                        'items': (
                            f'"{name}" uchun skladda faqat {available} ta mavjud '
                            f"({qty} ta saqlab bo'lmaydi — boshqa navbatda band)."
                        ),
                    }
                )
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request else None
        branch = validated_data['branch']
        if not validated_data.get('label'):
            n = PosCartDraft.objects.filter(branch=branch, cashier=user).count() + 1
            validated_data['label'] = f'Navbat #{n}'
        validated_data['cashier'] = user
        validated_data['is_draft'] = True
        return super().create(validated_data)


class SaleSerializer(ModelSerializer):
    lines = SaleLineSerializer(many=True, required=False)
    business_id = UUIDField(source='branch_id', read_only=True)
    pos_draft_id = IntegerField(required=False, allow_null=True, write_only=True)
    customer_name = CharField(required=False, allow_blank=True, write_only=True)
    customer_phone = UzPhoneField(required=False, allow_blank=True, write_only=True)
    credit_account_id = IntegerField(required=False, allow_null=True, write_only=True)
    create_new_credit_account = BooleanField(required=False, default=False, write_only=True)

    class Meta:
        model = Sale
        fields = [
            'id',
            'branch',
            'business_id',
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
            'pos_draft_id',
            'customer_name',
            'customer_phone',
            'credit_account_id',
            'create_new_credit_account',
            'created_at',
        ]
        read_only_fields = ['created_at']

    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        pos_draft_id = validated_data.pop('pos_draft_id', None)
        customer_name = (validated_data.pop('customer_name', '') or '').strip()
        customer_phone = validated_data.pop('customer_phone', '') or ''
        credit_account_id = validated_data.pop('credit_account_id', None)
        create_new_credit_account = validated_data.pop('create_new_credit_account', False)
        method = validated_data.get('method', 'Naqd')

        if method == 'Nasiya' and not credit_account_id and not customer_name:
            raise ValidationError({'customer_name': 'Nasiya uchun mijozni tanlang yoki ismini kiriting'})

        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['cashier'] = request.user
            if not validated_data.get('cashier_name'):
                validated_data['cashier_name'] = request.user.full_name or request.user.username

        sale = create_sale_with_stock(validated_data, lines_data, exclude_draft_id=pos_draft_id)

        if method == 'Nasiya':
            record_credit_charge(
                sale.branch,
                sale.amount,
                sale=sale,
                cashier_name=sale.cashier_name or '',
                account_id=credit_account_id,
                customer_name=customer_name,
                phone=customer_phone,
                force_new=bool(create_new_credit_account),
            )

        return sale


class CreditTransactionSerializer(ModelSerializer):
    sale_detail = SerializerMethodField()

    class Meta:
        model = CreditTransaction
        fields = ['id', 'kind', 'amount', 'note', 'cashier_name', 'created_at', 'sale', 'sale_detail']

    def get_sale_detail(self, obj):
        sale = obj.sale
        if not sale:
            return None
        return {
            'external_id': sale.external_id,
            'date': sale.date,
            'time': sale.time or '',
            'items': sale.items or [],
            'amount': sale.amount,
            'cashier_name': sale.cashier_name or '',
        }


class CreditAccountSerializer(ModelSerializer):
    business_id = UUIDField(source='branch_id', read_only=True)
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


class CreditPaymentSerializer(Serializer):
    amount = DecimalField(max_digits=14, decimal_places=2)
    note = CharField(required=False, allow_blank=True, default='')


class PurchaseOrderLineSerializer(ModelSerializer):
    product_id = IntegerField(allow_null=True, required=False)
    catalog_item_id = IntegerField(allow_null=True, required=False)

    class Meta:
        model = PurchaseOrderLine
        fields = [
            'id',
            'product',
            'product_id',
            'catalog_item',
            'catalog_item_id',
            'name',
            'quantity',
            'item_type',
            'size',
            'unit',
            'cost_price',
        ]


class PurchaseOrderSerializer(ModelSerializer):
    lines = PurchaseOrderLineSerializer(many=True, required=False)
    business_id = UUIDField(source='branch_id', read_only=True)
    supplier_id = IntegerField(allow_null=True, required=False)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id',
            'branch',
            'business_id',
            'external_id',
            'supplier',
            'supplier_id',
            'supplier_name',
            'date',
            'receipt_date',
            'total',
            'status',
            'lines',
            'created_at',
        ]
        read_only_fields = ['created_at']

    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        order = PurchaseOrder.objects.create(**validated_data)
        for line in lines_data:
            PurchaseOrderLine.objects.create(order=order, **line)
        return order


class PurchaseReceiveLineSerializer(Serializer):
    line_id = IntegerField()
    received_qty = IntegerField(min_value=0)
    damaged_qty = IntegerField(min_value=0, required=False, default=0)


class PurchaseReceiveSerializer(Serializer):
    warehouse = IntegerField()
    receipt_date = DateField(required=False)
    lines = PurchaseReceiveLineSerializer(many=True)


class AgentOrderSerializer(ModelSerializer):
    business_id = UUIDField(source='branch_id', read_only=True)
    supplier_id = IntegerField(read_only=True)

    class Meta:
        model = AgentOrder
        fields = [
            'id',
            'branch',
            'business_id',
            'supplier',
            'supplier_id',
            'agent_name',
            'customer_name',
            'items',
            'total',
            'date',
            'created_at',
        ]
        read_only_fields = ['created_at']

    def create(self, validated_data):
        supplier = validated_data.get('supplier')
        if supplier and not validated_data.get('agent_name'):
            validated_data['agent_name'] = supplier.agent_name or supplier.name
        return super().create(validated_data)


class UserStaffSerializer(ModelSerializer):
    name = CharField(source='full_name', read_only=True)
    phone = UzPhoneField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'name',
            'first_name',
            'last_name',
            'phone',
            'role',
            'is_active',
            'branch',
            'created_at',
        ]
        read_only_fields = fields


class StaffCreateSerializer(Serializer):
    username = CharField()
    password = CharField(write_only=True)
    name = CharField()
    role = ChoiceField(choices=['boss', 'manager', 'cashier'])
    phone = UzPhoneField(required=False, allow_blank=True)

    def validate_username(self, value):
        value = value.strip().lower()
        if User.objects.filter(username=value).exists():
            raise ValidationError('Bu login band')
        return value

    def create(self, validated_data):
        import random

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
            role=validated_data['role'],
            branch=branch,
        )
