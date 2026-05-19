from django.db import models
from django.db.models import Model, ForeignKey, CASCADE, CharField, TextField, BooleanField, DateTimeField


class Notification(Model):

    user = ForeignKey("apps.User", on_delete=CASCADE)

    title = CharField(max_length=255)
    message = TextField()

    is_read = BooleanField(default=False)

    created_at = DateTimeField(auto_now_add=True)