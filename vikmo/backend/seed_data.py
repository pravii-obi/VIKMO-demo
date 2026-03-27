import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikmo_project.settings')
django.setup()

from sales_app.models import Product, Inventory, Dealer

products = [
    {"sku": "BP-001", "name": "Brake Pad - Front", "description": "High performance front brake pad", "unit_price": 500},
    {"sku": "OF-002", "name": "Oil Filter", "description": "Standard oil filter", "unit_price": 150},
    {"sku": "SP-003", "name": "Spark Plug Set", "description": "Set of 4 iridium spark plugs", "unit_price": 800},
    {"sku": "AF-004", "name": "Air Filter", "description": "Performance air filter", "unit_price": 350},
    {"sku": "BR-005", "name": "Brake Rotor", "description": "Vented front brake rotor", "unit_price": 1200},
]

for p in products:
    prod, created = Product.objects.get_or_create(sku=p['sku'], defaults=p)
    if created:
        Inventory.objects.create(product=prod, quantity=100)
        print(f"Created: {prod.name}")

dealers = [
    {"name": "ABC Motors", "email": "abc@motors.com", "phone": "9876543210", "city": "Mumbai"},
    {"name": "Delhi Auto Parts", "email": "info@delhiauto.com", "phone": "9876543211", "city": "Delhi"},
    {"name": "Chennai Cars", "email": "sales@chennaicars.com", "phone": "9876543212", "city": "Chennai"},
]

for d in dealers:
    dealer, created = Dealer.objects.get_or_create(email=d['email'], defaults=d)
    if created:
        print(f"Created dealer: {dealer.name}")

print("Seed complete!")
