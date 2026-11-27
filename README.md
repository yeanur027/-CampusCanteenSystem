# Campus Canteen Ordering System (CCOS)

A beginner-friendly REST API prototype for a university cafeteria. It demonstrates persistent storage, modular design, design patterns, unit tests, and Swagger/OpenAPI documentation.

## Features
1. Menu management
2. Shopping cart
3. Combo/discount calculation
4. Inventory management
5. Prepaid campus-card checkout (simulated)
6. Order history

## Requirements
- Python 3.10+
- pip

## Run on Windows
```bash
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python run.py
```
Open http://127.0.0.1:5000/ for Swagger UI.

## Run on Linux/macOS
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

## Example API workflow
1. `GET /api/menu`
2. `POST /api/cart` with `{"student_id": 1, "item_id": 1, "quantity": 2}`
3. `GET /api/cart/1`
4. `POST /api/checkout/1`
5. `GET /api/orders/1`

The database `canteen.db` is created automatically. The first run inserts sample products and a sample student.

## Test
```bash
python -m unittest discover -s tests -v
```

## Swagger/OpenAPI
Swagger UI is served at `/` and the OpenAPI JSON is available from `/swagger.json` (provided by Flask-RESTX).

## Design patterns used
- Factory: `DiscountFactory` creates discount strategies.
- Strategy: `PercentageDiscount` and `ComboDiscount` implement interchangeable pricing rules.
- Repository: `ProductRepository` and `OrderRepository` isolate SQL persistence.
- Singleton: `Database` maintains one shared database connection manager per application process.

## Important scope notes
- Campus-card payment is simulated; no real money or payment gateway is used.
- This is an academic prototype, not a production payment system.
- Stock is checked again during checkout to prevent selling an item that became unavailable while it was in the cart.
- If stock is insufficient, checkout is rejected and the student must update the cart.
