from django.core.management.base import BaseCommand
from django.db.models import Q

from apps.models import Sale, User


class Command(BaseCommand):
    help = "Eski savdolarga cashier FK bog'laydi (cashier_name bo'yicha)"

    def handle(self, *args, **options):
        updated = 0
        for user in User.objects.filter(role=User.Role.CASHIER):
            names = {
                (user.first_name or '').strip(),
                (user.last_name or '').strip(),
                (user.full_name or '').strip(),
                (user.username or '').strip(),
                f'{(user.first_name or "").strip()} {(user.last_name or "").strip()}'.strip(),
            }
            names = {n for n in names if n}
            if not names:
                continue

            q = Q()
            for name in names:
                q |= Q(cashier_name__icontains=name)

            qs = Sale.objects.filter(cashier__isnull=True).filter(q)
            if user.branch_id:
                qs = qs.filter(branch_id=user.branch_id)

            count = qs.update(cashier=user)
            if count:
                self.stdout.write(f'  {user.username}: {count} ta savdo bog\'landi')
                updated += count

        self.stdout.write(self.style.SUCCESS(f'Jami: {updated} ta savdo yangilandi'))
