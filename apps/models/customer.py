from django.db import models
from django.db.models import Model, CharField, DecimalField, DateTimeField


class Customer(Model):

    full_name = CharField(max_length=255)
    phone = CharField(max_length=20, unique=True)

    balance = DecimalField(max_digits=12, decimal_places=2, default=0)

    created_at = DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name