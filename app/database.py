import sqlite3
from threading import Lock

class Database:
    # Singleton-style shared database manager for this application instance.
    _instances = {}
    _lock = Lock()

    def __new__(cls, path="canteen.db"):
        with cls._lock:
            if path not in cls._instances:
                obj = super().__new__(cls)
                obj.path = path
                cls._instances[path] = obj
            return cls._instances[path]

    def connect(self):
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        return connection

    def initialize(self):
        with self.connect() as con:
            con.executescript("""
            CREATE TABLE IF NOT EXISTS students(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                card_balance REAL NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS products(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price REAL NOT NULL CHECK(price >= 0),
                stock INTEGER NOT NULL CHECK(stock >= 0)
            );
            CREATE TABLE IF NOT EXISTS cart_items(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL CHECK(quantity > 0),
                UNIQUE(student_id, product_id),
                FOREIGN KEY(student_id) REFERENCES students(id),
                FOREIGN KEY(product_id) REFERENCES products(id)
            );
            CREATE TABLE IF NOT EXISTS orders(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                subtotal REAL NOT NULL,
                discount REAL NOT NULL,
                total REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'PAID',
                FOREIGN KEY(student_id) REFERENCES students(id)
            );
            CREATE TABLE IF NOT EXISTS order_items(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price REAL NOT NULL,
                FOREIGN KEY(order_id) REFERENCES orders(id)
            );
            """)
            count = con.execute("SELECT COUNT(*) FROM students").fetchone()[0]
            if count == 0:
                con.execute("INSERT INTO students(name, card_balance) VALUES (?, ?)", ("Sample Student", 500.00))
                con.executemany("INSERT INTO products(name, price, stock) VALUES (?, ?, ?)", [
                    ("Cake", 80.0, 20), ("Coffee", 50.0, 30),
                    ("Sandwich", 120.0, 15), ("Juice", 60.0, 25)
                ])
