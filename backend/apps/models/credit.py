from django.db.models import (
    CASCADE,
    SET_NULL,
    CharField,
    DecimalField,
    ForeignKey,
    Q,
    TextChoices,
    UniqueConstraint,
)

from apps.models.base import TimeStampedModel, branch_foreign_key
from apps.validators.phone import normalize_uz_phone


class CreditAccount(TimeStampedModel):
    """
    Qarzdor mijoz — alohida Customer jadvali yo'q.
    Nasiya sotuv, qoldiq va to'lovlar shu yerda.
    """

    branch = branch_foreign_key('credit_accounts', verbose_name='Filial')
    customer_name = CharField(max_length=50, verbose_name='Mijoz ismi')
    phone = CharField(max_length=20, blank=True, verbose_name='Telefon')
    balance = DecimalField(max_digits=14, decimal_places=2, default=0, verbose_name="Qarz qoldig'i")

    class Meta:
        verbose_name = 'Qarzdor mijoz'
        verbose_name_plural = 'Qarzdor mijozlar'
        ordering = ['customer_name']
        constraints = [
            UniqueConstraint(
                fields=['branch', 'phone'],
                condition=Q(phone__gt=''),
                name='unique_branch_phone_when_set',
            ),
        ]

    def __str__(self):
        return f'{self.customer_name} ({self.balance})'

    def save(self, *args, **kwargs):
        if self.phone:
            self.phone = normalize_uz_phone(self.phone)
        super().save(*args, **kwargs)


class CreditTransaction(TimeStampedModel):
    """Qarz harakati — sotuv (charge) yoki to'lov (payment)."""

    class Kind(TextChoices):
        CHARGE = 'charge', 'Qarz (sotuv)'
        PAYMENT = 'payment', "To'lov"

    account = ForeignKey(
        'apps.CreditAccount',
        CASCADE,
        related_name='transactions',
        verbose_name='Qarz hisobi',
    )
    kind = CharField(max_length=20, choices=Kind.choices, verbose_name='Turi')
    amount = DecimalField(max_digits=14, decimal_places=2, verbose_name='Summa')
    note = CharField(max_length=20, blank=True, verbose_name='Izoh')
    sale = ForeignKey(
        "apps.Sale",
        SET_NULL,
        null=True,
        blank=True,
        related_name='credit_transactions',
        verbose_name="Bog'langan sotuv",
    )
    cashier_name = CharField(max_length=30, blank=True, verbose_name='Kassir ismi')

    class Meta:
        verbose_name = 'Qarz harakati'
        verbose_name_plural = 'Qarz harakatlari'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.account.customer_name} — {self.kind} — {self.amount}'