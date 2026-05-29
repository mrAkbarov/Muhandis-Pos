from rest_framework import serializers

from apps.models import Branch, Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class ProductSerializer(serializers.ModelSerializer):
    # Kategoriya obyektini id emas, nomi bilan chiqarish (Ichimliklar, Oziq-ovqat va h.k.)
    category_name = serializers.CharField(source='category.name', read_only=True)

    # Model ichidagi property funksiyalarni API'ga qo'shish
    profit = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'barcode', 'category', 'category_name',
            'selling_price', 'base_price', 'profit', 'stock', 'status'
        ]

    def get_profit(self, obj):
        return obj.profit  # Modeldagi profit hisob-kitobini oladi

    def get_status(self, obj):
        return obj.status  # Modeldagi statusni (Yetarli/Tugagan) oladi


class BranchModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ('id', 'name', 'address', 'phone', 'created_at')
        extra_kwargs = {
            'id': {'read_only': True},
            'created_at': {'read_only': True}
        }

    def validate_phone(self, value):
        if value and not value.startswith('+'):
            raise serializers.ValidationError("Telefon raqam xalqaro formatda bo'lishi shart (Masalan: +998...)")
        return value
