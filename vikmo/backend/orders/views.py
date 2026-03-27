from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Product, Inventory, Dealer, Order
from .serializers import (
    ProductSerializer, DealerSerializer, InventorySerializer,
    OrderSerializer, OrderCreateSerializer
)
from .services import confirm_order, deliver_order


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('inventory').all()
    serializer_class = ProductSerializer


class DealerViewSet(viewsets.ModelViewSet):
    queryset = Dealer.objects.all()
    serializer_class = DealerSerializer


class InventoryViewSet(viewsets.GenericViewSet):
    queryset = Inventory.objects.select_related('product').all()
    serializer_class = InventorySerializer

    def list(self, request):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        inv = self.get_object()
        serializer = self.get_serializer(inv, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related('dealer').prefetch_related('items__product').all()

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def update(self, request, *args, **kwargs):
        order = self.get_object()
        if order.status != 'draft':
            return Response(
                {'error': 'Only draft orders can be edited.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        order = self.get_object()
        try:
            confirm_order(order)
        except Exception as e:
            return Response({'error': e.detail}, status=status.HTTP_400_BAD_REQUEST)
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=['post'])
    def deliver(self, request, pk=None):
        order = self.get_object()
        try:
            deliver_order(order)
        except Exception as e:
            return Response({'error': e.detail}, status=status.HTTP_400_BAD_REQUEST)
        return Response(OrderSerializer(order).data)
