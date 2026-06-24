from django.conf import settings
from django.db.models import (
    CASCADE,
    SET_NULL,
    CharField,
    DecimalField,
    ForeignKey,
    PositiveIntegerField,
)

from apps.models.base import SupplierStatus, TimeStampedModel, branch_foreign_key
from apps.validators.phone import normalize_uz_phone


class Supplier(TimeStampedModel):
    """Diler (yetkazib beruvchi) — agent ma'lumotlari ham shu yerda saqlanadi."""

    branch = branch_foreign_key('suppliers', verbose_name='Filial')
    name = CharField(max_length=50, verbose_name='Diler nomi')
    phone = CharField(max_length=20, blank=True, verbose_name='Diler telefoni')
    address = CharField(max_length=100, blank=True, verbose_name='Manzil')
    agent_name = CharField(max_length=50, blank=True, verbose_name='Agent ismi')
    agent_phone = CharField(max_length=20, blank=True, verbose_name='Agent telefoni')
    total_orders = PositiveIntegerField(default=0, verbose_name='Jami buyurtmalar')
    status = CharField(
        max_length=50,
        choices=SupplierStatus.choices,
        default=SupplierStatus.ACTIVE,
        verbose_name='Holat',
    )

    class Meta:
        verbose_name = 'Diler'
        verbose_name_plural = 'Dilerlar'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.phone:
            self.phone = normalize_uz_phone(self.phone)
        if self.agent_phone:
            self.agent_phone = normalize_uz_phone(self.agent_phone)
        super().save(*args, **kwargs)


class SupplierCatalogItem(TimeStampedModel):
    """Diler katalogidagi mahsulot — zakaz/prixod orqali Product ga ulanadi."""

    supplier = ForeignKey(
        "apps.Supplier",
        CASCADE,
        related_name='catalog',
        verbose_name='Diler',
    )
    name = CharField(max_length=50, verbose_name='Mahsulot nomi')
    category = CharField(max_length=50, blank=True, verbose_name='Kategoriya')
    default_cost = DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='Kirim narxi')
    item_type = CharField(max_length=50, blank=True, verbose_name='Turi')
    size = CharField(max_length=50, blank=True, verbose_name='Hajm')
    unit = CharField(max_length=20, blank=True, default='ta', verbose_name='O\'lchov')
    barcode = CharField(max_length=50, blank=True, verbose_name='Shtrix-kod')
    product = ForeignKey(
        'apps.Product',
        SET_NULL,
        null=True,
        blank=True,
        related_name='supplier_catalog_items',
        verbose_name='Bog\'langan mahsulot',
    )

    class Meta:
        verbose_name = 'Diler katalog elementi'
        verbose_name_plural = 'Diler katalog elementlari'
        ordering = ['name']

    def __str__(self):
        return f'{self.supplier.name}: {self.name}'
