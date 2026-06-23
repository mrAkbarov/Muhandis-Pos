"""100 ta Magazin — filiallar va xodimlar (asosiy filial + 1–3 filial)."""

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.management import magazin_seed as ms


class Command(BaseCommand):
    help = (
        '100 magazin: har birida 1–3 filial, 1 admin, 1 manager, 2–4 kassir. '
        'Loginlar: m001.admin, m001.manager, m001.kassir1 …'
    )

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=100)
        parser.add_argument('--password', type=str, default='123')
        parser.add_argument('--cashiers-min', type=int, default=2)
        parser.add_argument('--cashiers-max', type=int, default=4)
        parser.add_argument('--branches-min', type=int, default=1)
        parser.add_argument('--branches-max', type=int, default=3)
        parser.add_argument('--export', type=str, default='store_logins.txt')

    @transaction.atomic
    def handle(self, *args, **options):
        count = options['count']
        password = options['password']
        c_min = options['cashiers_min']
        c_max = max(options['cashiers_max'], c_min)

        ms.ensure_superadmin(password)

        lines = [
            '# SmartPOS — magazin loginlari',
            f'# Parol (hamma uchun): {password}',
            '# Platform admin: superadmin',
            '',
            f'superadmin\t{password}\t(platform admin — barcha magazinlar)',
            '',
        ]

        created_users = 0
        created_branches = 0

        for store_n in range(1, count + 1):
            branches, bc = ms.ensure_store_branches(
                store_n,
                branches_min=options['branches_min'],
                branches_max=options['branches_max'],
            )
            created_branches += bc

            uc = ms.ensure_store_users(
                store_n,
                password=password,
                cashiers_min=c_min,
                cashiers_max=c_max,
                lines=lines,
            )
            created_users += uc

        if options['export']:
            from pathlib import Path
            out = Path(options['export'])
            if not out.is_absolute():
                out = Path(__file__).resolve().parents[4] / options['export']
            out.write_text('\n'.join(lines), encoding='utf-8')
            self.stdout.write(self.style.SUCCESS(f'Loginlar: {out}'))

        self.stdout.write(self.style.SUCCESS(
            f'Tayyor: {created_branches} yangi filial, {created_users} yangi foydalanuvchi '
            f'(jami {count} magazin, har biri 1–{options["branches_max"]} filial).'
        ))
