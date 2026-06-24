import django_filters

from apps.models import Product


class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name='selling_price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='selling_price', lookup_expr='lte')

    class Meta:
        model = Product
        fields = ['branch', 'category', 'min_price', 'max_price']
