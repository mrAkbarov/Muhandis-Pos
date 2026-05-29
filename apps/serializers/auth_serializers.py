import re

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework.exceptions import ValidationError
from rest_framework.fields import CharField
from rest_framework.serializers import ModelSerializer, Serializer

from apps.models import User

PHONE_REGEX = r'^\+998\d{9}$'


def validate_uzbek_phone(value: str):
    if not re.match(PHONE_REGEX, value):
        raise ValidationError("Telefon format noto‘g‘ri. Masalan: +998901234567")

    return value


class RegisterModelSerializer(ModelSerializer):
    password = CharField(write_only=True)
    confirm_password = CharField(write_only=True)

    class Meta:
        model = User
        fields = 'id', 'phone', 'email', 'first_name', 'last_name', 'branch', 'password', 'confirm_password',
        extra_kwargs = {
            'id': {'read_only': True},
            'password': {'write_only': True}
        }

    def validate_phone(self, value):
        validate_uzbek_phone(value)
        if User.objects.filter(phone=value).exists():
            raise ValidationError("Bu telefon raqam allaqachon mavjud")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')
        if password != confirm_password:
            raise ValidationError({'confirm_password': "Parollar mos emas"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        return User.objects.create_user(**validated_data)


class LoginModelSerializer(Serializer):
    phone = CharField()
    password = CharField(write_only=True)

    def validate(self, attrs):
        phone = attrs.get('phone')
        password = attrs.get('password')
        user = authenticate(
            request=self.context.get('request'),
            phone=phone,
            password=password
        )

        if not user:
            raise ValidationError("Telefon raqam yoki parol xato")

        if not user.is_active:
            raise ValidationError("Foydalanuvchi aktiv emas")
        attrs['user'] = user
        return attrs


