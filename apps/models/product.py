from django.db.models import ForeignKey, SET_NULL, DecimalField, BooleanField, DateTimeField, CharField, Model, \
    PositiveIntegerField, CASCADE, TextField


class Category(Model):
    name = CharField(max_length=255)

    def __str__(self):
        return self.name


class Product(Model):
    name = CharField(max_length=255)
    barcode = CharField(max_length=100, unique=True)

    category = ForeignKey("apps.Category", on_delete=SET_NULL, null=True)

    price = DecimalField(max_digits=12, decimal_places=2)
    cost_price = DecimalField(max_digits=12, decimal_places=2)

    is_active = BooleanField(default=True)
    is_draft = BooleanField(default=False)

    created_at = DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Inventory(Model):
    branch = ForeignKey("apps.Branch", on_delete=CASCADE)
    product = ForeignKey("apps.Product", on_delete=CASCADE)

    quantity = PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("branch", "product")


class StockMovement(Model):
    MOVEMENT_TYPES = (
        ("in", "IN"),
        ("out", "OUT"),
    )

    branch = ForeignKey("apps.Branch", on_delete=CASCADE)
    product = ForeignKey("apps.Product", on_delete=CASCADE)

    movement_type = CharField(max_length=10, choices=MOVEMENT_TYPES)
    quantity = PositiveIntegerField()

    note = TextField(blank=True)

    created_at = DateTimeField(auto_now_add=True)
