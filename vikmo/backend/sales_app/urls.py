from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, InventoryViewSet, DealerViewSet, OrderViewSet

router = DefaultRouter()
router.register('products', ProductViewSet, basename='product')
router.register('dealers', DealerViewSet, basename='dealer')
router.register('orders', OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
    path('inventory/', InventoryViewSet.as_view({'get': 'list'}), name='inventory-list'),
    path('inventory/<int:pk>/', InventoryViewSet.as_view({'put': 'partial_update'}), name='inventory-detail'),
    path('inventory/<int:pk>/logs/', InventoryViewSet.as_view({'get': 'logs'}), name='inventory-logs'),
]
