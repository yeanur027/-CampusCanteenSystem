# Campus Canteen Ordering System (CCOS)

A beginner-friendly REST API prototype for a university cafeteria. It demonstrates persistent storage, modular design, design patterns, unit testing, and Swagger/OpenAPI documentation.

## Features

1. Menu management
2. Shopping cart
3. Combo and discount calculation
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

Open the following URL in your browser to access Swagger UI:

http://127.0.0.1:5000/

## Run on Linux/macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

Open http://127.0.0.1:5000/ for Swagger UI.

## Example API Workflow

1. `GET /api/menu` – Retrieve available menu items.
2. `POST /api/cart` – Add an item to the cart.

   Example request body:

   ```json
   {
     "student_id": 1,
     "item_id": 1,
     "quantity": 2
   }
   ```

3. `GET /api/cart/1` – View the student's cart.
4. `POST /api/checkout/1` – Complete checkout.
5. `GET /api/orders/1` – View order history.

The database `canteen.db` is created automatically. On the first run, the application inserts sample products and a sample student.

## Automated Testing

The project uses Python's built-in `unittest` framework.

Run the tests using:

```bash
python -m unittest discover -s tests -v
```

The test suite covers:

- Cart quantity validation
- Discount selection
- Combo discount calculation
- Percentage discount rules
- Discount factory behavior
- Invalid discount handling

## Swagger/OpenAPI Documentation

Swagger UI is served at the root URL:

`http://127.0.0.1:5000/`

The OpenAPI JSON specification is available at:

`http://127.0.0.1:5000/swagger.json`

The documentation is generated using Flask-RESTX and allows developers to explore API endpoints, provide request parameters, execute requests, and inspect responses.

## Design Patterns Used

- **Factory Pattern:** `DiscountFactory` creates appropriate discount strategies.
- **Strategy Pattern:** `PercentageDiscount` and `ComboDiscount` implement interchangeable pricing rules.
- **Repository Pattern:** `ProductRepository` and `OrderRepository` isolate SQL database operations.
- **Singleton Pattern:** `Database` maintains a shared database connection manager per application process.

## API Response and Error Handling

The API uses JSON responses to communicate the results of client requests.

Common HTTP status codes include:

- `200 OK`: Request completed successfully.
- `400 Bad Request`: Invalid input or business rule violation.
- `404 Not Found`: Requested resource does not exist.
- `500 Internal Server Error`: Unexpected server-side error.

Clients can use HTTP status codes and response messages to understand the result of their requests and handle errors appropriately.

*Note: These are common HTTP status code meanings. Actual status codes depend on the implemented endpoint behavior.*

## Continuous Integration

The project includes a GitHub Actions workflow located at:

`.github/workflows/tests.yml`

The workflow is configured to run automated tests when changes are pushed to the repository or when a pull request is created, according to its trigger configuration.

## Important Scope Notes

- Campus-card payment is simulated; no real money or payment gateway is used.
- This is an academic prototype, not a production payment system.
- Stock is checked again during checkout to prevent selling an item that became unavailable while the order was being built.
- If stock is insufficient, checkout is rejected and the student must update the cart.