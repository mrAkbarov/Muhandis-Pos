import random
import string
from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker

from apps.models import (
    AgentOrder,
    Branch,
    Category,
    CreditAccount,
    CreditTransaction,
    InventoryItem,
    PosCartDraft,
    Product,
    PurchaseOrder,
    PurchaseOrderLine,
    Sale,
    SaleLine,
    Supplier,
    SupplierCatalogItem,
    User,
    Warehouse,
)

fake = Faker("uz_UZ")

random.seed(2026)
Faker.seed(2026)


PHONE_PREFIXES = [
    "90",
    "91",
    "93",
    "94",
    "95",
    "97",
    "98",
    "99",
]


SUPPLIERS = [
    "Castrol",
    "Hyundai XTeer",
    "Rowe",
    "Mobil",
    "Shell",
    "Liqui Moly",
    "Mannol",
    "ZIC",
    "Lukoil",
    "Rosneft",
    "Kixx",
    "Total",
    "Elf",
    "Ravenol",
    "Motul",
]


OIL_PRODUCTS = [
    "5W30 SN",
    "5W40 SN",
    "10W40",
    "15W40",
    "20W50",
    "0W20",
    "0W30",
]

FILTERS = [
    "Oil Filter",
    "Air Filter",
    "Fuel Filter",
    "Cabin Filter",
]

ANTIFREEZE = [
    "G11 Green",
    "G12 Red",
    "G12+",
]

ATF = [
    "ATF III",
    "ATF VI",
]

BRAKE = [
    "DOT-3",
    "DOT-4",
]


def uz_phone():
    prefix = random.choice(PHONE_PREFIXES)
    return f"{prefix}{random.randint(1000000,9999999)}"


def barcode():
    return "".join(random.choices(string.digits, k=13))


def money(a, b):
    return Decimal(random.randrange(a, b))


def random_date(days=120):
    return date.today() - timedelta(days=random.randint(0, days))


def random_time():
    h = random.randint(8, 21)
    m = random.randint(0, 59)
    return f"{h:02}:{m:02}"


class Command(BaseCommand):


    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='clear old demo data')
        parser.add_argument('--products', type=int, default=50)
        parser.add_argument('--sales', type=int, default=500)


    @transaction.atomic
    def handle(self, *args, **options):

        self.clear = options["clear"]
        self.product_count = options["products"]
        self.sale_count = options["sales"]

        self.stdout.write("")
        self.stdout.write("=" * 70)
        self.stdout.write(self.style.SUCCESS("MUHANDIS POS DEMO SEEDER"))
        self.stdout.write("=" * 70)

        if self.clear:
            self.clear_database()

        self.create_branch()
        self.create_users()
        self.create_categories()
        self.create_suppliers()
        self.create_products()
        self.create_supplier_catalog()
        self.create_warehouses()
        self.create_inventory()
        self.create_purchase_orders()
        self.create_sales()
        self.create_credit_accounts()
        self.create_credit_transactions()
        self.create_agent_orders()
        self.create_pos_drafts()

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('Demo database successfully created!'))
        self.stdout.write(self.style.SUCCESS('=' * 60))


    def clear_database(self):

        self.stdout.write('Cleaning old demo data...')

        PosCartDraft.objects.all().delete()
        CreditTransaction.objects.all().delete()
        CreditAccount.objects.all().delete()

        SaleLine.objects.all().delete()
        Sale.objects.all().delete()

        PurchaseOrderLine.objects.all().delete()
        PurchaseOrder.objects.all().delete()

        InventoryItem.objects.all().delete()

        Warehouse.objects.all().delete()

        SupplierCatalogItem.objects.all().delete()
        AgentOrder.objects.all().delete()
        Supplier.objects.all().delete()

        Product.objects.all().delete()
        Category.objects.all().delete()

        User.objects.exclude(is_superuser=True).delete()

        Branch.objects.all().delete()

    def create_branch(self):
        self.stdout.write('Creating branch...')

        self.branch, _ = Branch.objects.get_or_create(
            name='Muhandis POS - Sergeli',
            defaults={
                'address': "Toshkent shahri, Sergeli tumani, Yangi Sergeli ko'chasi 18-uy",
                'phone': '902345678',
            },
        )

        self.stdout.write(self.style.SUCCESS(f'Filial yaratildi: {self.branch.name}'))

    def create_users(self):

        self.stdout.write('Creating users...')

        users = [
            {
                'username': 'admin',
                'password': 'admin123',
                'phone': '901111111',
                'first_name': 'Muhammad',
                'last_name': 'Karimov',
                'role': User.Role.ADMIN,
                'branch': None,
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'username': 'owner',
                'password': 'owner123',
                'phone': '901111112',
                'first_name': 'Anvar',
                'last_name': 'Usmonov',
                'role': User.Role.OWNER,
                'branch': None,
            },
            {
                'username': 'boss',
                'password': 'boss123',
                'phone': '901111113',
                'first_name': 'Javlon',
                'last_name': "Abdug'aniyev",
                'role': User.Role.BOSS,
                'branch': None,
            },
            {
                'username': 'manager',
                'password': 'manager123',
                'phone': '901111114',
                'first_name': 'Bekzod',
                'last_name': 'Xolmatov',
                'role': User.Role.MANAGER,
                'branch': self.branch,
            },
            {
                'username': 'cashier1',
                'password': 'cashier123',
                'phone': '901111115',
                'first_name': 'Sardor',
                'last_name': 'Ergashev',
                'role': User.Role.CASHIER,
                'branch': self.branch,
            },
            {
                'username': 'cashier2',
                'password': 'cashier123',
                'phone': '901111116',
                'first_name': 'Aziz',
                'last_name': 'Rahimov',
                'role': User.Role.CASHIER,
                'branch': self.branch,
            },
            {
                'username': 'cashier3',
                'password': 'cashier123',
                'phone': '901111117',
                'first_name': 'Jamshid',
                'last_name': 'Tursunov',
                'role': User.Role.CASHIER,
                'branch': self.branch,
            },
            {
                'username': 'cashier4',
                'password': 'cashier123',
                'phone': '901111118',
                'first_name': 'Dilshod',
                'last_name': 'Qodirov',
                'role': User.Role.CASHIER,
                'branch': self.branch,
            },
        ]

        created = []

        for data in users:
            password = data.pop('password')

            user = User.objects.filter(username=data['username']).first()

            if user:
                created.append(user)
                continue

            user = User(**data)
            user.set_password(password)  # save() dan OLDIN password hash bo'ladi
            user.save()

            created.append(user)

        self.users = created

        self.stdout.write(self.style.SUCCESS(f'{len(created)} ta foydalanuvchi yaratildi.'))

    def create_categories(self):

        self.stdout.write('Creating categories...')

        categories = [
            'Motor moylari',
            'Filtrlar',
            'Antifriz',
            'ATF',
            'Tormoz suyuqligi',
            'GUR moyi',
            'Avtokimyo',
            'Akkumulyator',
            'Yuvish vositalari',
            'Aksessuarlar',
        ]

        created = []

        for name in categories:
            category, _ = Category.objects.get_or_create(name=name)

            created.append(category)

        self.categories = created

        self.stdout.write(self.style.SUCCESS(f'{len(created)} ta kategoriya yaratildi.'))


    def create_products(self):

        self.stdout.write('Creating products...')

        products = [
            ('Hyundai XTeer Gasoline Ultra Protection 5W30', 'Motor moylari', 89000, 122000),
            ('Hyundai XTeer Diesel Ultra 10W40', 'Motor moylari', 94000, 129000),
            ('Hyundai XTeer G700 5W40', 'Motor moylari', 98000, 136000),
            ('Hyundai XTeer Top Prime 0W20', 'Motor moylari', 118000, 158000),
            ('Castrol Magnatec 10W40', 'Motor moylari', 96000, 139000),
            ('Castrol GTX 15W40', 'Motor moylari', 92000, 132000),
            ('Castrol EDGE 5W30', 'Motor moylari', 142000, 186000),
            ('Shell Helix HX7 10W40', 'Motor moylari', 101000, 145000),
            ('Shell Helix Ultra 5W40', 'Motor moylari', 148000, 194000),
            ('Mobil Super 2000 10W40', 'Motor moylari', 99000, 142000),
            ('Mobil 1 ESP 5W30', 'Motor moylari', 151000, 199000),
            ('Liqui Moly Top Tec 4200', 'Motor moylari', 168000, 224000),
            ('Mann W914/2 Moy filtri', 'Filtrlar', 22000, 33000),
            ('Bosch H201 Moy filtri', 'Filtrlar', 18000, 29000),
            ('Mahle OC467 Moy filtri', 'Filtrlar', 21000, 32000),
            ('Hyundai Antifriz Qizil', 'Antifriz', 42000, 59000),
            ('Hyundai Antifriz Yashil', 'Antifriz', 42000, 59000),
            ('DOT-4 Tormoz suyuqligi', 'Tormoz suyuqligi', 24000, 36000),
            ('ATF Dexron III', 'ATF', 73000, 99000),
            ('GUR Power Steering Fluid', 'GUR moyi', 61000, 85000),
            ("Wynn's Injector Cleaner", 'Avtokimyo', 45000, 67000),
            ('Engine Flush', 'Avtokimyo', 39000, 58000),
            ('Shisha yuvish suyuqligi', 'Yuvish vositalari', 12000, 20000),
            ('Akumulyator 75Ah', 'Akkumulyator', 720000, 810000),
            ('Voronka', 'Aksessuarlar', 14000, 25000),
            ('Moy quyish idishi', 'Aksessuarlar', 17000, 28000),
        ]

        created = []

        for name, category_name, cost, price in products:
            category = Category.objects.get(name=category_name)

            product, _ = Product.objects.get_or_create(
                branch=self.branch,
                name=name,
                defaults={
                    'barcode': barcode(),
                    'category': category,
                    'selling_price': Decimal(price),
                    'base_price': Decimal(cost),
                    'stock': random.randint(20, 250),
                    'emoji': '🛢️',
                    'size': random.choice(
                        [
                            '1L',
                            '4L',
                            '5L',
                            '208L',
                        ]
                    ),
                    'unit': 'dona',
                },
            )

            created.append(product)

        self.products = created

        self.stdout.write(self.style.SUCCESS(f'{len(created)} ta mahsulot yaratildi.'))

    def create_suppliers(self):

        self.stdout.write('Creating suppliers...')

        suppliers = [
            {
                'name': 'Hyundai XTeer Uzbekistan',
                'agent': 'Jasur Xasanov',
                'phone': uz_phone(),
                'address': 'Toshkent sh. Sergeli tumani',
            },
            {
                'name': 'Castrol Distribution',
                'agent': 'Bekzod Karimov',
                'phone': uz_phone(),
                'address': 'Toshkent sh. Chilonzor tumani',
            },
            {
                'name': 'Shell Lubricants',
                'agent': 'Akbar Ergashev',
                'phone': uz_phone(),
                'address': 'Toshkent sh. Uchtepa tumani',
            },
            {
                'name': 'Mobil Oil Uzbekistan',
                'agent': 'Sherzod Mamatqulov',
                'phone': uz_phone(),
                'address': 'Toshkent sh. Yakkasaroy tumani',
            },
            {
                'name': 'Liqui Moly Official',
                'agent': 'Dilshod Rustamov',
                'phone': uz_phone(),
                'address': 'Toshkent sh. Olmazor tumani',
            },
            {
                'name': 'Mann Filter',
                'agent': "Ulug'bek Abdullayev",
                'phone': uz_phone(),
                'address': 'Toshkent sh. Yunusobod tumani',
            },
            {
                'name': 'Bosch Auto Parts',
                'agent': 'Sardor Ergashev',
                'phone': uz_phone(),
                'address': 'Toshkent viloyati',
            },
            {
                'name': 'Mahle Original',
                'agent': 'Javohir Qodirov',
                'phone': uz_phone(),
                'address': 'Toshkent sh. Bektemir tumani',
            },
        ]

        created = []

        for item in suppliers:
            supplier, _ = Supplier.objects.get_or_create(
                branch=self.branch,
                name=item['name'],
                defaults={
                    'phone': item['phone'],
                    'address': item['address'],
                    'agent_name': item['agent'],
                    'agent_phone': uz_phone(),
                    'status': 'Faol',
                    'total_orders': random.randint(20, 300),
                },
            )

            created.append(supplier)

        self.suppliers = created

        self.stdout.write(self.style.SUCCESS(f'{len(created)} ta diler yaratildi.'))

    def create_supplier_catalog(self):

        self.stdout.write('Creating supplier catalog...')

        created = []

        for supplier in self.suppliers:
            # har bir diler barcha mahsulotlarni sotmaydi
            catalog_products = random.sample(
                self.products,
                random.randint(12, min(20, len(self.products))),
            )

            for product in catalog_products:
                item, _ = SupplierCatalogItem.objects.get_or_create(
                    supplier=supplier,
                    name=product.name,
                    defaults={
                        'category': product.category.name,
                        'default_cost': product.base_price,
                        'item_type': 'Motor moyi',
                        'size': product.size,
                        'unit': product.unit,
                        'barcode': product.barcode,
                        'product': product,
                    },
                )

                created.append(item)

        self.catalog_items = created

        self.stdout.write(self.style.SUCCESS(f'{len(created)} ta katalog mahsuloti yaratildi.'))

    def create_warehouses(self):

        self.stdout.write('Creating warehouses...')

        warehouses = [
            'Asosiy ombor',
            'Savdo zali',
            'Zaxira ombor',
        ]

        created = []

        for name in warehouses:
            warehouse, _ = Warehouse.objects.get_or_create(
                branch=self.branch,
                name=name,
            )

            created.append(warehouse)

        self.warehouses = created

        self.stdout.write(self.style.SUCCESS(f'{len(created)} ta ombor yaratildi.'))

    def create_inventory(self):

        self.stdout.write('Creating inventory...')

        created = []

        main = self.warehouses[0]
        shop = self.warehouses[1]
        reserve = self.warehouses[2]

        for product in self.products:
            total = product.stock

            reserve_qty = random.randint(0, total // 3)

            remain = total - reserve_qty

            shop_qty = random.randint(0, remain)

            main_qty = remain - shop_qty

            for warehouse, qty in (
                (main, main_qty),
                (shop, shop_qty),
                (reserve, reserve_qty),
            ):
                item, _ = InventoryItem.objects.get_or_create(
                    warehouse=warehouse,
                    product=product,
                    defaults={
                        'quantity': qty,
                    },
                )

                created.append(item)

        self.inventory = created

        self.stdout.write(self.style.SUCCESS(f'{len(created)} ta inventory yozuvi yaratildi.'))

    def create_purchase_orders(self):

        self.stdout.write('Creating purchase orders...')

        created_orders = []
        created_lines = []

        for i in range(80):
            supplier = random.choice(self.suppliers)

            order = PurchaseOrder.objects.create(
                branch=self.branch,
                external_id=f'PO-{2026}{1000 + i}',
                supplier=supplier,
                supplier_name=supplier.name,
                date=date.today() - timedelta(days=random.randint(1, 180)),
                receipt_date=date.today() - timedelta(days=random.randint(0, 180)),
                status=random.choices(
                    [
                        'Yetkazilgan',
                        'Yetkazilyapti',
                        'Kutilmoqda',
                    ],
                    weights=[75, 15, 10],
                )[0],
                total=0,
            )

            total = Decimal('0')

            catalog_items = list(supplier.catalog.all())

            if not catalog_items:
                continue

            selected = random.sample(
                catalog_items,
                random.randint(
                    2,
                    min(8, len(catalog_items)),
                ),
            )

            for item in selected:
                qty = random.randint(2, 40)

                line_total = item.default_cost * qty

                PurchaseOrderLine.objects.create(
                    order=order,
                    product=item.product,
                    catalog_item=item,
                    name=item.name,
                    quantity=qty,
                    item_type=item.item_type,
                    size=item.size,
                    unit=item.unit,
                    cost_price=item.default_cost,
                )

                total += line_total

            order.total = total
            order.save(update_fields=['total'])

            created_orders.append(order)

        self.purchase_orders = created_orders

        self.stdout.write(self.style.SUCCESS(f'{len(created_orders)} ta purchase order yaratildi.'))

    def create_sales(self):

        self.stdout.write('Creating sales...')

        cashiers = [u for u in self.users if u.role == User.Role.CASHIER]

        created = []

        methods = [
            'Naqd',
            'Karta',
            'Online',
            'Aralash',
        ]

        for i in range(self.sale_count):
            cashier = random.choice(cashiers)

            sale_date = date.today() - timedelta(days=random.randint(0, 120))

            sale = Sale.objects.create(
                branch=self.branch,
                external_id=f'CHK-{2026}{100000 + i}',
                date=sale_date,
                time=f'{random.randint(8, 21):02}:{random.randint(0, 59):02}',
                amount=0,
                method=random.choices(
                    methods,
                    weights=[60, 25, 5, 10],
                )[0],
                cashier=cashier,
                cashier_name=cashier.full_name,
                items=[],
                payment_breakdown={},
            )

            total = Decimal('0')

            items_json = []

            selected = random.sample(
                self.products,
                random.randint(1, 6),
            )

            for product in selected:
                qty = random.randint(1, 4)

                price = product.selling_price

                SaleLine.objects.create(
                    sale=sale,
                    product_name=product.name,
                    quantity=qty,
                    unit_price=price,
                )

                subtotal = price * qty

                total += subtotal

                items_json.append(
                    {
                        'name': product.name,
                        'qty': qty,
                        'price': float(price),
                        'total': float(subtotal),
                    }
                )

            sale.amount = total

            sale.items = items_json

            if sale.method == 'Naqd':
                sale.payment_breakdown = {
                    'cash': float(total),
                }

            elif sale.method == 'Karta':
                sale.payment_breakdown = {
                    'card': float(total),
                }

            elif sale.method == 'Online':
                sale.payment_breakdown = {
                    'online': float(total),
                }

            else:
                cash = total * Decimal('0.40')
                card = total - cash

                sale.payment_breakdown = {
                    'cash': float(cash),
                    'card': float(card),
                }

            sale.save()

            created.append(sale)

        self.sales = created

        self.stdout.write(self.style.SUCCESS(f'{len(created)} ta sotuv yaratildi.'))




    def create_credit_accounts(self):

        self.stdout.write("Creating credit accounts...")

        names = [
            "Abdulla",
            "Jasur",
            "Sherzod",
            "Akmal",
            "Sardor",
            "Aziz",
            "Bekzod",
            "Ulug'bek",
            "Rustam",
            "Doston",
            "Oybek",
            "Odil",
            "Ilhom",
            "Komil",
            "Farhod",
            "Muhammad",
            "Islom",
            "Shoxrux",
            "Jamshid",
            "Alisher",
        ]

        created = []

        for _ in range(180):

            name = random.choice(names) + " " + fake.last_name()

            balance = money(100000, 3000000)
            phone = uz_phone()

            print('generated:', repr(phone))

            account = CreditAccount.objects.create(
                branch=self.branch,
                customer_name=name,
                phone=phone,
                balance=balance,
            )

            created.append(account)

        self.credit_accounts = created

        self.stdout.write(
            self.style.SUCCESS(
                f"{len(created)} ta qarzdor yaratildi."
            )
        )


    def create_credit_transactions(self):

        self.stdout.write("Creating credit transactions...")

        created = []

        for account in self.credit_accounts:

            sale_count = random.randint(2, 10)

            balance = Decimal("0")

            for _ in range(sale_count):

                amount = money(50000, 800000)

                CreditTransaction.objects.create(
                    account=account,
                    kind=CreditTransaction.KIND_CHARGE,
                    amount=amount,
                    cashier_name=random.choice(self.users).full_name,
                    note="Nasiya savdo",
                )

                balance += amount

            payment_count = random.randint(0, sale_count)

            for _ in range(payment_count):

                payment = money(30000, 500000)

                CreditTransaction.objects.create(
                    account=account,
                    kind=CreditTransaction.KIND_PAYMENT,
                    amount=payment,
                    cashier_name=random.choice(self.users).full_name,
                    note="Qarz to'lovi",
                )

                balance -= payment

            if balance < 0:
                balance = Decimal("0")

            account.balance = balance
            account.save(update_fields=["balance"])

            created.append(account)

        self.stdout.write(
            self.style.SUCCESS(
                "Credit transactions yaratildi."
            )
        )




    def create_agent_orders(self):

        self.stdout.write("Creating agent orders...")

        customer_names = [
            "Kamol Avto Servis",
            "Turbo Motors",
            "Avto Lider",
            "Premium Oil",
            "Master Service",
            "Auto Expert",
            "Oil Center",
            "GM Servis",
            "SamAuto",
            "Samarqand Motors",
            "Auto House",
            "Motor Plus",
            "Grand Service",
            "Express Oil",
            "Karvon Motors",
        ]

        created = []

        for _ in range(120):

            supplier = random.choice(self.suppliers)

            selected = random.sample(
                self.products,
                random.randint(2, 6),
            )

            total = Decimal("0")

            items = []

            for product in selected:

                qty = random.randint(1, 8)

                total += product.selling_price * qty

                items.append(f"{product.name} x{qty}")

            order = AgentOrder.objects.create(
                branch=self.branch,
                supplier=supplier,
                agent_name=supplier.agent_name,
                customer_name=random.choice(customer_names),
                items=", ".join(items),
                total=total,
                date=date.today() - timedelta(
                    days=random.randint(0, 60)
                ),
            )

            created.append(order)

        self.agent_orders = created

        self.stdout.write(
            self.style.SUCCESS(
                f"{len(created)} ta agent buyurtmasi yaratildi."
            )
        )


    def create_pos_drafts(self):

        self.stdout.write("Creating POS drafts...")

        cashiers = [
            u for u in self.users
            if u.role == User.Role.CASHIER
        ]

        labels = [
            "Nexia mijozi",
            "Cobalt mijozi",
            "Lacetti mijozi",
            "Spark mijozi",
            "Tracker mijozi",
            "Kaptiva mijozi",
            "Malibu mijozi",
            "Gentra mijozi",
            "Damas mijozi",
            "Labo mijozi",
            "BYD mijozi",
            "Kia mijozi",
            "Hyundai mijozi",
            "BMW mijozi",
            "Mercedes mijozi",
            "Toyota mijozi",
            "Chevrolet servis",
            "Taxi park",
            "Avtoservis",
            "Doimiy mijoz",
        ]

        created = []

        for _ in range(20):

            cashier = random.choice(cashiers)

            selected = random.sample(
                self.products,
                random.randint(1, 5),
            )

            items = []

            total = Decimal("0")

            for product in selected:

                qty = random.randint(1, 3)

                subtotal = product.selling_price * qty

                total += subtotal

                items.append(
                    {
                        "id": str(product.id),
                        "name": product.name,
                        "price": float(product.selling_price),
                        "quantity": qty,
                        "emoji": product.emoji,
                        "barcode": product.barcode,
                        "stock": product.stock,
                        "subtotal": float(subtotal),
                    }
                )

            draft = PosCartDraft.objects.create(
                branch=self.branch,
                cashier=cashier,
                label=random.choice(labels),
                pay_method=random.choice(
                    [
                        "Naqd",
                        "Karta",
                        "Qarz",
                    ]
                ),
                items=items,
                total=total,
                is_draft=True,
            )

            created.append(draft)

        self.pos_drafts = created

        self.stdout.write(
            self.style.SUCCESS(
                f"{len(created)} ta POS draft yaratildi."
            )
        )




















