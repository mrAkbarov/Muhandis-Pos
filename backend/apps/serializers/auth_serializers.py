from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework.exceptions import ValidationError
from rest_framework.fields import CharField
from rest_framework.serializers import ModelSerializer, Serializer

from apps.models import User
from apps.serializers.fields import UzPhoneField


class RegisterModelSerializer(ModelSerializer):
    """Ro'yxatdan o'tish — telefon +998 formatda saqlanadi."""

    password = CharField(write_only=True)
    confirm_password = CharField(write_only=True)
    phone = UzPhoneField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'phone', 'first_name', 'last_name',
            'role', 'branch', 'password', 'confirm_password',
        )
        extra_kwargs = {
            'id': {'read_only': True},
            'password': {'write_only': True},
        }

    def validate_username(self, value):
        value = value.strip().lower()
        if User.objects.filter(username=value).exists():
            raise ValidationError('Bu login band')
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')
        if password != confirm_password:
            raise ValidationError({'confirm_password': 'Parollar mos emas'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        return User.objects.create_user(**validated_data)


class LoginModelSerializer(Serializer):
    """Login — username yoki telefon orqali."""

    username = CharField(required=False)
    phone = UzPhoneField(required=False, allow_blank=True)
    password = CharField(write_only=True)

    def validate(self, attrs):
        if attrs.get('username'):
            attrs['username'] = attrs['username'].strip().lower()

        password = attrs.get('password')
        login_id = attrs.get('username') or attrs.get('phone')
        if not login_id:
            raise ValidationError('Login (username yoki telefon) kiritilishi shart')

        request = self.context.get('request')
        user = authenticate(request=request, username=login_id, password=password)

        if not user and attrs.get('username'):
            try:
                db_user = User.objects.get(username__iexact=login_id)
                user = authenticate(request=request, username=db_user.username, password=password)
            except User.DoesNotExist:
                pass

        if not user and attrs.get('phone'):
            user = authenticate(request=request, username=attrs['phone'], password=password)

        if not user:
            raise ValidationError('Login yoki parol xato')

        if not user.is_active:
            raise ValidationError('Foydalanuvchi aktiv emas')
        attrs['user'] = user
        return attrs
