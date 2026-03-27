from django.db import transaction
from rest_framework.exceptions import ValidationError


def confirm_order(order):
    if order.status != 'draft':
        raise ValidationError(f"Cannot confirm an order with status '{order.status}'.")

    items = order.items.select_related('product__inventory').all()
    if not items.exists():
        raise ValidationError("Order has no items.")

    errors = []
    for item in items:
        try:
            inv = item.product.inventory
        except Exception:
            errors.append(f"No inventory record for '{item.product.name}'.")
            continue
        if inv.quantity < item.quantity:
            errors.append(
                f"Insufficient stock for '{item.product.name}'. "
                f"Available: {inv.quantity}, Requested: {item.quantity}."
            )
    if errors:
        raise ValidationError(errors)

    with transaction.atomic():
        for item in items:
            inv = item.product.inventory
            inv.quantity -= item.quantity
            inv.save()
        order.status = 'confirmed'
        order.save(update_fields=['status'])

    return order


def deliver_order(order):
    if order.status != 'confirmed':
        raise ValidationError(f"Cannot deliver an order with status '{order.status}'.")
    order.status = 'delivered'
    order.save(update_fields=['status'])
    return order
