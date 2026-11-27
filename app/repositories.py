class ProductRepository:
    def __init__(self, db):
        self.db = db

    def all(self):
        with self.db.connect() as con:
            return [dict(r) for r in con.execute("SELECT * FROM products ORDER BY id")]

    def get(self, product_id):
        with self.db.connect() as con:
            row = con.execute("SELECT * FROM products WHERE id=?", (product_id,)).fetchone()
            return dict(row) if row else None

    def change_stock(self, product_id, amount):
        with self.db.connect() as con:
            con.execute("UPDATE products SET stock = stock + ? WHERE id=?", (amount, product_id))

class StudentRepository:
    def __init__(self, db):
        self.db = db

    def get(self, student_id):
        with self.db.connect() as con:
            row = con.execute("SELECT * FROM students WHERE id=?", (student_id,)).fetchone()
            return dict(row) if row else None

class OrderRepository:
    def __init__(self, db):
        self.db = db

    def history(self, student_id):
        with self.db.connect() as con:
            rows = con.execute("SELECT * FROM orders WHERE student_id=? ORDER BY id DESC", (student_id,))
            return [dict(r) for r in rows]
