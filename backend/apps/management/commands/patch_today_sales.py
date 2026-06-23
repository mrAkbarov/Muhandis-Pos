"""Dashboard grafiklari uchun bugungi kunga sotuvlar taqsimlash."""

import random

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.models import Branch, Product, Sale


class Command(BaseCommand):
    help = 'Har filialda bugungi kun uchun kamida N ta sotuv (grafik ishlashi uchun)'

    def add_arguments(self, parser):
        parser.add_argument('--min-today', type=int, default=18)
        parser.add_argument('--prefix', type=str, default='Magazin')

    def handle(self, *args, **options):
        today = timezone.localdate()
        min_today = options['min_today']
        prefix = options['prefix']

        branches = Branch.objects.filter(name__startswith=prefix).order_by('name')
        if not branches.exists():
            branches = Branch.objects.filter(
                id__in=Product.objects.values_list('branch_id', flat=True).distinct(),
            )

        updated = 0
        for branch in branches:
            if not Product.objects.filter(branch=branch).exists():
                continue

            count_today = Sale.objects.filter(branch=branch, date=today).count()
            need = max(0, min_today - count_today)
            if need == 0:
                continue

            ids = list(
                Sale.objects.filter(branch=branch)
                .exclude(date=today)
                .order_by('?')
                .values_list('id', flat=True)[:need]
            )
            for sale_id in ids:
                h = random.randint(8, 21)
                m = random.randint(0, 59)
                Sale.objects.filter(pk=sale_id).update(
                    date=today,
                    time=f'{h:02d}:{m:02d}',
                )
                updated += 1

            still = max(0, min_today - Sale.objects.filter(branch=branch, date=today).count())
            if still:
                self.stdout.write(self.style.WARNING(
                    f'  ! {branch.name}: faqat {len(ids)} ta ko\'chirildi ({still} yetishmaydi — seed_magazin_sales ishga tushiring)'
                ))

        self.stdout.write(self.style.SUCCESS(
            f'Tayyor: {updated} ta sotuv bugungi kunga ({today}) ko\'chirildi'
        ))
