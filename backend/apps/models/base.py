import uuid

from django.conf import settings
from django.db.models import (
    DateTimeField,
    ForeignKey,
    Model,
    TextChoices,
    UUIDField,
)
from django.utils import timezone


class SupplierStatus(TextChoices):
    """Diler holati."""
    ACTIVE = 'Faol', 'Faol'
    INACTIVE = 'Nofaol', 'Nofaol'


class PurchaseOrderStatus(TextChoices):
    """Diler buyurtmasi holati."""
    PENDING = 'Kutilmoqda', 'Kutilmoqda'
    IN_TRANSIT = 'Yetkazilyapti', 'Yetkazilyapti'
    DELIVERED = 'Yetkazilgan', 'Yetkazilgan'


class TimeStampedModel(Model):
    """created_at / updated_at — qachon yaratilgan va o'zgartirilganini saqlash."""

    created_at = DateTimeField(
        default=timezone.now,
        editable=False,
        verbose_name='Yaratilgan vaqt',
    )
    updated_at = DateTimeField(auto_now=True, verbose_name='Yangilangan vaqt')

    class Meta:
        abstract = True


class UUIDPrimaryKeyModel(Model):
    """UUID asosiy kalit — Branch va User uchun alohida."""

    id = UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name='UUID identifikator',
    )

    class Meta:
        abstract = True


def branch_foreign_key(related_name: str, **kwargs):
    """Filial bog'lanishi — on_delete settings.py dan."""
    return ForeignKey(
        'apps.Branch',
        settings.ON_DELETE_CASCADE,
        related_name=related_name,
        **kwargs,
    )


def branch_foreign_key_nullable(related_name: str, **kwargs):
    """Filial ixtiyoriy bog'lanish."""
    extra = {'null': True, 'blank': True}
    extra.update(kwargs)
    return ForeignKey(
        'apps.Branch',
        settings.ON_DELETE_SET_NULL,
        related_name=related_name,
        **extra,
    )


def supplier_foreign_key(related_name: str, **kwargs):
    """Diler bog'lanishi."""
    extra = {'null': True, 'blank': True}
    extra.update(kwargs)
    return ForeignKey(
        'apps.Supplier',
        settings.ON_DELETE_SET_NULL,
        related_name=related_name,
        **extra,
    )
