from django.db.models import Model, CharField, TextField, DateTimeField


class Branch(Model):
    name = CharField(max_length=255)
    address = TextField()
    phone = CharField(max_length=20)

    created_at = DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
