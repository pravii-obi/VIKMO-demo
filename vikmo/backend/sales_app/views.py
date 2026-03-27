from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import Product, Inventory, Dealer, Order, OrderItem, InventoryLog
from .serializers import (
    ProductSerializer, InventoryUpdateSerializer, InventoryLogSerializer,
    DealerSerializer, DealerDetailSerializer,
    OrderSerializer, OrderCreateSerializer, OrderItemCreateSerializer
)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('inventory').all()
    serializer_class = ProductSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(sku__icontains=search)
        return qs

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        if product.order_items.filter(order__status__in=['Confirmed', 'Delivered']).exists():
            return Response(
                {'error': 'Cannot delete product with confirmed or delivered orders.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)


class InventoryViewSet(viewsets.ViewSet):
    def list(self, request):
        inventories = Inventory.objects.select_related('product').all()
        data = []
        for inv in inventories:
            data.append({
                'id': inv.id,
                'product_id': inv.product.id,
                'product_name': inv.product.name,
                'sku': inv.product.sku,
                'quantity': inv.quantity,
                'last_updated_by': inv.last_updated_by,
                'updated_at': inv.updated_at,
            })
        return Response(data)

    def partial_update(self, request, pk=None):
        try:
            inventory = Inventory.objects.select_related('product').get(product_id=pk)
        except Inventory.DoesNotExist:
            return Response({'error': 'Inventory not found for this product.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = InventoryUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        old_qty = inventory.quantity
        new_qty = serializer.validated_data['quantity']

        InventoryLog.objects.create(
            inventory=inventory,
            previous_quantity=old_qty,
            new_quantity=new_qty,
            change=new_qty - old_qty,
            reason=serializer.validated_data['reason'],
            updated_by=serializer.validated_data['updated_by'],
        )

        inventory.quantity = new_qty
        inventory.last_updated_by = serializer.validated_data['updated_by']
        inventory.save()

        return Response({
            'product_id': inventory.product.id,
            'product_name': inventory.product.name,
            'sku': inventory.product.sku,
            'previous_quantity': old_qty,
            'new_quantity': new_qty,
            'change': new_qty - old_qty,
        })

    @action(detail=True, methods=['get'], url_path='logs')
    def logs(self, request, pk=None):
        try:
            inventory = Inventory.objects.get(product_id=pk)
        except Inventory.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        logs = inventory.logs.order_by('-created_at')
        serializer = InventoryLogSerializer(logs, many=True)
        return Response(serializer.data)


class DealerViewSet(viewsets.ModelViewSet):
    queryset = Dealer.objects.all()
    serializer_class = DealerSerializer
    http_method_names = ['get', 'post', 'put', 'patch', 'head', 'options']

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = DealerDetailSerializer(instance)
        return Response(serializer.data)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related('dealer').prefetch_related('items__product').all()
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return OrderCreateSerializer
        return OrderSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        dealer_id = self.request.query_params.get('dealer')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if dealer_id:
            qs = qs.filter(dealer_id=dealer_id)
        return qs

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = OrderSerializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        order = self.get_object()
        if order.status != 'Draft':
            return Response(
                {'error': f'Cannot edit a {order.status} order. Only Draft orders can be modified.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        order = self.get_object()
        if order.status == 'Confirmed':
            with transaction.atomic():
                for item in order.items.all():
                    inv = item.product.inventory
                    inv.quantity += item.quantity
                    inv.save()
                order.delete()
            return Response({'message': 'Confirmed order deleted and stock restored.'}, status=status.HTTP_200_OK)
        elif order.status == 'Delivered':
            return Response({'error': 'Cannot delete a Delivered order.'}, status=status.HTTP_400_BAD_REQUEST)
        order.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        order = self.get_object()

        if not order.can_transition_to('Confirmed'):
            return Response(
                {'error': f'Invalid transition. Cannot move from {order.status} to Confirmed.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not order.items.exists():
            return Response({'error': 'Cannot confirm an empty order.'}, status=status.HTTP_400_BAD_REQUEST)

        insufficient = []
        for item in order.items.select_related('product__inventory').all():
            try:
                available = item.product.inventory.quantity
            except Inventory.DoesNotExist:
                available = 0
            if item.quantity > available:
                insufficient.append({
                    'product': item.product.name,
                    'sku': item.product.sku,
                    'available': available,
                    'requested': item.quantity,
                    'shortfall': item.quantity - available,
                })

        if insufficient:
            return Response({
                'error': 'Insufficient stock for one or more products.',
                'details': insufficient
            }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            for item in order.items.select_related('product__inventory').all():
                inv = item.product.inventory
                inv.quantity -= item.quantity
                inv.save()
            order.status = 'Confirmed'
            order.save()

        serializer = OrderSerializer(order)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def deliver(self, request, pk=None):
        order = self.get_object()
        if not order.can_transition_to('Delivered'):
            return Response(
                {'error': f'Invalid transition. Cannot move from {order.status} to Delivered.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        order.status = 'Delivered'
        order.save()
        serializer = OrderSerializer(order)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='items')
    def add_item(self, request, pk=None):
        order = self.get_object()
        if order.status != 'Draft':
            return Response({'error': 'Cannot add items to a non-Draft order.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = OrderItemCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        product = serializer.validated_data['product']
        quantity = serializer.validated_data['quantity']

        item, created = OrderItem.objects.get_or_create(
            order=order, product=product,
            defaults={'quantity': quantity, 'unit_price': product.unit_price}
        )
        if not created:
            item.quantity = quantity
            item.unit_price = product.unit_price
            item.save()

        order.recalculate_total()
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=['delete'], url_path='items/(?P<item_id>[^/.]+)')
    def remove_item(self, request, pk=None, item_id=None):
        order = self.get_object()
        if order.status != 'Draft':
            return Response({'error': 'Cannot remove items from a non-Draft order.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            item = order.items.get(id=item_id)
            item.delete()
            order.recalculate_total()
        except OrderItem.DoesNotExist:
            return Response({'error': 'Item not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(OrderSerializer(order).data)

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        from django.db.models import Count, Sum
        total_orders = Order.objects.count()
        by_status = Order.objects.values('status').annotate(count=Count('id'), total=Sum('total_amount'))
        return Response({
            'total_orders': total_orders,
            'by_status': list(by_status),
        })
