from django.conf import settings
from django.db.models import CharField, ForeignKey, PositiveIntegerField, UniqueConstraint

from apps.models.base import TimeStampedModel, branch_foreign_key


class Warehouse(TimeStampedModel):
    """Ombor / sklad — filial ichidagi saqlash joyi."""

    branch = branch_foreign_key('warehouses', verbose_name='Filial')
    name = CharField(max_length=50, verbose_name='Ombor nomi')

    class Meta:
        verbose_name = 'Ombor'
        verbose_name_plural = 'Omborlar'
        ordering = ['name']

    def __str__(self):
        return self.name


class InventoryItem(TimeStampedModel):
    """Mahsulot qoldig'i — ombor bo'yicha."""

    product = ForeignKey(
        'apps.Product',
        settings.ON_DELETE_CASCADE,
        related_name='inventory_items',
        verbose_name='Mahsulot',
    )
    warehouse = ForeignKey(
        Warehouse,
        settings.ON_DELETE_CASCADE,
        related_name='items',
        verbose_name='Ombor',
    )
    quantity = PositiveIntegerField(default=0, verbose_name='Miqdor')

    class Meta:
        verbose_name = 'Ombor qoldig\'i'
        verbose_name_plural = 'Ombor qoldiqlari'
        constraints = [
            UniqueConstraint(
                fields=['product', 'warehouse'],
                name='unique_product_per_warehouse',
            ),
        ]

    def __str__(self):
        return f'{self.product.name} @ {self.warehouse.name}: {self.quantity}'
