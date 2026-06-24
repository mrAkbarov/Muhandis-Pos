"""100 ta Magazin filialiga random mahsulotlar qo'shish."""

import random
import string
from decimal import ROUND_HALF_UP, Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.models import Branch, Category, InventoryItem, Product, Warehouse

CATEGORIES = [
    'Ichimliklar', 'Oziq-ovqat', 'Sut mahsulotlari', 'Shirinliklar',
    'Kraxmal', "Go'sht mahsulotlari", 'Non va pishiriq', 'Maishiy kimyo',
    'Muzlatilgan', 'Snacks',
]

PRODUCT_STEMS = [
    'Cola', 'Pepsi', 'Fanta', 'Sprite', 'Suv', 'Choy', 'Qahva', 'Sut', 'Qatiq',
    'Smetana', 'Pishloq', 'Non', 'Baton', "Lay's", 'Pringles', 'Snickers',
    'Mars', 'Twix', 'Shokolad', 'Pechenye', 'Guruch', 'Makaron', 'Un', "Yog'",
    'Tuxum', 'Kolbasa', 'Sosiska', "Go'sht", 'Tovuq', 'Baliq', 'Sabzi', 'Kartoshka',
    'Piyoz', 'Olma', 'Banan', 'Uzum', 'Detergent', 'Shampun', 'Sovun', 'Salfetka',
]

SIZES = ['250g', '500g', '1kg', '1L', '0.5L', '1.5L', '330ml', '50g', '100g', 'dona']
UNITS = ['dona', 'litr', 'kg', 'gr', 'pachka', 'quti']
EMOJIS = ['🥤', '🥛', '🍫', '🍟', '🫓', '🥩', '🧴', '🍎', '📦', '🧃']


def money(value):
    return Decimal(str(value)).quantize(Decimal('1'), rounding=ROUND_HALF_UP)


def store_number(branch_name: str) -> int:
    digits = ''.join(ch for ch in branch_name if ch.isdigit())
    return int(digits) if digits else 0


def barcode_for(store_idx: int, prod_idx: int) -> str:
    return f'891{store_idx:03d}{prod_idx:05d}'


class Command(BaseCommand):
    help = 'Magazin 001–100 filiallariga random mahsulotlar (default: 185 ta)'

    def add_arguments(self, parser):
        parser.add_argument('--per-store', type=int, default=185)
        parser.add_argument('--seed', type=int, default=42)
        parser.add_argument(
            '--force',
            action='store_true',
            help='Mahsuloti bor filiallarga ham qayta qo\'shish',
        )

    def handle(self, *args, **options):
        per_store = options['per_store']
        random.seed(options['seed'])

        categories = []
        for name in CATEGORIES:
            cat, _ = Category.objects.get_or_create(name=name)
            categories.append(cat)

        branches = list(
            Branch.objects.filter(name__startswith='Magazin ').order_by('name')
        )
        if not branches:
            self.stderr.write(self.style.ERROR('Magazin filiallari topilmadi. Avval: make seed-stores'))
            return

        total_created = 0
        stores_done = 0

        for branch in branches:
            existing = Product.objects.filter(branch=branch).count()
            if existing >= per_store and not options['force']:
                self.stdout.write(f'  = {branch.name} ({existing} ta — o\'tkazildi)')
                continue
            if existing and options['force']:
                Product.objects.filter(branch=branch).delete()

            store_idx = store_number(branch.name)
            warehouse, _ = Warehouse.objects.get_or_create(
                branch=branch,
                name='Asosiy ombor',
            )

            used_names = set()
            batch = []
            for pi in range(1, per_store + 1):
                stem = random.choice(PRODUCT_STEMS)
                size = random.choice(SIZES)
                name = f'{stem} {size}'
                while name in used_names:
                    name = f'{stem} {size} {random.choice(string.ascii_uppercase)}'
                used_names.add(name)

                cost = money(random.randint(3_000, 95_000))
                price = money(cost * Decimal(str(random.uniform(1.1, 1.4))))
                stock = random.randint(20, 500)
                batch.append(Product(
                    name=name[:50],
                    barcode=barcode_for(store_idx, pi),
                    category=random.choice(categories),
                    branch=branch,
                    selling_price=price,
                    base_price=cost,
                    emoji=random.choice(EMOJIS),
                    size=size,
                    unit=random.choice(UNITS),
                    stock=stock,
                ))

            with transaction.atomic():
                created = Product.objects.bulk_create(batch, batch_size=200)
                inv = [
                    InventoryItem(product=p, warehouse=warehouse, quantity=p.stock)
                    for p in created
                ]
                InventoryItem.objects.bulk_create(inv, batch_size=200, ignore_conflicts=True)

            total_created += len(created)
            stores_done += 1
            if stores_done % 10 == 0 or stores_done == len(branches):
                self.stdout.write(f'  ... {stores_done}/{len(branches)} magazin')

        self.stdout.write(self.style.SUCCESS(
            f'Tayyor: {stores_done} magazin, {total_created} yangi mahsulot'
        ))
