from rest_framework.fields import SerializerMethodField, DateTimeField, HiddenField, CurrentUserDefault
from rest_framework.serializers import ModelSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from models import Product, SaleItem, Sale, User, Inventory


class ProductSerializer(ModelSerializer):

    stock = SerializerMethodField()
    created_at = DateTimeField(format="%Y-%m-%d %H:%M", read_only=True)

    class Meta:
        model = Product
        fields = ("id","name","price","barcode","category","stock","created_at")



class SaleItemSerializer(ModelSerializer):

    class Meta:
        model = SaleItem
        fields = ("product", "quantity", "price")



class SaleSerializer(ModelSerializer):

    items = SaleItemSerializer(many=True)
    cashier = HiddenField(default=CurrentUserDefault())
    created_at = DateTimeField(format="%Y-%m-%d %H:%M", read_only=True)

    total_price = SerializerMethodField()

    class Meta:
        model = Sale
        fields = ("id","cashier","branch","items","total_price","created_at")

        read_only_fields = ("cashier",)



    def create(self, validated_data):

        items_data = validated_data.pop("items")
        user = self.context["request"].user

        sale = Sale.objects.create(cashier=user, **validated_data)

        total = 0

        for item in items_data:
            SaleItem.objects.create(
                sale=sale,
                product=item["product"],
                quantity=item["quantity"],
                price=item["price"]
            )

            total += item["quantity"] * item["price"]

        sale.total_price = total
        sale.save()

        return sale


    def get_total_price(self, obj):
        return obj.total_price



class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    @classmethod
    def get_token(cls, user):

        token = cls.token_class.for_user(user)

        token["role"] = user.role
        token["phone"] = user.phone
        token["name"] = user.first_name

        return token


class UserSerializer(ModelSerializer):

    class Meta:
        model = User
        fields = ("id","phone","first_name","last_name","role","is_active","created_at")

        read_only_fields = ("is_active", "created_at")


class InventorySerializer(ModelSerializer):

    product_name = SerializerMethodField()
    branch_name = SerializerMethodField()

    class Meta:
        model = Inventory
        fields = ("id","product","product_name","branch","branch_name","quantity","updated_at")