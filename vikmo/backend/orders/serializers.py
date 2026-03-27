from rest_framework import serializers
from .models import Product, Inventory, Dealer, Order, OrderItem


class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = ['id', 'quantity', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    inventory = InventorySerializer(read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'sku', 'name', 'description', 'price', 'inventory', 'created_at', 'updated_at']


class DealerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dealer
        fields = ['id', 'dealer_code', 'name', 'email', 'phone', 'address', 'created_at']


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_sku', 'quantity', 'unit_price', 'line_total']
        read_only_fields = ['unit_price', 'line_total']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    dealer_name = serializers.CharField(source='dealer.name', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'order_number', 'dealer', 'dealer_name', 'status',
                  'total_amount', 'notes', 'items', 'created_at', 'updated_at']
        read_only_fields = ['order_number', 'total_amount', 'status']


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ['dealer', 'notes', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        order.recalculate_total()
        return order
