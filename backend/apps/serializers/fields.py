from rest_framework.serializers import (
    CharField,
    ValidationError,
)

from apps.validators.phone import normalize_uz_phone


class UzPhoneField(CharField):
    """O'zbekiston telefoni — DB da 9 raqam, API javobida +998 prefiksi."""

    def to_internal_value(self, data):
        value = super().to_internal_value(data)
        if not value:
            if self.required:
                raise ValidationError('Telefon raqami kiritilishi shart')
            return ''
        try:
            return normalize_uz_phone(value)
        except Exception as exc:
            raise ValidationError(str(exc)) from exc

    def to_representation(self, value):
        if not value:
            return ''
        from apps.validators.phone import format_uz_phone_display
        return format_uz_phone_display(value)
