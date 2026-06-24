from django.db.models import (
    PROTECT,
    CharField,
    DecimalField,
    ForeignKey,
    ImageField,
    PositiveIntegerField,
    Q,
    UniqueConstraint,
)

from apps.models.base import TimeStampedModel, branch_foreign_key_nullable


class Category(TimeStampedModel):
    """Mahsulot kategoriyasi — Ichimliklar, Shirinliklar va hokazo."""

    name = CharField(max_length=50, unique=True, verbose_name='Kategoriya nomi')

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(TimeStampedModel):
    """Do'kon mahsuloti — narx, qoldiq, shtrix-kod, hajm."""

    name = CharField(max_length=50, verbose_name='Mahsulot nomi')
    barcode = CharField(max_length=14, blank=True, verbose_name='Shtrix-kod')
    category = ForeignKey(
        'apps.Category',
        PROTECT,
        related_name='products',
        verbose_name='Kategoriya',
    )
    branch = branch_foreign_key_nullable('products', verbose_name='Filial')
    selling_price = DecimalField(max_digits=12, decimal_places=2, verbose_name='Sotuv narxi')
    base_price = DecimalField(max_digits=12, decimal_places=2, verbose_name='Tannarx')
    emoji = CharField(max_length=16, blank=True, default='📦', verbose_name='Emoji')
    image = ImageField(upload_to='products/', blank=True, null=True, verbose_name='Rasm')
    size = CharField(max_length=50, blank=True, verbose_name="Hajm/og'irlik")
    unit = CharField(max_length=20, blank=True, default='dona', verbose_name="O'lchov birligi")
    stock = PositiveIntegerField(default=0, verbose_name='Umumiy qoldiq')

    class Meta:
        ordering = ['name']
        constraints = [
            UniqueConstraint(
                fields=['branch', 'barcode'],
                condition=Q(barcode__gt=''),
                name='unique_product_barcode_per_branch',
            ),
        ]

    def __str__(self):
        return self.name

    @property
    def profit(self):
        return self.selling_price - self.base_price

    @property
    def status(self):
        if self.stock > 0:
            return 'Yetarli'
        return 'Tugagan'
