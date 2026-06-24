"""100 ta Magazin ekotizimi — filial, xodim, mahsulot, diler, qarzdor, sotuv."""

import random
import string
from datetime import timedelta
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path

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

MAGazin_PREFIX = 'Magazin '

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

SUPPLIER_STEMS = [
    'Coca-Cola',
    'PepsiCo',
    'Nestle',
    'Lactalis',
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

SIZES = ['250g', '500g', '1kg', '1L', '0.5L', '1.5L', '330ml', '50g', '100g', 'dona']
UNITS = ['dona', 'litr', 'kg', 'gr', 'pachka', 'quti']
EMOJIS = ['🥤', '🥛', '🍫', '🍟', '🫓', '🥩', '🧴', '🍎', '📦', '🧃']

PAYMENT_METHODS = [
    ('Naqd', 0.34),
    ('Karta', 0.22),
    ('Online', 0.14),
    ('Nasiya', 0.12),
    ('Naqd+Karta', 0.10),
    ('Naqd+Online', 0.04),
    ('Karta+Online', 0.04),
]


def money(value):
    return Decimal(str(value)).quantize(Decimal('1'), rounding=ROUND_HALF_UP)


def weighted_choice(pairs):
    items, weights = zip(*pairs, strict=False)
    return random.choices(items, weights=weights, k=1)[0]


def store_code(n: int) -> str:
    return f'm{n:03d}'


def primary_branch_name(n: int) -> str:
    return f'Magazin {n:03d}'


def extra_branch_name(n: int, idx: int) -> str:
    return f'Magazin {n:03d} · F{idx}'


def store_number_from_branch(name: str) -> int:
    if not name.startswith(MAGazin_PREFIX):
        return 0
    digits = ''.join(ch for ch in name.split(' · ')[0] if ch.isdigit())
    return int(digits) if digits else 0


def list_store_numbers(count=100):
    return list(range(1, count + 1))


def get_store_branches(store_n: int):
    primary = primary_branch_name(store_n)
    branches = list(Branch.objects.filter(name__startswith=primary).order_by('name'))
    return branches


def get_primary_branch(store_n: int):
    return Branch.objects.filter(name=primary_branch_name(store_n)).first()


def barcode_for(store_idx: int, prod_idx: int) -> str:
    return f'891{store_idx:03d}{prod_idx:05d}'


def build_cart_lines(products, target_amount):
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


def payment_breakdown_for(method, amount):
    """Aralash to'lov — masalan 7000 karta + 3000 naqd."""
    amount = money(amount)
    if method == 'Naqd+Karta':
        card_share = Decimal(str(random.uniform(0.35, 0.75)))
        card = money(amount * card_share)
        cash = amount - card
        return {'Naqd': float(cash), 'Karta': float(card)}
    if method == 'Naqd+Online':
        online_share = Decimal(str(random.uniform(0.25, 0.65)))
        online = money(amount * online_share)
        cash = amount - online
        return {'Naqd': float(cash), 'Online': float(online)}
    if method == 'Karta+Online':
        online_share = Decimal(str(random.uniform(0.25, 0.65)))
        online = money(amount * online_share)
        card = amount - online
        return {'Karta': float(card), 'Online': float(online)}
    return {}


def ensure_categories():
    categories = []
    for name in CATEGORIES:
        cat, _ = Category.objects.get_or_create(name=name)
        categories.append(cat)
    return categories


def ensure_superadmin(password='123'):
    if User.objects.filter(username='superadmin').exists():
        return
    User.objects.create_user(
        username='superadmin',
        password=password,
        phone='900000001',
        first_name='Super',
        last_name='Admin',
        role=User.Role.ADMIN,
        branch=None,
        is_staff=True,
    )


@transaction.atomic
def ensure_store_branches(store_n, branches_min=1, branches_max=3):
    """1–3 filial: Magazin 001, Magazin 001 · F2, ..."""
    created = 0
    branch_count = random.randint(branches_min, branches_max)
    names = [primary_branch_name(store_n)]
    for i in range(2, branch_count + 1):
        names.append(extra_branch_name(store_n, i))

    branches = []
    for name in names:
        branch, was_created = Branch.objects.get_or_create(
            name=name,
            defaults={
                'address': f'Toshkent, {name}',
                'phone': str(900000100 + store_n),
            },
        )
        Warehouse.objects.get_or_create(branch=branch, name='Asosiy ombor')
        branches.append(branch)
        if was_created:
            created += 1
    return branches, created


@transaction.atomic
def ensure_store_users(store_n, password='123', cashiers_min=2, cashiers_max=4, lines=None):
    """Har magazinda: 1 admin, 1 manager, 2–4 kassir (asosiy filialda)."""
    code = store_code(store_n)
    primary = get_primary_branch(store_n)
    if not primary:
        branches, _ = ensure_store_branches(store_n)
        primary = branches[0]

    cashier_count = random.randint(cashiers_min, cashiers_max)
    store_users = [
        ('admin', User.Role.ADMIN, 'Admin', '—'),
        ('manager', User.Role.MANAGER, 'Menejer', '—'),
    ]
    for i in range(1, cashier_count + 1):
        store_users.append((f'kassir{i}', User.Role.CASHIER, f'Kassir{i}', '—'))

    created = 0
    if lines is not None:
        lines.append(f'## {primary.name} ({code})')

    for idx, (suffix, role, first_name, last_name) in enumerate(store_users):
        username = f'{code}.{suffix}'
        if User.objects.filter(username=username).exists():
            if lines is not None:
                lines.append(f'{username}\t{password}\t{role}')
            continue

        phone = str(900000001 + (store_n - 1) * 10 + idx)
        while User.objects.filter(phone=phone).exists():
            phone = str(int(phone) + 1)

        User.objects.create_user(
            username=username,
            password=password,
            phone=phone,
            first_name=first_name,
            last_name=last_name,
            role=role,
            branch=primary,
        )
        created += 1
        if lines is not None:
            lines.append(f'{username}\t{password}\t{role}')

    if lines is not None:
        lines.append('')
    return created


def clear_store_data(store_n, primary_only=False):
    """Magazin ma'lumotlarini tozalash."""
    branches = get_store_branches(store_n)
    if primary_only:
        branches = [b for b in branches if b.name == primary_branch_name(store_n)]
    for branch in branches:
        Sale.objects.filter(branch=branch).delete()
        CreditTransaction.objects.filter(account__branch=branch).delete()
        CreditAccount.objects.filter(branch=branch).delete()
        Supplier.objects.filter(branch=branch).delete()
        Product.objects.filter(branch=branch).delete()


@transaction.atomic
def seed_store_products(store_n, categories, products_min=500, products_max=1000, force=False):
    branches = get_store_branches(store_n)
    if not branches:
        return 0

    total_target = random.randint(products_min, products_max)
    existing = sum(Product.objects.filter(branch=b).count() for b in branches)
    if existing >= products_min and not force:
        return 0

    if force:
        for b in branches:
            Product.objects.filter(branch=b).delete()

    per_branch = max(1, total_target // len(branches))
    remainder = total_target - per_branch * len(branches)
    created_total = 0
    store_idx = store_n

    for bi, branch in enumerate(branches):
        count = per_branch + (1 if bi < remainder else 0)
        warehouse = Warehouse.objects.filter(branch=branch).first()
        if not warehouse:
            warehouse, _ = Warehouse.objects.get_or_create(branch=branch, name='Asosiy ombor')

        used_names = set()
        batch = []
        base_idx = bi * 10000
        for pi in range(1, count + 1):
            stem = random.choice(PRODUCT_STEMS)
            size = random.choice(SIZES)
            name = f'{stem} {size}'
            while name in used_names:
                name = f'{stem} {size} {random.choice(string.ascii_uppercase)}'
            used_names.add(name)

            cost = money(random.randint(3_000, 95_000))
            price = money(cost * Decimal(str(random.uniform(1.1, 1.4))))
            stock = random.randint(50, 800)
            batch.append(
                Product(
                    name=name[:50],
                    barcode=barcode_for(store_idx, base_idx + pi),
                    category=random.choice(categories),
                    branch=branch,
                    selling_price=price,
                    base_price=cost,
                    emoji=random.choice(EMOJIS),
                    size=size,
                    unit=random.choice(UNITS),
                    stock=stock,
                )
            )

        created = Product.objects.bulk_create(batch, batch_size=300)
        inv = [InventoryItem(product=p, warehouse=warehouse, quantity=p.stock) for p in created]
        InventoryItem.objects.bulk_create(inv, batch_size=300, ignore_conflicts=True)
        created_total += len(created)

    return created_total


@transaction.atomic
def seed_store_suppliers(store_n, suppliers_min=30, suppliers_max=50, force=False):
    primary = get_primary_branch(store_n)
    if not primary:
        return 0, 0

    existing = Supplier.objects.filter(branch=primary).count()
    target = random.randint(suppliers_min, suppliers_max)
    if existing >= suppliers_min and not force:
        return 0, 0

    if force:
        Supplier.objects.filter(branch=primary).delete()

    products = list(Product.objects.filter(branch__name__startswith=primary_branch_name(store_n)))
    if not products:
        return 0, 0

    phone_base = 930_000_000 + store_n * 1000
    suppliers = []
    for i in range(target):
        phone_base += 1
        stem = random.choice(SUPPLIER_STEMS)
        name = f'{stem} {store_n}-{i + 1}'[:50]
        suppliers.append(
            Supplier(
                branch=primary,
                name=name,
                phone=str(phone_base),
                address=f'{primary.name} tumani',
                agent_name=f'{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}',
                agent_phone=str(phone_base + 50_000),
                total_orders=random.randint(5, 120),
                status='Faol',
            )
        )

    Supplier.objects.bulk_create(suppliers, batch_size=200)
    created = list(Supplier.objects.filter(branch=primary).order_by('-id')[:target])

    catalog_batch = []
    for sup in created:
        pick_count = min(random.randint(8, 25), len(products))
        picks = random.sample(products, k=pick_count)
        for prod in picks:
            catalog_batch.append(
                SupplierCatalogItem(
                    supplier=sup,
                    name=prod.name,
                    category=prod.category.name if prod.category else '',
                    default_cost=prod.base_price,
                    size=prod.size or '',
                    unit=prod.unit or 'dona',
                    barcode=prod.barcode,
                    product=prod,
                )
            )

    SupplierCatalogItem.objects.bulk_create(catalog_batch, batch_size=500)
    return len(created), len(catalog_batch)


@transaction.atomic
def seed_store_debtors(store_n, debtors_min=200, debtors_max=300, force=False):
    primary = get_primary_branch(store_n)
    if not primary:
        return 0

    existing = CreditAccount.objects.filter(branch=primary).count()
    target = random.randint(debtors_min, debtors_max)
    if existing >= debtors_min and not force:
        return 0

    if force:
        CreditTransaction.objects.filter(account__branch=primary).delete()
        CreditAccount.objects.filter(branch=primary).delete()

    phone_base = 940_000_000 + store_n * 1000
    batch = []
    for _i in range(target):
        phone_base += 1
        batch.append(
            CreditAccount(
                branch=primary,
                customer_name=f'{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}',
                phone=str(phone_base),
                balance=Decimal('0'),
            )
        )
    CreditAccount.objects.bulk_create(batch, batch_size=300)
    return target


def _create_sale_batch_multi(
    branch_pool,
    products_by_branch,
    sale_date,
    count,
    revenue_target,
    cashiers,
    debtors,
    store_code_str,
    sale_seq_start,
    hour_range=(8, 22),
):
    """Bir nechta filialdan sotuv — revenue_target yoki count limit."""
    sales_data = []
    total_revenue = Decimal('0')
    sale_seq = sale_seq_start
    attempts = 0
    max_attempts = max(count * 4, 500)

    while len(sales_data) < count and total_revenue < revenue_target and attempts < max_attempts:
        attempts += 1
        branch = random.choice(branch_pool)
        products = products_by_branch.get(branch.id, [])
        if not products:
            continue

        remaining = revenue_target - total_revenue
        if remaining <= 0 and len(sales_data) >= count * 0.9:
            break

        avg_needed = remaining / max(1, count - len(sales_data))
        target = money(max(5000, min(int(avg_needed * Decimal('1.15')), 450_000)))
        lines = build_cart_lines(products, target)
        if not lines:
            continue

        amount = money(sum(Decimal(str(lines['quantity'])) * lines['unit_price'] for lines in lines))
        if amount <= 0:
            continue

        method = weighted_choice(PAYMENT_METHODS)
        breakdown = payment_breakdown_for(method, amount)
        hour = random.randint(*hour_range)
        minute = random.randint(0, 59)
        external_id = f'TXN-{store_code_str.upper()}-{sale_seq:07d}'
        sale_seq += 1

        cashier = random.choice(cashiers) if cashiers else None
        sales_data.append(
            {
                'branch': branch,
                'external_id': external_id,
                'date': sale_date,
                'time': f'{hour:02d}:{minute:02d}',
                'amount': amount,
                'method': method,
                'payment_breakdown': breakdown,
                'cashier': cashier,
                'cashier_name': cashier.full_name if cashier else 'Kassir',
                'lines': lines,
            }
        )
        total_revenue += amount

    return sales_data, sale_seq, total_revenue


def _create_sale_batch(
    branch,
    sale_date,
    count,
    revenue_target,
    products,
    cashiers,
    debtors,
    store_code_str,
    sale_seq_start,
    hour_range=(8, 22),
):
    return _create_sale_batch_multi(
        [branch],
        {branch.id: products},
        sale_date,
        count,
        revenue_target,
        cashiers,
        debtors,
        store_code_str,
        sale_seq_start,
        hour_range,
    )


def _persist_sales(sales_data, debtors):
    if not sales_data:
        return 0, Decimal('0')

    sales_batch = [
        Sale(
            branch=d['branch'],
            external_id=d['external_id'],
            date=d['date'],
            time=d['time'],
            amount=d['amount'],
            method=d['method'],
            payment_breakdown=d.get('payment_breakdown') or {},
            cashier=d['cashier'],
            cashier_name=d['cashier_name'],
            items=[
                {
                    'name': lines['product_name'],
                    'qty': lines['quantity'],
                    'price': float(lines['unit_price']),
                }
                for lines in d['lines']
            ],
        )
        for d in sales_data
    ]
    created = Sale.objects.bulk_create(sales_batch, batch_size=400)

    lines_batch = []
    credit_charges = []
    accounts_to_update = {}

    for sale_obj, d in zip(created, sales_data, strict=False):
        for line in d['lines']:
            lines_batch.append(
                SaleLine(
                    sale=sale_obj,
                    product_name=line['product_name'],
                    quantity=line['quantity'],
                    unit_price=line['unit_price'],
                )
            )

        if d['method'] != 'Nasiya' or not debtors:
            continue
        acc = random.choice(debtors)
        current = accounts_to_update.get(acc.id, acc)
        current.balance = money(current.balance + d['amount'])
        accounts_to_update[acc.id] = current
        credit_charges.append(
            CreditTransaction(
                account=current,
                kind=CreditTransaction.Kind.CHARGE,
                amount=d['amount'],
                sale=sale_obj,
                cashier_name=d['cashier_name'],
                note='Nasiya savdo',
            )
        )

    SaleLine.objects.bulk_create(lines_batch, batch_size=500)
    if credit_charges:
        CreditTransaction.objects.bulk_create(credit_charges, batch_size=300)
        CreditAccount.objects.bulk_update(
            list(accounts_to_update.values()),
            ['balance'],
            batch_size=200,
        )

    total = sum(d['amount'] for d in sales_data)
    return len(created), total


@transaction.atomic
def seed_store_sales(
    store_n,
    today_sales_min=800,
    today_sales_max=1000,
    revenue_min=5_000_000,
    revenue_max=10_000_000,
    history_days=7,
    force=False,
    sale_seq_start=1,
):
    branches = get_store_branches(store_n)
    primary = get_primary_branch(store_n)
    if not branches or not primary:
        return {'sales': 0, 'revenue': Decimal('0'), 'next_seq': sale_seq_start}

    if force:
        for b in branches:
            Sale.objects.filter(branch=b).delete()
        CreditTransaction.objects.filter(account__branch=primary, kind='charge').delete()
        CreditAccount.objects.filter(branch=primary).update(balance=Decimal('0'))

    products_by_branch = {b.id: list(Product.objects.filter(branch=b)) for b in branches}
    if not any(products_by_branch.values()):
        return {'sales': 0, 'revenue': Decimal('0'), 'next_seq': sale_seq_start}

    cashiers = list(User.objects.filter(branch=primary, role=User.Role.CASHIER, is_active=True))
    debtors = list(CreditAccount.objects.filter(branch=primary))
    code = store_code(store_n)
    today = timezone.localdate()
    branch_pool = [b for b in branches if products_by_branch.get(b.id)]

    today_target = money(random.randint(revenue_min, revenue_max))
    today_count = random.randint(today_sales_min, today_sales_max)

    # Har magazin uchun tasodifiy faollik (monitoring uchun aralash holat)
    activity_roll = random.random()
    if activity_roll < 0.15:
        activity = 'inactive'
    elif activity_roll < 0.40:
        activity = 'low'
    else:
        activity = 'active'

    all_sales_data = []
    sale_seq = sale_seq_start

    if activity == 'active':
        today_batch, sale_seq, _ = _create_sale_batch_multi(
            branch_pool,
            products_by_branch,
            today,
            today_count,
            today_target,
            cashiers,
            debtors,
            code,
            sale_seq,
        )
        all_sales_data.extend(today_batch)
        for day_offset in range(1, min(history_days, 7) + 1):
            sale_date = today - timedelta(days=day_offset)
            day_count = random.randint(80, 150)
            day_revenue = money(today_target * Decimal('0.12'))
            day_batch, sale_seq, _ = _create_sale_batch_multi(
                branch_pool,
                products_by_branch,
                sale_date,
                day_count,
                day_revenue,
                cashiers,
                debtors,
                code,
                sale_seq,
            )
            all_sales_data.extend(day_batch)
    elif activity == 'low':
        # Oxirgi 7 kun yo'q — faqat 8–28 kun oldin
        for day_offset in range(8, 29):
            sale_date = today - timedelta(days=day_offset)
            day_count = random.randint(40, 90)
            day_revenue = money(today_target * Decimal('0.08'))
            day_batch, sale_seq, _ = _create_sale_batch_multi(
                branch_pool,
                products_by_branch,
                sale_date,
                day_count,
                day_revenue,
                cashiers,
                debtors,
                code,
                sale_seq,
            )
            all_sales_data.extend(day_batch)
    else:
        # Ishlatmayapti — 31–60 kun oldin (30 kun ichida savdo yo'q)
        for day_offset in range(31, 46):
            sale_date = today - timedelta(days=day_offset)
            day_count = random.randint(30, 70)
            day_revenue = money(today_target * Decimal('0.06'))
            day_batch, sale_seq, _ = _create_sale_batch_multi(
                branch_pool,
                products_by_branch,
                sale_date,
                day_count,
                day_revenue,
                cashiers,
                debtors,
                code,
                sale_seq,
            )
            all_sales_data.extend(day_batch)

    count, revenue = _persist_sales(all_sales_data, debtors)
    return {'sales': count, 'revenue': revenue, 'next_seq': sale_seq}


def export_logins(path, password, count=100):
    lines = [
        '# SmartPOS — magazin loginlari',
        f'# Parol (hamma uchun): {password}',
        '# Platform admin: superadmin',
        '',
        f'superadmin\t{password}\t(platform admin)',
        '',
    ]
    for store_n in range(1, count + 1):
        ensure_store_users(store_n, password=password, lines=lines)
    out = Path(path)
    if not out.is_absolute():
        out = Path(__file__).resolve().parents[3] / path
    out.write_text('\n'.join(lines), encoding='utf-8')
    return out
