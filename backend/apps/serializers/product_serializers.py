from rest_framework.serializers import (
    CharField,
    DecimalField,
    ModelSerializer,
    SerializerMethodField,
    SlugRelatedField,
    UUIDField,
    ValidationError,
)

from apps.models import (
    Branch,
    Category,
    Product,
)
from apps.serializers.fields import UzPhoneField


class CategorySerializer(ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'created_at']
        read_only_fields = ['created_at']


class ProductSerializer(ModelSerializer):
    """Mahsulot API — is_draft Product da emas, faqat PosCartDraft da."""

    category = SlugRelatedField(
        slug_field='name',
        queryset=Category.objects.all(),
    )
    category_name = CharField(source='category.name', read_only=True)
    price = DecimalField(
        source='selling_price',
        max_digits=12,
        decimal_places=2,
        required=False,
    )
    cost = DecimalField(
        source='base_price',
        max_digits=12,
        decimal_places=2,
        required=False,
    )
    profit = SerializerMethodField()
    status = SerializerMethodField()
    business_id = UUIDField(source='branch_id', read_only=True, allow_null=True)
    image_url = SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'barcode',
            'category',
            'category_name',
            'branch',
            'business_id',
            'selling_price',
            'base_price',
            'price',
            'cost',
            'emoji',
            'image',
            'image_url',
            'size',
            'unit',
            'profit',
            'stock',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ('created_at', 'updated_at', 'image', 'image_url')

    def validate_barcode(self, value):
        return (value or '').strip()

    def validate(self, attrs):
        attrs = super().validate(attrs)
        barcode = attrs.get('barcode')
        if barcode is None and self.instance:
            barcode = self.instance.barcode
        barcode = (barcode or '').strip()
        attrs['barcode'] = barcode

        branch = attrs.get('branch')
        if branch is None and self.instance:
            branch = self.instance.branch

        if barcode and branch:
            qs = Product.objects.filter(branch=branch, barcode=barcode)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise ValidationError(
                    {
                        'barcode': 'Bu shtrix-kod shu magazinda allaqachon boshqa mahsulotda mavjud.',
                    }
                )
        return attrs

    def get_image_url(self, obj):
        if not obj.image:
            return ''
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url

    def get_profit(self, obj):
        return obj.profit

    def get_status(self, obj):
        return obj.status


class BranchModelSerializer(ModelSerializer):
    phone = UzPhoneField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Branch
        fields = ('id', 'name', 'address', 'phone', 'created_at', 'updated_at')
        extra_kwargs = {
            'id': {'read_only': True},
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True},
        }
