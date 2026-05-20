from django.db.models import Model, CharField, ForeignKey, SET_NULL, DecimalField, BooleanField, DateTimeField


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

    created_at = DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
