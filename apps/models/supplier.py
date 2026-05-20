from django.db.models import Model, CharField, TextField, DateTimeField, ForeignKey, CASCADE, SET_NULL
from django.db.models.fields import DecimalField, PositiveIntegerField


class Supplier(Model):
    name = CharField(max_length=255)
    phone = CharField(max_length=20)
    address = TextField(blank=True)

    created_at = DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class PurchaseOrder(Model):
    supplier = ForeignKey("apps.Supplier", on_delete=CASCADE)
    branch = ForeignKey("apps.Branch", on_delete=CASCADE)

    total = DecimalField(max_digits=12, decimal_places=2, default=0)

    created_at = DateTimeField(auto_now_add=True)


class PurchaseItem(Model):
    purchase = ForeignKey("apps.PurchaseOrder", on_delete=CASCADE)
    product = ForeignKey("apps.Product", on_delete=SET_NULL, null=True)

    quantity = PositiveIntegerField()
    cost_price = DecimalField(max_digits=12, decimal_places=2)
