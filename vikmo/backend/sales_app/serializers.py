from rest_framework import serializers
from .models import Product, Inventory, Dealer, Order, OrderItem, InventoryLog


class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = ['id', 'quantity', 'last_updated_by', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    inventory = InventorySerializer(read_only=True)
    stock_quantity = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'sku', 'name', 'description', 'unit_price', 'inventory', 'stock_quantity', 'created_at', 'updated_at']

    def get_stock_quantity(self, obj):
        try:
            return obj.inventory.quantity
        except Inventory.DoesNotExist:
            return 0

    def create(self, validated_data):
        product = super().create(validated_data)
        Inventory.objects.create(product=product, quantity=0)
        return product


class InventoryLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryLog
        fields = ['id', 'previous_quantity', 'new_quantity', 'change', 'reason', 'updated_by', 'created_at']


class InventoryUpdateSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=0)
    reason = serializers.CharField(max_length=200, default='Manual adjustment')
    updated_by = serializers.CharField(max_length=100, default='admin')


class DealerSerializer(serializers.ModelSerializer):
    total_orders = serializers.SerializerMethodField()

    class Meta:
        model = Dealer
        fields = ['id', 'dealer_code', 'name', 'email', 'phone', 'address', 'city', 'is_active', 'total_orders', 'created_at', 'updated_at']
        read_only_fields = ['dealer_code']

    def get_total_orders(self, obj):
        return obj.orders.count()


class DealerDetailSerializer(DealerSerializer):
    orders = serializers.SerializerMethodField()

    class Meta(DealerSerializer.Meta):
        fields = DealerSerializer.Meta.fields + ['orders']

    def get_orders(self, obj):
        orders = obj.orders.all()[:10]
        return [{'id': o.id, 'order_number': o.order_number, 'status': o.status, 'total_amount': str(o.total_amount), 'created_at': o.created_at} for o in orders]


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_sku', 'quantity', 'unit_price', 'line_total']
        read_only_fields = ['unit_price', 'line_total']


class OrderItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['product', 'quantity']

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0.")
        return value


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    dealer_name = serializers.CharField(source='dealer.name', read_only=True)
    dealer_code = serializers.CharField(source='dealer.dealer_code', read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'order_number', 'dealer', 'dealer_name', 'dealer_code', 'status',
                  'total_amount', 'notes', 'items', 'item_count', 'created_at', 'updated_at']
        read_only_fields = ['order_number', 'status', 'total_amount']

    def get_item_count(self, obj):
        return obj.items.count()


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemCreateSerializer(many=True, required=False)

    class Meta:
        model = Order
        fields = ['dealer', 'notes', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            product = item_data['product']
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=item_data['quantity'],
                unit_price=product.unit_price
            )
        order.recalculate_total()
        return order
