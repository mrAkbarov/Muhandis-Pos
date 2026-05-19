from django.db import models
from django.db.models import Model, CharField, TextField, DateTimeField


class Supplier(Model):

    name = CharField(max_length=255)
    phone = CharField(max_length=20)
    address = TextField(blank=True)

    created_at = DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name