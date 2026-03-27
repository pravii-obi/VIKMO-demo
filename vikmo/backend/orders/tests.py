from django.test import TestCase
from rest_framework.exceptions import ValidationError
from .models import Product, Inventory, Dealer, Order, OrderItem
from .services import confirm_order, deliver_order


def make_product(sku='P001', name='Test Product', price=100, stock=10):
    p = Product.objects.create(sku=sku, name=name, price=price)
    Inventory.objects.create(product=p, quantity=stock)
    return p


def make_dealer():
    return Dealer.objects.create(
        dealer_code='D001', name='Test Dealer',
        email='dealer@test.com', phone='9999999999'
    )


class ConfirmOrderTests(TestCase):
    def setUp(self):
        self.dealer = make_dealer()
        self.product = make_product(stock=10)

    def _make_order(self, qty=5):
        order = Order.objects.create(dealer=self.dealer)
        OrderItem.objects.create(order=order, product=self.product, quantity=qty, unit_price=self.product.price)
        return order

    def test_confirm_success_deducts_stock(self):
        order = self._make_order(qty=5)
        confirm_order(order)
        self.assertEqual(order.status, 'confirmed')
        self.product.inventory.refresh_from_db()
        self.assertEqual(self.product.inventory.quantity, 5)

    def test_confirm_fails_insufficient_stock(self):
        order = self._make_order(qty=15)
        with self.assertRaises(ValidationError):
            confirm_order(order)
        self.product.inventory.refresh_from_db()
        self.assertEqual(self.product.inventory.quantity, 10)

    def test_cannot_confirm_already_confirmed(self):
        order = self._make_order(qty=2)
        confirm_order(order)
        with self.assertRaises(ValidationError):
            confirm_order(order)

    def test_cannot_confirm_empty_order(self):
        order = Order.objects.create(dealer=self.dealer)
        with self.assertRaises(ValidationError):
            confirm_order(order)


class DeliverOrderTests(TestCase):
    def setUp(self):
        self.dealer = make_dealer()
        self.product = make_product(stock=10)

    def test_deliver_success(self):
        order = Order.objects.create(dealer=self.dealer)
        OrderItem.objects.create(order=order, product=self.product, quantity=2, unit_price=100)
        confirm_order(order)
        deliver_order(order)
        self.assertEqual(order.status, 'delivered')

    def test_cannot_deliver_draft(self):
        order = Order.objects.create(dealer=self.dealer)
        with self.assertRaises(ValidationError):
            deliver_order(order)
