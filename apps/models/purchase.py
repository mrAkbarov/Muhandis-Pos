from django.db.models import Model, ForeignKey, CASCADE, DecimalField, DateTimeField, SET_NULL, PositiveIntegerField


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
