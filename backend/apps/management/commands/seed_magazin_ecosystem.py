"""100 Magazin — to'liq ekotizim (filial, xodim, mahsulot, diler, qarzdor, sotuv)."""

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.management import magazin_seed as ms
from apps.models import Sale


class Command(BaseCommand):
    help = (
        '100 magazin: 1–3 filial, admin/manager/kassir, 500–1000 mahsulot, '
        '30–50 diler, 200–300 qarzdor, kunlik 800–1000 sotuv (5–10 mln), aralash to\'lov'
    )

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=100)
        parser.add_argument('--password', type=str, default='123')
        parser.add_argument('--seed', type=int, default=42)
        parser.add_argument('--force', action='store_true', help='Mavjud ma\'lumotni qayta yaratish')
        parser.add_argument('--limit-stores', type=int, default=0, help='0 = hammasi')
        parser.add_argument('--skip-sales', action='store_true', help='Sotuvlarni o\'tkazib yuborish')
        parser.add_argument('--export', type=str, default='store_logins.txt')
        parser.add_argument('--branches-min', type=int, default=1)
        parser.add_argument('--branches-max', type=int, default=3)
        parser.add_argument('--products-min', type=int, default=500)
        parser.add_argument('--products-max', type=int, default=1000)
        parser.add_argument('--suppliers-min', type=int, default=30)
        parser.add_argument('--suppliers-max', type=int, default=50)
        parser.add_argument('--debtors-min', type=int, default=200)
        parser.add_argument('--debtors-max', type=int, default=300)
        parser.add_argument('--today-sales-min', type=int, default=800)
        parser.add_argument('--today-sales-max', type=int, default=1000)
        parser.add_argument('--revenue-min', type=int, default=5_000_000)
        parser.add_argument('--revenue-max', type=int, default=10_000_000)

    def handle(self, *args, **options):
        import random
        random.seed(options['seed'])

        count = options['count']
        stores = ms.list_store_numbers(count)
        if options['limit_stores'] > 0:
            stores = stores[: options['limit_stores']]

        ms.ensure_superadmin(options['password'])
        categories = ms.ensure_categories()

        sale_seq = Sale.objects.count() + 1
        stats = {
            'branches': 0, 'users': 0, 'products': 0,
            'suppliers': 0, 'catalog': 0, 'debtors': 0,
            'sales': 0, 'revenue': 0,
        }

        self.stdout.write(self.style.MIGRATE_HEADING(
            f'Magazin ekotizimi: {len(stores)} ta do\'kon'
        ))

        for store_n in stores:
            with transaction.atomic():
                if options['force']:
                    ms.clear_store_data(store_n)

                branches, bc = ms.ensure_store_branches(
                    store_n,
                    branches_min=options['branches_min'],
                    branches_max=options['branches_max'],
                )
                stats['branches'] += bc

                uc = ms.ensure_store_users(
                    store_n,
                    password=options['password'],
                )
                stats['users'] += uc

                pc = ms.seed_store_products(
                    store_n, categories,
                    products_min=options['products_min'],
                    products_max=options['products_max'],
                    force=options['force'],
                )
                stats['products'] += pc

                sc, cat = ms.seed_store_suppliers(
                    store_n,
                    suppliers_min=options['suppliers_min'],
                    suppliers_max=options['suppliers_max'],
                    force=options['force'],
                )
                stats['suppliers'] += sc
                stats['catalog'] += cat

                dc = ms.seed_store_debtors(
                    store_n,
                    debtors_min=options['debtors_min'],
                    debtors_max=options['debtors_max'],
                    force=options['force'],
                )
                stats['debtors'] += dc

                if not options['skip_sales']:
                    sr = ms.seed_store_sales(
                        store_n,
                        today_sales_min=options['today_sales_min'],
                        today_sales_max=options['today_sales_max'],
                        revenue_min=options['revenue_min'],
                        revenue_max=options['revenue_max'],
                        force=options['force'],
                        sale_seq_start=sale_seq,
                    )
                    stats['sales'] += sr['sales']
                    stats['revenue'] += float(sr['revenue'])
                    sale_seq = sr['next_seq']

            if store_n % 5 == 0 or store_n == stores[-1]:
                self.stdout.write(f'  ... {store_n}/{stores[-1]} magazin')

        if options['export']:
            out = ms.export_logins(options['export'], options['password'], count)
            self.stdout.write(self.style.SUCCESS(f'Loginlar: {out}'))

        self.stdout.write(self.style.SUCCESS(
            f'Tayyor: +{stats["branches"]} filial, +{stats["users"]} xodim, '
            f'+{stats["products"]} mahsulot, +{stats["suppliers"]} diler, '
            f'+{stats["debtors"]} qarzdor, +{stats["sales"]} sotuv '
            f'(~{stats["revenue"]:,.0f} so\'m)'
        ))
