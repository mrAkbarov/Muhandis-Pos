from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.core.exceptions import ValidationError
from django.db.models import BooleanField, CharField, ImageField, TextChoices

from apps.models.base import TimeStampedModel, UUIDPrimaryKeyModel, branch_foreign_key_nullable
from apps.models.managers import UserManager
from apps.validators.phone import normalize_uz_phone


class Branch(UUIDPrimaryKeyModel, TimeStampedModel):
    """Savdo nuqtasi / filial — mahsulot, sklad, sotuv shu yerda bog'lanadi."""

    name = CharField(max_length=50, verbose_name='Filial nomi')
    address = CharField(max_length=100, blank=True, null=True, verbose_name='Manzil')
    phone = CharField(max_length=20, blank=True, null=True, verbose_name='Telefon')

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def clean(self):
        super().clean()
        if self.phone:
            self.phone = normalize_uz_phone(self.phone)

    def save(self, *args, **kwargs):
        if self.phone:
            self.phone = normalize_uz_phone(self.phone)
        super().save(*args, **kwargs)


class User(AbstractBaseUser, PermissionsMixin, UUIDPrimaryKeyModel, TimeStampedModel):
    """Tizim foydalanuvchisi — kassir, menejer, admin."""

    class Role(TextChoices):
        ADMIN = 'admin', 'Admin'
        BOSS = 'boss', 'Boss'
        OWNER = 'owner', 'Egasi'
        MANAGER = 'manager', 'Menejer'
        CASHIER = 'cashier', 'Kassir'

    username = CharField(max_length=30, unique=True, null=True, blank=True, verbose_name='Login')
    phone = CharField(max_length=20, unique=True, verbose_name='Telefon')
    first_name = CharField(max_length=50, verbose_name='Ism')
    last_name = CharField(max_length=50, verbose_name='Familiya')
    role = CharField(max_length=20, choices=Role.choices, default=Role.CASHIER, verbose_name='Rol')
    avatar = ImageField(upload_to='avatars/', blank=True, null=True, verbose_name='Avatar')
    branch = branch_foreign_key_nullable('employees', verbose_name='Filial')

    is_active = BooleanField(default=True, verbose_name='Faol')
    is_staff = BooleanField(default=False, verbose_name='Admin panelga kirish')

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['phone', 'first_name', 'last_name']

    class Meta:
        verbose_name = 'Foydalanuvchi'
        verbose_name_plural = 'Foydalanuvchilar'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.full_name} ({self.get_role_display()})'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    def clean(self):
        super().clean()
        if self.phone:
            self.phone = normalize_uz_phone(self.phone)

        branch_count = Branch.objects.count()
        if branch_count == 0:
            if self.branch:
                raise ValidationError({'branch': 'Tizimda filiallar mavjud emas. Avval filial yarating.'})
            return
        else:
            if self.role in (self.Role.CASHIER, self.Role.MANAGER) and not self.branch:
                raise ValidationError(
                    {
                        'branch': f"Filiallar ko'p ({branch_count} ta). {self.get_role_display()} uchun aniq filialni tanlang!"
                    }
                )
        if self.role in (self.Role.BOSS, self.Role.OWNER) and self.branch:
            raise ValidationError({'branch': 'Boss yoki Egasi alohida filialga biriktirilmaydi.'})

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = self.Role.ADMIN
        if self.phone:
            self.phone = normalize_uz_phone(self.phone)
        branch_count = Branch.objects.count()
        # 1 yoki 2 ta filialli kichik tarmoqlar uchun avtomatik biriktirish mantiqi:
        if 1 <= branch_count <= 2:
            if self.role in (self.Role.CASHIER, self.Role.MANAGER) and not self.branch:
                first_branch = Branch.objects.first()
                if first_branch:
                    self.branch = first_branch
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_boss(self):
        return self.role == self.Role.BOSS

    @property
    def is_owner(self):
        return self.role == self.Role.OWNER

    @property
    def is_manager(self):
        return self.role == self.Role.MANAGER

    @property
    def is_cashier(self):
        return self.role == self.Role.CASHIER
