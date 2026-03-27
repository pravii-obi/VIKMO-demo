from django.db import models
from django.utils import timezone
import uuid


class Product(models.Model):
    sku = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.sku} - {self.name}"


class Inventory(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='inventory')
    quantity = models.PositiveIntegerField(default=0)
    last_updated_by = models.CharField(max_length=100, blank=True, default='system')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Inventories'

    def __str__(self):
        return f"{self.product.sku} - Stock: {self.quantity}"


class InventoryLog(models.Model):
    inventory = models.ForeignKey(Inventory, on_delete=models.CASCADE, related_name='logs')
    previous_quantity = models.PositiveIntegerField()
    new_quantity = models.PositiveIntegerField()
    change = models.IntegerField()
    reason = models.CharField(max_length=200, default='Manual adjustment')
    updated_by = models.CharField(max_length=100, default='admin')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.inventory.product.sku}: {self.previous_quantity} to {self.new_quantity}"


class Dealer(models.Model):
    dealer_code = models.CharField(max_length=20, unique=True, db_index=True, blank=True)
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.dealer_code} - {self.name}"

    def save(self, *args, **kwargs):
        if not self.dealer_code:
            self.dealer_code = f"DLR-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)


class Order(models.Model):
    STATUS_DRAFT = 'Draft'
    STATUS_CONFIRMED = 'Confirmed'
    STATUS_DELIVERED = 'Delivered'

    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Confirmed', 'Confirmed'),
        ('Delivered', 'Delivered'),
    ]

    VALID_TRANSITIONS = {
        'Draft': ['Confirmed'],
        'Confirmed': ['Delivered'],
        'Delivered': [],
    }

    order_number = models.CharField(max_length=30, unique=True, db_index=True, blank=True)
    dealer = models.ForeignKey(Dealer, on_delete=models.PROTECT, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.order_number} - {self.dealer.name} ({self.status})"

    def save(self, *args, **kwargs):
        if not self.order_number:
            date_str = timezone.now().strftime('%Y%m%d')
            seq = str(uuid.uuid4().int)[:4]
            self.order_number = f"ORD-{date_str}-{seq}"
        super().save(*args, **kwargs)

    def recalculate_total(self):
        total = sum(item.line_total for item in self.items.all())
        self.total_amount = total
        self.save(update_fields=['total_amount', 'updated_at'])

    def can_transition_to(self, new_status):
        return new_status in self.VALID_TRANSITIONS.get(self.status, [])


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='order_items')
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['order', 'product']

    def __str__(self):
        return f"{self.order.order_number} - {self.product.name} x{self.quantity}"

    def save(self, *args, **kwargs):
        self.line_total = self.quantity * self.unit_price
        super().save(*args, **kwargs)
