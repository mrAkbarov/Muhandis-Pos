"""Magazin 001–100: har birida 300–500 sotuv, qarzdorlar (nasiya bilan bog'langan)."""

import random
from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.models import (
    Branch,
    CreditAccount,
    CreditTransaction,
    Product,
    Sale,
    SaleLine,
    User,
)

MAGazin_PREFIX = 'Magazin '
PAYMENT_METHODS = [
    ('Naqd', 0.40),
    ('Karta', 0.25),
    ('Online', 0.18),
    ('Nasiya', 0.12),
    ('Naqd+Karta', 0.05),
]

FIRST_NAMES = [
    'Aziz', 'Bobur', 'Dilshod', 'Malika', 'Nigora', 'Rustam', 'Sevara', 'Timur', 'Zilola',
]
LAST_NAMES = [
    'Karimov', 'Tursunov', 'Rahimov', 'Yusupov', 'Alimov',
]


def money(value):
    return Decimal(str(value)).quantize(Decimal('1'), rounding=ROUND_HALF_UP)


def weighted_choice(pairs):
    items, weights = zip(*pairs)
    return random.choices(items, weights=weights, k=1)[0]


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
        lines.append({
            'product_name': prod.name,
            'quantity': qty,
            'unit_price': prod.selling_price,
        })
        remaining -= prod.selling_price * qty
        if remaining <= 0:
            break

    if not lines:
        prod = affordable[0]
        qty = max(1, min(8, int(target_amount / prod.selling_price)))
        lines.append({
            'product_name': prod.name,
            'quantity': qty,
            'unit_price': prod.selling_price,
        })
    return lines


class Command(BaseCommand):
    help = 'Har Magazin filialiga 300–500 sotuv + qarz daftari (nasiya cheklar bilan)'

    def add_arguments(self, parser):
        parser.add_argument('--sales-min', type=int, default=300)
        parser.add_argument('--sales-max', type=int, default=500)
        parser.add_argument('--debtors-per-store', type=int, default=25)
        parser.add_argument('--days', type=int, default=30, help='Oxirgi N kun ichida sotuvlar')
        parser.add_argument('--seed', type=int, default=42)
        parser.add_argument('--limit-stores', type=int, default=0, help='0 = hammasi')
        parser.add_argument(
            '--skip-existing',
            action='store_true',
            help='Sotuvi bor filiallarni o\'tkazib yuborish',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Mavjud sotuv/qarzni o\'chirib qayta yaratish',
        )

    def handle(self, *args, **options):
        random.seed(options['seed'])
        sales_min = options['sales_min']
        sales_max = max(options['sales_max'], sales_min)
        debtors_n = options['debtors_per_store']
        days = max(1, options['days'])

        branches = list(
            Branch.objects.filter(name__startswith=MAGazin_PREFIX).order_by('name')
        )
        if options['limit_stores'] > 0:
            branches = branches[: options['limit_stores']]

        if not branches:
            self.stderr.write(self.style.ERROR('Magazin filiallari topilmadi'))
            return

        sale_seq = Sale.objects.count() + 1
        total_sales = 0
        total_debtors = 0
        today = timezone.localdate()

        for branch in branches:
            if options['skip_existing'] and not options['force'] and Sale.objects.filter(branch=branch).exists():
                self.stdout.write(f'  = {branch.name} (sotuv bor)')
                continue

            if options['force']:
                Sale.objects.filter(branch=branch).delete()
                CreditTransaction.objects.filter(account__branch=branch).delete()
                CreditAccount.objects.filter(branch=branch).delete()

            with transaction.atomic():
                n = self._seed_branch(
                    branch, sales_min, sales_max, debtors_n, days, today, sale_seq,
                )
                total_sales += n['sales']
                total_debtors += n['debtors']
                sale_seq = n['next_seq']
            self.stdout.write(
                f'  + {branch.name}: {n["sales"]} sotuv, {n["debtors"]} qarzdor, '
                f'{n["nasiya"]} nasiya'
            )

        self.stdout.write(self.style.SUCCESS(
            f'Tayyor: {total_sales} sotuv, {total_debtors} qarzdor ({len(branches)} magazin)'
        ))

    def _seed_branch(self, branch, sales_min, sales_max, debtors_n, days, today, sale_seq):
        products = list(Product.objects.filter(branch=branch))
        if not products:
            return {'sales': 0, 'debtors': 0, 'nasiya': 0, 'next_seq': sale_seq}

        cashiers = list(
            User.objects.filter(branch=branch, role=User.Role.CASHIER, is_active=True)
        )
        store_code = branch.name.replace('Magazin ', 'M').replace(' ', '')

        debtors = []
        phone_base = 940_000_000 + int(store_code.replace('M', '') or '0') * 100
        for i in range(debtors_n):
            phone_base += 1
            debtors.append(CreditAccount(
                branch=branch,
                customer_name=f'{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}',
                phone=str(phone_base),
                balance=Decimal('0'),
            ))
        CreditAccount.objects.bulk_create(debtors, batch_size=100)
        debtors = list(CreditAccount.objects.filter(branch=branch).order_by('id'))

        sale_count = random.randint(sales_min, sales_max)
        sales_batch = []
        lines_batch = []
        credit_charges = []
        accounts_to_update = {}
        nasiya_count = 0

        for _ in range(sale_count):
            r = random.random()
            if r < 0.35:
                day_offset = random.randint(0, 2)
            elif r < 0.70:
                day_offset = random.randint(0, 6)
            else:
                day_offset = random.randint(7, max(7, days - 1))
            sale_date = today - timedelta(days=day_offset)
            target = money(random.randint(15_000, 350_000))
            lines = build_cart_lines(products, target)
            if not lines:
                continue

            amount = money(sum(Decimal(str(l['quantity'])) * l['unit_price'] for l in lines))
            method = weighted_choice(PAYMENT_METHODS)
            hour = random.randint(8, 22)
            minute = random.randint(0, 59)
            external_id = f'TXN-{store_code}-{sale_seq:06d}'
            sale_seq += 1

            cashier = random.choice(cashiers) if cashiers else None
            sale = Sale(
                branch=branch,
                external_id=external_id,
                date=sale_date,
                time=f'{hour:02d}:{minute:02d}',
                amount=amount,
                method=method,
                cashier=cashier,
                cashier_name=cashier.full_name if cashier else 'Kassir',
                items=[{
                    'name': l['product_name'],
                    'qty': l['quantity'],
                    'price': float(l['unit_price']),
                } for l in lines],
            )
            sales_batch.append((sale, lines, method))

        created_sales = Sale.objects.bulk_create([s[0] for s in sales_batch], batch_size=300)

        for (sale_obj, lines, method), created in zip(sales_batch, created_sales):
            for line in lines:
                lines_batch.append(SaleLine(
                    sale=created,
                    product_name=line['product_name'],
                    quantity=line['quantity'],
                    unit_price=line['unit_price'],
                ))

            if method != 'Nasiya':
                continue

            acc = random.choice(debtors)
            nasiya_count += 1
            current = accounts_to_update.get(acc.id, acc)
            current.balance = money(current.balance + sale_obj.amount)
            accounts_to_update[acc.id] = current
            credit_charges.append(CreditTransaction(
                account=current,
                kind=CreditTransaction.Kind.CHARGE,
                amount=amount,
                sale=created,
                cashier_name=sale_obj.cashier_name,
                note='Nasiya savdo',
            ))

        SaleLine.objects.bulk_create(lines_batch, batch_size=500)
        if credit_charges:
            CreditTransaction.objects.bulk_create(credit_charges, batch_size=300)
            CreditAccount.objects.bulk_update(
                list(accounts_to_update.values()),
                ['balance'],
                batch_size=200,
            )

        debtors = list(CreditAccount.objects.filter(branch=branch))
        self._add_sample_payments(debtors)

        return {
            'sales': len(created_sales),
            'debtors': len(debtors),
            'nasiya': nasiya_count,
            'next_seq': sale_seq,
        }

    def _add_sample_payments(self, debtors):
        """Ba'zi qarzdorlardan qisman to'lov."""
        candidates = [d for d in debtors if d.balance > 0]
        random.shuffle(candidates)
        payers = candidates[: min(5, len(candidates))]
        tx_batch = []
        for acc in payers:
            acc.refresh_from_db()
            if acc.balance <= 0:
                continue
            pay = money(acc.balance * Decimal(str(random.uniform(0.2, 0.6))))
            if pay <= 0:
                continue
            acc.balance = money(acc.balance - pay)
            tx_batch.append(CreditTransaction(
                account=acc,
                kind=CreditTransaction.Kind.PAYMENT,
                amount=pay,
                note='To\'lov',
                cashier_name='Kassir',
            ))
        if payers:
            CreditAccount.objects.bulk_update(payers, ['balance'], batch_size=50)
        if tx_batch:
            CreditTransaction.objects.bulk_create(tx_batch, batch_size=50)
