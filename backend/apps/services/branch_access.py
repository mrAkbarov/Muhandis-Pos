from apps.models import User


def user_has_global_branch_access(user) -> bool:
    """Platform admin / boss — barcha filiallarni ko'radi."""
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    if user.role in (User.Role.ADMIN, User.Role.BOSS) and not user.branch_id:
        return True
    return False


def filter_queryset_by_user_branch(qs, user, branch_field='branch'):
    if user_has_global_branch_access(user):
        return qs
    if not user.branch_id:
        return qs.none()
    if qs.model._meta.model_name == 'branch' or branch_field == 'pk':
        return qs.filter(pk=user.branch_id)
    return qs.filter(**{branch_field: user.branch_id})
