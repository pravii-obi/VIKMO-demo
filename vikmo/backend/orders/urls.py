from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, DealerViewSet, InventoryViewSet, OrderViewSet

router = DefaultRouter()
router.register('products', ProductViewSet)
router.register('dealers', DealerViewSet)
router.register('inventory', InventoryViewSet)
router.register('orders', OrderViewSet)

urlpatterns = router.urls
