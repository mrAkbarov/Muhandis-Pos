from django.conf import settings
from django.db.models import (
    CASCADE,
    SET_NULL,
    BooleanField,
    CharField,
    DateField,
    DecimalField,
    ForeignKey,
    JSONField,
    PositiveIntegerField,
)

from apps.models.base import TimeStampedModel, branch_foreign_key


class Sale(TimeStampedModel):
    """Kassa sotuvi — chek, to'lov usuli, kassir."""

    branch = branch_foreign_key('sales', verbose_name='Filial')
    external_id = CharField(max_length=50, unique=True, verbose_name='Chek raqami')
    date = DateField(verbose_name='Sana')
    time = CharField(max_length=10, blank=True, verbose_name='Vaqt')
    amount = DecimalField(max_digits=14, decimal_places=2, verbose_name='Jami summa')
    method = CharField(max_length=50, default='Naqd', verbose_name="To'lov usuli")
    payment_breakdown = JSONField(default=dict, blank=True, verbose_name="Aralash to'lov (Naqd/Karta/Online)")
    cashier = ForeignKey('apps.User', SET_NULL, null=True, blank=True, related_name='sales', verbose_name='Kassir')
    cashier_name = CharField(max_length=50, blank=True, verbose_name='Kassir ismi')
    items = JSONField(default=list, verbose_name='Savat (JSON)')

    class Meta:
        ordering = ['-date', '-external_id']

    def __str__(self):
        return self.external_id


class SaleLine(TimeStampedModel):
    """Sotuv qatori — mahsulot nomi, miqdor, narx."""

    sale = ForeignKey('apps.Sale', CASCADE, related_name='lines', verbose_name='Sotuv')
    product_name = CharField(max_length=50, verbose_name='Mahsulot nomi')
    quantity = PositiveIntegerField(verbose_name='Miqdor')
    unit_price = DecimalField(max_digits=12, decimal_places=2, verbose_name='Birlik narxi')


class PosCartDraft(TimeStampedModel):
    """Kassa chernovigi — mijoz ketganda savat vaqtincha saqlanadi (is_draft mantiq shu yerda)."""

    branch = branch_foreign_key('pos_cart_drafts', verbose_name='Filial')
    cashier = ForeignKey('apps.User', settings.ON_DELETE_CASCADE, related_name='pos_cart_drafts', verbose_name='Kassir')
    label = CharField(max_length=120, verbose_name='Navbat nomi')
    pay_method = CharField(max_length=50, default='Naqd', verbose_name="To'lov usuli")
    items = JSONField(default=list, verbose_name='Savat elementlari')
    total = DecimalField(max_digits=14, decimal_places=2, default=0, verbose_name='Jami')
    is_draft = BooleanField(default=True, verbose_name='Chernovik')

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.label} ({self.branch_id})'
