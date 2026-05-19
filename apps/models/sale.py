from django.db import models
from django.db.models import Model, ForeignKey, CASCADE, SET_NULL, DecimalField, CharField, DateTimeField, \
    PositiveIntegerField


class Sale(Model):

    PAYMENT_METHODS = (
        ("cash", "Cash"),
        ("card", "Card"),
        ("mixed", "Mixed"),
    )

    branch = ForeignKey("apps.Branch", on_delete=CASCADE)
    cashier = ForeignKey("apps.User", on_delete=SET_NULL, null=True)
    customer = ForeignKey("apps.Customer", on_delete=SET_NULL, null=True, blank=True)

    subtotal = DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = DecimalField(max_digits=12, decimal_places=2, default=0)
    total = DecimalField(max_digits=12, decimal_places=2, default=0)

    payment_method = CharField(max_length=20, choices=PAYMENT_METHODS)

    created_at = DateTimeField(auto_now_add=True)


class SaleItem(Model):

    sale = ForeignKey("apps.Sale", on_delete=CASCADE)

    product = ForeignKey("apps.Product", on_delete=SET_NULL, null=True)

    quantity = PositiveIntegerField()
    price = DecimalField(max_digits=12, decimal_places=2)
    total = DecimalField(max_digits=12, decimal_places=2)