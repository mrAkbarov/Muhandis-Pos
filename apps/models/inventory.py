from django.db.models import Model, ForeignKey, CASCADE, PositiveIntegerField, CharField, TextField, DateTimeField


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
