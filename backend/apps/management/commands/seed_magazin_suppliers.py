"""100 ta Magazin filialiga dilerlar (agent bilan) va katalog qo'shish."""

import random

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.models import Branch, Product, Supplier, SupplierCatalogItem

SUPPLIER_STEMS = [
    'Coca-Cola', 'PepsiCo', 'Nestle', 'Lactalis', 'Azersun', 'Olmaliq',
    'Artel Food', 'Registan', 'Samarqand Non', "Toshkent Go'sht", 'UzSnacks',
    'Shirin', 'Bonduelle', 'Makro', 'Baraka', 'Navbahor', 'Oqtepa',
    'Milliy Diler', 'Fresh Market', 'Optom UZ', 'Bozor Link', 'Asia Trade',
]

FIRST_NAMES = [
    'Aziz', 'Bobur', 'Dilshod', 'Eldor', 'Farhod', 'G\'olib', 'Hamid', 'Ibrohim',
    'Javohir', 'Kamol', 'Laziz', 'Mirzo', 'Nodir', 'Otabek', 'Parviz', 'Rustam',
    'Sardor', 'Timur', 'Ulug\'bek', 'Vali', 'Zafar', 'Shohruh', 'Bekzod', 'Doniyor',
    'Malika', 'Nigora', 'Zilola', 'Dilnoza', 'Gulnora', 'Sevara', 'Madina', 'Nilufar',
]

LAST_NAMES = [
    'Karimov', 'Tursunov', 'Rahimov', 'Saidov', 'Yusupov', 'Alimov', 'Nazarov',
    'Mirzayev', 'Qodirov', 'Ergashev', 'Xolmatov', 'Ismoilov', 'Abdurahmonov',
]


def store_number(branch_name: str) -> int:
    digits = ''.join(ch for ch in branch_name if ch.isdigit())
    return int(digits) if digits else 0


class Command(BaseCommand):
    help = 'Magazin 001–100 filiallariga diler + agent + katalog (default: 8 ta diler)'

    def add_arguments(self, parser):
        parser.add_argument('--per-store', type=int, default=8)
        parser.add_argument('--catalog-min', type=int, default=10)
        parser.add_argument('--catalog-max', type=int, default=25)
        parser.add_argument('--seed', type=int, default=77)
        parser.add_argument(
            '--force',
            action='store_true',
            help='Dileri bor filiallarga ham qayta yaratish (avvalgisini o\'chiradi)',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        per_store = options['per_store']
        cat_min = min(options['catalog_min'], options['catalog_max'])
        cat_max = max(options['catalog_min'], options['catalog_max'])
        random.seed(options['seed'])

        branches = list(
            Branch.objects.filter(name__startswith='Magazin ').order_by('name')
        )
        if not branches:
            self.stderr.write(self.style.ERROR('Magazin filiallari topilmadi. Avval: make seed-stores'))
            return

        total_suppliers = 0
        total_catalog = 0
        phone_base = 930_000_000

        for branch in branches:
            existing = Supplier.objects.filter(branch=branch).count()
            if existing >= per_store and not options['force']:
                self.stdout.write(f'  = {branch.name} ({existing} diler — o\'tkazildi)')
                continue

            if options['force'] and existing:
                Supplier.objects.filter(branch=branch).delete()

            products = list(
                Product.objects.filter(branch=branch).select_related('category')
            )
            if not products:
                self.stdout.write(self.style.WARNING(f'  ! {branch.name}: mahsulot yo\'q — o\'tkazildi'))
                continue

            store_idx = store_number(branch.name)
            suppliers = []
            for i in range(per_store):
                phone_base += 1
                agent_phone = phone_base + 50_000 + store_idx
                stem = random.choice(SUPPLIER_STEMS)
                name = f'{stem} {store_idx}-{i + 1}'[:50]
                suppliers.append(Supplier(
                    branch=branch,
                    name=name,
                    phone=str(phone_base),
                    address=f'{branch.name} tumani',
                    agent_name=f'{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}',
                    agent_phone=str(agent_phone),
                    total_orders=random.randint(3, 80),
                    status='Faol',
                ))

            Supplier.objects.bulk_create(suppliers, batch_size=200)
            created = list(Supplier.objects.filter(branch=branch).order_by('-id')[:per_store])

            catalog_batch = []
            for sup in created:
                pick_count = min(random.randint(cat_min, cat_max), len(products))
                picks = random.sample(products, k=pick_count)
                for prod in picks:
                    catalog_batch.append(SupplierCatalogItem(
                        supplier=sup,
                        name=prod.name,
                        category=prod.category.name if prod.category else '',
                        default_cost=prod.base_price,
                        size=prod.size or '',
                        unit=prod.unit or 'dona',
                        barcode=prod.barcode,
                        product=prod,
                    ))

            SupplierCatalogItem.objects.bulk_create(catalog_batch, batch_size=500)
            total_suppliers += len(created)
            total_catalog += len(catalog_batch)
            self.stdout.write(
                self.style.SUCCESS(
                    f'  + {branch.name}: {len(created)} diler, {len(catalog_batch)} katalog'
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'Tayyor: {total_suppliers} diler, {total_catalog} katalog elementi'
            )
        )
