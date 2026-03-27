from django.contrib import admin
from .models import Product, Inventory, Dealer, Order, OrderItem

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['sku', 'name', 'price']

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ['product', 'quantity', 'updated_at']

@admin.register(Dealer)
class DealerAdmin(admin.ModelAdmin):
    list_display = ['dealer_code', 'name', 'email', 'phone']

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'dealer', 'status', 'total_amount', 'created_at']
    inlines = [OrderItemInline]
