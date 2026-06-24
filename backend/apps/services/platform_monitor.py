from datetime import timedelta

from django.db.models import Count, Max, Q, Sum
from django.utils import timezone

from apps.models import Branch, Product, Sale, User


def _store_number(branch_name: str) -> int | None:
    if not branch_name.startswith('Magazin '):
        return None
    base = branch_name.split(' · ')[0]
    digits = ''.join(ch for ch in base if ch.isdigit())
    return int(digits) if digits else None


def get_magazin_status_report():
    """100 ta magazin bo'yicha faollik — savdo va oxirgi faol kun."""
    today = timezone.localdate()
    d7 = today - timedelta(days=7)
    d30 = today - timedelta(days=30)

    branches = Branch.objects.filter(name__startswith='Magazin ').order_by('name')
    stores: dict[int, dict] = {}

    for branch in branches:
        sn = _store_number(branch.name)
        if sn is None:
            continue
        if sn not in stores:
            stores[sn] = {
                'store_number': sn,
                'store_code': f'm{sn:03d}',
                'store_name': f'Magazin {sn:03d}',
                'branches': [],
                'branch_ids': [],
            }
        stores[sn]['branches'].append({'id': str(branch.id), 'name': branch.name})
        stores[sn]['branch_ids'].append(branch.id)

    for store in stores.values():
        ids = store.pop('branch_ids')
        sales_qs = Sale.objects.filter(branch_id__in=ids)
        agg = sales_qs.aggregate(
            last_sale=Max('date'),
            sales_today=Count('id', filter=Q(date=today)),
            sales_7d=Count('id', filter=Q(date__gte=d7)),
            sales_30d=Count('id', filter=Q(date__gte=d30)),
            revenue_today=Sum('amount', filter=Q(date=today)),
            revenue_7d=Sum('amount', filter=Q(date__gte=d7)),
            revenue_30d=Sum('amount', filter=Q(date__gte=d30)),
        )

        sales_7d = agg['sales_7d'] or 0
        sales_30d = agg['sales_30d'] or 0

        if sales_7d > 0:
            status = 'active'
        elif sales_30d > 0:
            status = 'low'
        else:
            status = 'inactive'

        store.update({
            'branch_count': len(store['branches']),
            'last_sale_date': agg['last_sale'].isoformat() if agg['last_sale'] else None,
            'sales_today': agg['sales_today'] or 0,
            'sales_7d': sales_7d,
            'sales_30d': sales_30d,
            'revenue_today': float(agg['revenue_today'] or 0),
            'revenue_7d': float(agg['revenue_7d'] or 0),
            'revenue_30d': float(agg['revenue_30d'] or 0),
            'product_count': Product.objects.filter(branch_id__in=ids).count(),
            'user_count': User.objects.filter(branch_id__in=ids, is_active=True).count(),
            'status': status,
        })

    rows = sorted(stores.values(), key=lambda x: x['store_number'])

    summary = {
        'total': len(rows),
        'active': sum(1 for r in rows if r['status'] == 'active'),
        'low': sum(1 for r in rows if r['status'] == 'low'),
        'inactive': sum(1 for r in rows if r['status'] == 'inactive'),
    }

    return {'summary': summary, 'stores': rows}
