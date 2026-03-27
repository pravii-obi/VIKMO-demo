# Vikmo — Dealer Order Management System

React + Django REST Framework web application for managing dealer orders, products, and inventory.

## Stack
- **Backend**: Django 4.x + Django REST Framework
- **Frontend**: React (Vite) + React Router + Axios
- **Database**: SQLite (dev) / PostgreSQL (prod)

## Quick Start (without Docker)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Quick Start (with Docker)
```bash
docker-compose up --build
```

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/products/` | List / create products |
| GET/PUT/DELETE | `/api/products/:id/` | Retrieve / update / delete |
| GET/POST | `/api/dealers/` | List / create dealers |
| GET/POST | `/api/orders/` | List / create orders |
| POST | `/api/orders/:id/confirm/` | Confirm order (deducts stock) |
| POST | `/api/orders/:id/deliver/` | Mark order as delivered |
| GET/PUT | `/api/inventory/` | View / update stock levels |

## Business Rules
1. Orders start as **Draft** — can be edited freely.
2. **Confirm** validates stock for all items atomically, then deducts inventory.
3. **Deliver** transitions Confirmed → Delivered.
4. Confirmed and Delivered orders cannot be edited.

## Project Structure
```
vikmo/
├── backend/          # Django project
│   ├── orders/       # Main app (models, views, services)
│   └── vikmo_project/ # Settings & URLs
├── frontend/         # React (Vite)
│   └── src/
│       ├── pages/    # Dashboard, Products, Dealers, Orders, Inventory
│       └── components/ # Shared UI components
└── docker-compose.yml
```
