from django.db.models import (
    CASCADE,
    SET_NULL,
    CharField,
    DateField,
    DecimalField,
    ForeignKey,
    PositiveIntegerField,
)

from apps.models.base import PurchaseOrderStatus, TimeStampedModel, branch_foreign_key, supplier_foreign_key


class PurchaseOrder(TimeStampedModel):
    """Dilerdan kelgan buyurtma — prixod qabul qilinguncha kutiladi."""

    branch = branch_foreign_key('purchase_orders', verbose_name='Filial')
    external_id = CharField(max_length=50, unique=True, verbose_name='Buyurtma raqami')
    supplier = supplier_foreign_key('orders', verbose_name='Diler')
    supplier_name = CharField(max_length=50, blank=True, verbose_name='Diler nomi (nusxa)')
    date = DateField(verbose_name='Buyurtma sanasi')
    receipt_date = DateField(null=True, blank=True, verbose_name='Qabul qilingan sana')
    total = DecimalField(max_digits=14, decimal_places=2, default=0, verbose_name='Jami summa')
    status = CharField(
        max_length=50, choices=PurchaseOrderStatus.choices, default=PurchaseOrderStatus.PENDING, verbose_name='Holat'
    )

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return self.external_id


class PurchaseOrderLine(TimeStampedModel):
    """Buyurtma qatori — mahsulot, miqdor, hajm."""

    order = ForeignKey('apps.PurchaseOrder', CASCADE, related_name='lines', verbose_name='Buyurtma')
    product = ForeignKey('apps.Product', SET_NULL, null=True, blank=True, verbose_name='Mahsulot')
    name = CharField(max_length=50, verbose_name='Nomi')
    quantity = PositiveIntegerField(verbose_name='Miqdor')
    item_type = CharField(max_length=50, blank=True, verbose_name='Turi')
    size = CharField(max_length=50, blank=True, verbose_name='Hajm')
    unit = CharField(max_length=20, blank=True, verbose_name="O'lchov")
    cost_price = DecimalField(max_digits=12, decimal_places=2, verbose_name='Narx')
    catalog_item = ForeignKey(
        'apps.SupplierCatalogItem',
        SET_NULL,
        null=True,
        blank=True,
        related_name='order_lines',
        verbose_name='Katalog elementi',
    )


    def __str__(self):
        return f'{self.name} x{self.quantity}'
