from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.models import User
from apps.services.branch_access import user_has_global_branch_access


def is_platform_owner(user) -> bool:
    """Filialsiz admin — dastur egasi (superadmin)."""
    return (
        user
        and user.is_authenticated
        and user.role == User.Role.ADMIN
        and not user.branch_id
    )


class IsAuthenticatedNotPlatformOwnerWriter(BasePermission):
    """Platform egasi faqat o'qiy oladi — POST/PUT/PATCH/DELETE taqiqlangan."""

    message = 'Platform egasi faqat ko\'ruvchi rejimda — o\'zgartirish mumkin emas.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        if is_platform_owner(request.user):
            return False
        return True


class IsPlatformOwner(BasePermission):
    """Faqat platform egasi (superadmin)."""

    def has_permission(self, request, view):
        return is_platform_owner(request.user)
