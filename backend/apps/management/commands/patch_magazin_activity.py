"""Magazinlar holati: ba'zilari ishlayapti, ba'zilari kam faol, ba'zilari ishlatmayapti."""

import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.models import Branch, Sale
from apps.services.platform_monitor import get_magazin_status_report


def _store_number(branch_name: str) -> int | None:
    if not branch_name.startswith('Magazin '):
        return None
    base = branch_name.split(' · ')[0]
    digits = ''.join(ch for ch in base if ch.isdigit())
    return int(digits) if digits else None


def _stores_by_number():
    stores: dict[int, list] = {}
    for branch in Branch.objects.filter(name__startswith='Magazin ').order_by('name'):
        sn = _store_number(branch.name)
        if sn is None:
            continue
        stores.setdefault(sn, []).append(branch.id)
    return stores


def _bulk_shift_dates(branch_ids, sale_qs, min_days_ago, max_days_ago, today):
    batch = []
    for sale in sale_qs.filter(branch_id__in=branch_ids).iterator(chunk_size=500):
        sale.date = today - timedelta(days=random.randint(min_days_ago, max_days_ago))
        h = random.randint(8, 21)
        m = random.randint(0, 59)
        sale.time = f'{h:02d}:{m:02d}'
        batch.append(sale)
        if len(batch) >= 400:
            Sale.objects.bulk_update(batch, ['date', 'time'], batch_size=400)
            batch.clear()
    if batch:
        Sale.objects.bulk_update(batch, ['date', 'time'], batch_size=400)


@transaction.atomic
def apply_activity_mix(
    active_pct=60,
    low_pct=25,
    inactive_pct=15,
    seed=42,
):
    """Har magazin uchun tasodifiy faollik darajasi."""
    random.seed(seed)
    today = timezone.localdate()
    stores = _stores_by_number()
    if not stores:
        return {'active': 0, 'low': 0, 'inactive': 0, 'total': 0}

    store_nums = sorted(stores.keys())
    random.shuffle(store_nums)

    n = len(store_nums)
    n_inactive = max(1, round(n * inactive_pct / 100))
    n_low = max(1, round(n * low_pct / 100))
    if n_inactive + n_low >= n:
        n_inactive = max(1, n // 10)
        n_low = max(1, n // 4)

    inactive_set = set(store_nums[:n_inactive])
    low_set = set(store_nums[n_inactive:n_inactive + n_low])
    active_set = set(store_nums[n_inactive + n_low:])

    d7 = today - timedelta(days=7)
    d30 = today - timedelta(days=30)

    for sn, branch_ids in stores.items():
        if sn in inactive_set:
            recent = Sale.objects.filter(branch_id__in=branch_ids, date__gte=d30)
            _bulk_shift_dates(branch_ids, recent, 31, 90, today)
        elif sn in low_set:
            recent7 = Sale.objects.filter(branch_id__in=branch_ids, date__gte=d7)
            _bulk_shift_dates(branch_ids, recent7, 8, 28, today)
        else:
            # Faol: oxirgi 7 kunga kamida 15 ta sotuv
            count_7d = Sale.objects.filter(branch_id__in=branch_ids, date__gte=d7).count()
            need = max(0, 15 - count_7d)
            if need:
                older = list(
                    Sale.objects.filter(branch_id__in=branch_ids, date__lt=d7)
                    .order_by('?')[:need]
                )
                for sale in older:
                    sale.date = today - timedelta(days=random.randint(0, 6))
                    h = random.randint(8, 21)
                    m = random.randint(0, 59)
                    sale.time = f'{h:02d}:{m:02d}'
                if older:
                    Sale.objects.bulk_update(older, ['date', 'time'], batch_size=400)

    report = get_magazin_status_report()['summary']
    return report


class Command(BaseCommand):
    help = (
        'Magazinlar holati: ~60%% ishlayapti, ~25%% kam faol, ~15%% ishlatmayapti '
        '(savdo sanalarini qayta taqsimlaydi)'
    )

    def add_arguments(self, parser):
        parser.add_argument('--seed', type=int, default=42)
        parser.add_argument('--active-pct', type=int, default=60)
        parser.add_argument('--low-pct', type=int, default=25)
        parser.add_argument('--inactive-pct', type=int, default=15)

    def handle(self, *args, **options):
        summary = apply_activity_mix(
            active_pct=options['active_pct'],
            low_pct=options['low_pct'],
            inactive_pct=options['inactive_pct'],
            seed=options['seed'],
        )
        self.stdout.write(self.style.SUCCESS(
            f'Tayyor: {summary["total"]} magazin — '
            f'ishlayapti {summary["active"]}, '
            f'kam faol {summary["low"]}, '
            f'ishlatmayapti {summary["inactive"]}'
        ))
