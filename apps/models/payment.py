from django.db.models import Model, ForeignKey, CASCADE, DecimalField, CharField, DateTimeField


class Payment(Model):
    sale = ForeignKey("apps.Sale", on_delete=CASCADE)

    amount = DecimalField(max_digits=12, decimal_places=2)

    method = CharField(max_length=50)

    created_at = DateTimeField(auto_now_add=True)
