from django.db import models
from django.db.models import Model, CharField, ForeignKey, DecimalField, PositiveIntegerField, DateTimeField


class Category(Model):
    name = CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name


class Product(Model):
    name = CharField(max_length=255)
    barcode = CharField(max_length=50, unique=True)  # Shtrix-kod (Rasmda nom ostida turibdi)
    category = ForeignKey(Category, on_delete=PROTECT, related_name='products')

    selling_price = DecimalField(max_digits=12, decimal_places=2)  # Narx
    base_price = DecimalField(max_digits=12, decimal_places=2)  # Tannarx

    stock = PositiveIntegerField(default=0)  # Stock (Omborda)

    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


    @property
    def profit(self):
        return self.selling_price - self.base_price


    @property
    def status(self):
        if self.stock > 0:
            return "Yetarli"
        return "Tugagan"