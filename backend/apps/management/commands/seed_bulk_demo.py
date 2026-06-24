"""
Katta hajmli demo ma'lumot — filial, mahsulot, diler, qarzdor, sotuv.
Ishlatish: python manage.py seed_bulk_demo
"""

import random
import string
from datetime import timedelta
from decimal import ROUND_HALF_UP, Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.models import (
    Branch,
    Category,
    CreditAccount,
    CreditTransaction,
    InventoryItem,
    Product,
    Sale,
    SaleLine,
    Supplier,
    SupplierCatalogItem,
    User,
    Warehouse,
)

BULK_PREFIX = 'Bulk Demo '
PAYMENT_METHODS = [
    ('Naqd', 0.38),
    ('Karta', 0.22),
    ('Online', 0.18),
    ('Nasiya', 0.12),
    ('Naqd+Karta', 0.10),
]

CATEGORIES = [
    'Ichimliklar',
    'Oziq-ovqat',
    'Sut mahsulotlari',
    'Shirinliklar',
    'Kraxmal',
    "Go'sht mahsulotlari",
    'Non va pishiriq',
    'Maishiy kimyo',
    'Muzlatilgan',
    'Snacks',
]

PRODUCT_STEMS = [
    'Cola',
    'Pepsi',
    'Fanta',
    'Sprite',
    'Suv',
    'Choy',
    'Qahva',
    'Sut',
    'Qatiq',
    'Smetana',
    'Pishloq',
    'Non',
    'Baton',
    "Lay's",
    'Pringles',
    'Snickers',
    'Mars',
    'Twix',
    'Shokolad',
    'Pechenye',
    'Guruch',
    'Makaron',
    'Un',
    "Yog'",
    'Tuxum',
    'Kolbasa',
    'Sosiska',
    "Go'sht",
    'Tovuq',
    'Baliq',
    'Sabzi',
    'Kartoshka',
    'Piyoz',
    'Olma',
    'Banan',
    'Uzum',
    'Detergent',
    'Shampun',
    'Sovun',
    'Salfetka',
]

SIZES = ['250g', '500g', '1kg', '1L', '0.5L', '1.5L', '330ml', '50g', '100g', 'dona']
UNITS = ['dona', 'litr', 'kg', 'gr', 'pachka', 'quti']
EMOJIS = ['🥤', '🥛', '🍫', '🍟', '🫓', '🥩', '🧴', '🍎', '📦', '🧃']

SUPPLIER_STEMS = [
    'Coca-Cola',
    'PepsiCo',
    'Nestle',
    'Lactalis',
    'Nestle UZ',
    'Azersun',
    'Olmaliq',
    'Artel Food',
    'Registan',
    'Samarqand Non',
    "Toshkent Go'sht",
    'UzSnacks',
    'Shirin',
    'Bonduelle',
    'Makro',
    'Metro Cash',
    'Baraka',
    'Navbahor',
    'Oqtepa',
    'Milliy Diler',
    'Fresh Market',
    'Optom UZ',
    'Bozor Link',
    'Asia Trade',
]

FIRST_NAMES = [
    'Aziz',
    'Bobur',
    'Dilshod',
    'Eldor',
    'Farhod',
    "G'olib",
    'Hamid',
    'Ibrohim',
    'Javohir',
    'Kamol',
    'Laziz',
    'Mirzo',
    'Nodir',
    'Otabek',
    'Parviz',
    'Rustam',
    'Sardor',
    'Timur',
    "Ulug'bek",
    'Vali',
    'Zafar',
    'Shohruh',
    'Bekzod',
    'Doniyor',
    'Malika',
    'Nigora',
    'Zilola',
    'Dilnoza',
    'Gulnora',
    'Sevara',
    'Madina',
    'Nilufar',
]

LAST_NAMES = [
    'Karimov',
    'Tursunov',
    'Rahimov',
    'Saidov',
    'Yusupov',
    'Alimov',
    'Nazarov',
    'Mirzayev',
    'Qodirov',
    'Ergashev',
    'Xolmatov',
    'Ismoilov',
    'Abdurahmonov',
]


def weighted_choice(pairs):
    items, weights = zip(*pairs, strict=False)
    return random.choices(items, weights=weights, k=1)[0]


def money(value):
    return Decimal(str(value)).quantize(Decimal('1'), rounding=ROUND_HALF_UP)


def random_phone(seed_base):
    base = 900_000_000 + (seed_base % 99_999_999)
    return str(base)


def unique_barcode(index):
    return str(890_000_000_000 + index)


class Command(BaseCommand):
    help = 'Bazaga katta hajmli random demo: 1-3 filial, 500-1000 mahsulot, sotuvlar va qarzdorlar'

    def add_arguments(self, parser):
        parser.add_argument('--branches-min', type=int, default=1)
        parser.add_argument('--branches-max', type=int, default=3)
        parser.add_argument('--products-min', type=int, default=500)
        parser.add_argument('--products-max', type=int, default=1000)
        parser.add_argument('--suppliers-min', type=int, default=30)
        parser.add_argument('--suppliers-max', type=int, default=50)
        parser.add_argument('--debtors-min', type=int, default=200)
        parser.add_argument('--debtors-max', type=int, default=300)
        parser.add_argument('--online-payers', type=int, default=50)
        parser.add_argument('--sales-min', type=int, default=800)
        parser.add_argument('--sales-max', type=int, default=1000)
        parser.add_argument('--revenue-min', type=int, default=5_000_000)
        parser.add_argument('--revenue-max', type=int, default=7_000_000)
        parser.add_argument('--days', type=int, default=1, help='Necha kunlik sotuv')
        parser.add_argument('--seed', type=int, default=None)
        parser.add_argument(
            '--clear',
            action='store_true',
            help=f"Oldingi \"{BULK_PREFIX}\" filiallarini va bog'liq ma'lumotlarni o'chirish",
        )

    def handle(self, *args, **options):
        if options['seed'] is not None:
            random.seed(options['seed'])

        if options['clear']:
            deleted, _ = Branch.objects.filter(name__startswith=BULK_PREFIX).delete()
            self.stdout.write(self.style.WARNING(f"O'chirildi: {deleted} obyekt"))

        branch_count = random.randint(options['branches_min'], options['branches_max'])
        product_count = random.randint(options['products_min'], options['products_max'])
        supplier_count = random.randint(options['suppliers_min'], options['suppliers_max'])
        debtor_count = random.randint(options['debtors_min'], options['debtors_max'])
        sale_count = random.randint(options['sales_min'], options['sales_max'])
        target_revenue = money(random.randint(options['revenue_min'], options['revenue_max']))
        days = max(1, options['days'])
        online_payers = min(options['online_payers'], debtor_count)

        self.stdout.write(
            f'Reja: {branch_count} filial, {product_count} mahsulot, '
            f'{supplier_count} diler, {debtor_count} qarzdor, '
            f"{sale_count}x{days} sotuv, ~{target_revenue:,} so'm"
        )

        with transaction.atomic():
            branches = self._create_branches(branch_count)
            categories = self._ensure_categories()
            products, products_by_branch = self._create_products(
                branches,
                categories,
                product_count,
            )
            warehouses = self._create_warehouses(branches)
            self._create_inventory(products, warehouses)
            self._create_suppliers(branches, supplier_count, products_by_branch)
            cashiers_by_branch = self._ensure_cashiers(branches)
            debtors = self._create_debtors(branches, debtor_count)
            self._create_online_payments(debtors, online_payers)
            total_sales, total_amount = self._create_sales(
                branches,
                products_by_branch,
                cashiers_by_branch,
                debtors,
                sale_count,
                days,
                target_revenue,
            )

        self.stdout.write(
            self.style.SUCCESS(f"Tayyor! Sotuvlar: {total_sales:,} ta, jami aylanma: {total_amount:,} so'm")
        )
        self.stdout.write(f'Filiallar: {", ".join(b.name for b in branches)}')

    def _create_branches(self, count):
        branches = []
        for i in range(1, count + 1):
            name = f'{BULK_PREFIX}{i:02d}'
            branch, created = Branch.objects.get_or_create(
                name=name,
                defaults={
                    'address': f'Toshkent, {name}',
                    'phone': random_phone(10_000 + i),
                },
            )
            branches.append(branch)
            mark = '+' if created else '='
            self.stdout.write(f'  {mark} filial {name}')
        return branches

    def _ensure_categories(self):
        cats = []
        for name in CATEGORIES:
            cat, _ = Category.objects.get_or_create(name=name)
            cats.append(cat)
        return cats

    def _create_products(self, branches, categories, total_count):
        per_branch = total_count // len(branches)
        extra = total_count % len(branches)
        all_products = []
        by_branch = {b.id: [] for b in branches}
        barcode_idx = Product.objects.order_by('-id').values_list('id', flat=True).first() or 0
        barcode_idx += 1

        for bi, branch in enumerate(branches):
            count = per_branch + (1 if bi < extra else 0)
            batch = []
            used_names = set()
            for _ in range(count):
                stem = random.choice(PRODUCT_STEMS)
                size = random.choice(SIZES)
                name = f'{stem} {size}'
                while name in used_names:
                    name = f'{stem} {size} {random.choice(string.ascii_uppercase)}'
                used_names.add(name)

                cost = money(random.randint(3_000, 120_000))
                markup = random.uniform(1.08, 1.45)
                price = money(cost * Decimal(str(markup)))
                batch.append(
                    Product(
                        name=name[:50],
                        barcode=unique_barcode(barcode_idx),
                        category=random.choice(categories),
                        branch=branch,
                        selling_price=price,
                        base_price=cost,
                        emoji=random.choice(EMOJIS),
                        size=size,
                        unit=random.choice(UNITS),
                        stock=random.randint(50, 800),
                    )
                )
                barcode_idx += 1

            created = Product.objects.bulk_create(batch, batch_size=500)
            all_products.extend(created)
            by_branch[branch.id] = created
            self.stdout.write(f'  + {len(created)} mahsulot → {branch.name}')

        return all_products, by_branch

    def _create_warehouses(self, branches):
        warehouses = []
        for branch in branches:
            wh, _ = Warehouse.objects.get_or_create(
                branch=branch,
                name='Asosiy ombor',
            )
            warehouses.append(wh)
        return warehouses

    def _create_inventory(self, products, warehouses):
        wh_by_branch = {w.branch_id: w for w in warehouses}
        batch = []
        for product in products:
            wh = wh_by_branch.get(product.branch_id)
            if not wh:
                continue
            batch.append(
                InventoryItem(
                    product=product,
                    warehouse=wh,
                    quantity=product.stock,
                )
            )
        InventoryItem.objects.bulk_create(batch, batch_size=500, ignore_conflicts=True)
        self.stdout.write(f"  + {len(batch)} ombor qoldig'i")

    def _create_suppliers(self, branches, total_count, products_by_branch):
        per_branch = max(1, total_count // len(branches))
        suppliers = []
        catalog_batch = []
        phone_base = 910_000_000

        for branch in branches:
            products_by_branch.get(branch.id, [])
            for _i in range(per_branch):
                phone_base += 1
                stem = random.choice(SUPPLIER_STEMS)
                suffix = random.randint(1, 99)
                name = f'{stem} {suffix}'[:50]
                sup = Supplier(
                    branch=branch,
                    name=name,
                    phone=str(phone_base),
                    address=f'{branch.name} tumani',
                    agent_name=f'{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}',
                    agent_phone=str(phone_base + 50_000),
                    total_orders=random.randint(5, 120),
                    status='Faol',
                )
                suppliers.append(sup)

        Supplier.objects.bulk_create(suppliers, batch_size=200)
        suppliers = list(Supplier.objects.filter(branch__name__startswith=BULK_PREFIX).order_by('id'))

        for sup in suppliers:
            picks = random.sample(
                products_by_branch.get(sup.branch_id, []),
                k=min(random.randint(8, 25), len(products_by_branch.get(sup.branch_id, []))),
            )
            for prod in picks:
                catalog_batch.append(
                    SupplierCatalogItem(
                        supplier=sup,
                        name=prod.name,
                        category=prod.category.name,
                        default_cost=prod.base_price,
                        size=prod.size or '',
                        unit=prod.unit or 'dona',
                        barcode=prod.barcode,
                        product=prod,
                    )
                )

        SupplierCatalogItem.objects.bulk_create(catalog_batch, batch_size=500)
        self.stdout.write(f'  + {len(suppliers)} diler, {len(catalog_batch)} katalog elementi')
        return suppliers

    def _ensure_cashiers(self, branches):
        result = {}
        for i, branch in enumerate(branches, start=1):
            existing = list(User.objects.filter(branch=branch, role=User.Role.CASHIER, is_active=True)[:5])
            if len(existing) >= 2:
                result[branch.id] = existing
                continue

            created = []
            for j in range(1, 3):
                username = f'bulk{i:02d}.kassir{j}'
                if User.objects.filter(username=username).exists():
                    created.append(User.objects.get(username=username))
                    continue
                user = User.objects.create_user(
                    username=username,
                    password='123',
                    phone=str(920_000_000 + i * 10 + j),
                    first_name=f'Kassir{j}',
                    last_name=branch.name[:20],
                    role=User.Role.CASHIER,
                    branch=branch,
                )
                created.append(user)
            result[branch.id] = created or existing
        return result

    def _create_debtors(self, branches, total_count):
        debtors = []
        phone_base = 930_000_000
        for _i in range(total_count):
            branch = random.choice(branches)
            phone_base += 1
            name = f'{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}'
            balance = money(random.randint(0, 2_500_000))
            if random.random() < 0.15:
                balance = money(0)
            debtors.append(
                CreditAccount(
                    branch=branch,
                    customer_name=name[:50],
                    phone=str(phone_base),
                    balance=balance,
                )
            )

        CreditAccount.objects.bulk_create(debtors, batch_size=500)
        debtors = list(CreditAccount.objects.filter(branch__name__startswith=BULK_PREFIX).order_by('id'))

        charge_batch = []
        for acc in debtors:
            if acc.balance <= 0:
                continue
            charge_batch.append(
                CreditTransaction(
                    account=acc,
                    kind=CreditTransaction.Kind.CHARGE,
                    amount=acc.balance,
                    note='Nasiya savdo',
                    cashier_name='Tizim',
                )
            )
        CreditTransaction.objects.bulk_create(charge_batch, batch_size=500)
        self.stdout.write(f'  + {len(debtors)} qarzdor ({len(charge_batch)} ta charge)')
        return debtors

    def _create_online_payments(self, debtors, count):
        candidates = [d for d in debtors if d.balance > 0]
        random.shuffle(candidates)
        payers = candidates[:count]
        tx_batch = []
        for acc in payers:
            pay_amount = acc.balance if random.random() < 0.6 else money(acc.balance * Decimal('0.5'))
            if pay_amount <= 0:
                continue
            acc.balance -= pay_amount
            tx_batch.append(
                CreditTransaction(
                    account=acc,
                    kind=CreditTransaction.Kind.PAYMENT,
                    amount=pay_amount,
                    note="Online to'lov",
                    cashier_name='Online',
                )
            )

        CreditAccount.objects.bulk_update(payers, ['balance'], batch_size=200)
        CreditTransaction.objects.bulk_create(tx_batch, batch_size=200)
        self.stdout.write(f"  + {len(tx_batch)} online to'lov (qarzdorlar)")

    def _create_sales(
        self,
        branches,
        products_by_branch,
        cashiers_by_branch,
        debtors,
        sales_per_day,
        days,
        target_revenue,
    ):
        debtors_by_branch = {}
        for d in debtors:
            debtors_by_branch.setdefault(d.branch_id, []).append(d)

        total_sales = 0
        total_amount = Decimal('0')
        sale_seq = Sale.objects.count() + 1
        today = timezone.localdate()

        for day_offset in range(days):
            sale_date = today - timedelta(days=day_offset)
            day_target = money(target_revenue / days) if days > 1 else target_revenue
            weights = [random.random() for _ in range(sales_per_day)]
            weight_sum = sum(weights)
            amounts = [money(day_target * Decimal(str(w / weight_sum))) for w in weights]

            pending = []

            for amount in amounts:
                if amount <= 0:
                    continue
                branch = random.choice(branches)
                products = products_by_branch.get(branch.id, [])
                if not products:
                    continue

                lines = self._build_cart_lines(products, amount)
                if not lines:
                    continue

                actual_amount = money(sum(Decimal(str(line['quantity'])) * line['unit_price'] for line in lines))
                cashier = random.choice(cashiers_by_branch.get(branch.id, [None]))
                cashier_name = cashier.full_name if cashier else 'Kassir'
                method = weighted_choice(PAYMENT_METHODS)
                hour = random.randint(8, 22)
                minute = random.randint(0, 59)
                external_id = f'TXN-BULK-{sale_date.strftime("%Y%m%d")}-{sale_seq:06d}'
                sale_seq += 1

                pending.append(
                    {
                        'branch': branch,
                        'external_id': external_id,
                        'date': sale_date,
                        'time': f'{hour:02d}:{minute:02d}',
                        'amount': actual_amount,
                        'method': method,
                        'cashier': cashier,
                        'cashier_name': cashier_name,
                        'lines': lines,
                    }
                )
                total_amount += actual_amount

            sales_batch = [
                Sale(
                    branch=p['branch'],
                    external_id=p['external_id'],
                    date=p['date'],
                    time=p['time'],
                    amount=p['amount'],
                    method=p['method'],
                    cashier=p['cashier'],
                    cashier_name=p['cashier_name'],
                    items=[
                        {
                            'name': line['product_name'],
                            'qty': line['quantity'],
                            'price': float(line['unit_price']),
                        }
                        for line in p['lines']
                    ],
                )
                for p in pending
            ]
            created_sales = Sale.objects.bulk_create(sales_batch, batch_size=300)
            total_sales += len(created_sales)

            lines_batch = []
            credit_charges = []
            accounts_to_update = {}

            for sale, pdata in zip(created_sales, pending, strict=False):
                for line in pdata['lines']:
                    lines_batch.append(
                        SaleLine(
                            sale=sale,
                            product_name=line['product_name'],
                            quantity=line['quantity'],
                            unit_price=line['unit_price'],
                        )
                    )

                if pdata['method'] != 'Nasiya':
                    continue
                branch_debtors = debtors_by_branch.get(pdata['branch'].id, [])
                if not branch_debtors:
                    continue
                acc = random.choice(branch_debtors)
                current = accounts_to_update.get(acc.id, acc)
                current.balance = money(current.balance + pdata['amount'])
                accounts_to_update[acc.id] = current
                credit_charges.append(
                    CreditTransaction(
                        account=current,
                        kind=CreditTransaction.Kind.CHARGE,
                        amount=pdata['amount'],
                        sale=sale,
                        cashier_name=pdata['cashier_name'],
                        note='Kassa nasiya',
                    )
                )

            SaleLine.objects.bulk_create(lines_batch, batch_size=500)
            if credit_charges:
                CreditTransaction.objects.bulk_create(credit_charges, batch_size=300)
            if accounts_to_update:
                CreditAccount.objects.bulk_update(
                    list(accounts_to_update.values()),
                    ['balance'],
                    batch_size=200,
                )

            day_sum = sum(p['amount'] for p in pending)
            self.stdout.write(f"  + {len(created_sales)} sotuv ({sale_date}) → {day_sum:,} so'm")

        return total_sales, money(total_amount)

    def _build_cart_lines(self, products, target_amount):
        if not products or target_amount <= 0:
            return []

        affordable = [p for p in products if p.selling_price <= target_amount]
        if not affordable:
            affordable = [min(products, key=lambda p: p.selling_price)]

        lines = []
        remaining = target_amount
        picks = random.randint(1, min(3, len(affordable)))
        chosen = random.sample(affordable, k=picks)

        for i, prod in enumerate(chosen):
            if prod.selling_price <= 0:
                continue
            if i == len(chosen) - 1:
                qty = max(1, int(remaining / prod.selling_price))
            else:
                max_qty = max(1, int(remaining / prod.selling_price))
                qty = random.randint(1, min(2, max_qty))
            qty = max(1, min(qty, 8))
            lines.append(
                {
                    'product_name': prod.name,
                    'quantity': qty,
                    'unit_price': prod.selling_price,
                }
            )
            remaining -= prod.selling_price * qty
            if remaining <= 0:
                break

        if not lines:
            prod = affordable[0]
            qty = max(1, min(8, int(target_amount / prod.selling_price)))
            lines.append(
                {
                    'product_name': prod.name,
                    'quantity': qty,
                    'unit_price': prod.selling_price,
                }
            )
        return lines
