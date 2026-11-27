from app.discounts import best_discount

class CartService:
    def __init__(self, db):
        self.db = db

    def add_item(self, student_id, product_id, quantity):
        if quantity <= 0:
            raise ValueError("Quantity must be greater than zero")
        with self.db.connect() as con:
            student = con.execute("SELECT id FROM students WHERE id=?", (student_id,)).fetchone()
            product = con.execute("SELECT * FROM products WHERE id=?", (product_id,)).fetchone()
            if not student:
                raise ValueError("Student not found")
            if not product:
                raise ValueError("Product not found")
            current = con.execute("SELECT quantity FROM cart_items WHERE student_id=? AND product_id=?",
                                  (student_id, product_id)).fetchone()
            new_quantity = quantity + (current["quantity"] if current else 0)
            if new_quantity > product["stock"]:
                raise ValueError("Insufficient stock")
            if current:
                con.execute("UPDATE cart_items SET quantity=? WHERE student_id=? AND product_id=?",
                            (new_quantity, student_id, product_id))
            else:
                con.execute("INSERT INTO cart_items(student_id, product_id, quantity) VALUES (?, ?, ?)",
                            (student_id, product_id, quantity))
        return self.get_cart(student_id)

    def remove_item(self, student_id, product_id):
        with self.db.connect() as con:
            con.execute("DELETE FROM cart_items WHERE student_id=? AND product_id=?", (student_id, product_id))
        return self.get_cart(student_id)

    def get_cart(self, student_id):
        with self.db.connect() as con:
            rows = con.execute("""
                SELECT p.id AS product_id, p.name, p.price, p.stock, c.quantity
                FROM cart_items c JOIN products p ON p.id=c.product_id
                WHERE c.student_id=? ORDER BY p.id
            """, (student_id,)).fetchall()
        items = [dict(r) for r in rows]
        subtotal = round(sum(i["price"] * i["quantity"] for i in items), 2)
        discount = best_discount(subtotal, items) if items else 0.0
        return {"student_id": student_id, "items": items, "subtotal": subtotal,
                "discount": discount, "total": round(subtotal-discount, 2)}

class CheckoutService:
    def __init__(self, db):
        self.db = db

    def checkout(self, student_id):
        # Recheck stock and balance inside one transaction before committing the order.
        con = self.db.connect()
        try:
            con.execute("BEGIN")
            student = con.execute("SELECT * FROM students WHERE id=?", (student_id,)).fetchone()
            if not student:
                raise ValueError("Student not found")
            rows = con.execute("""
                SELECT p.id AS product_id, p.name, p.price, p.stock, c.quantity
                FROM cart_items c JOIN products p ON p.id=c.product_id
                WHERE c.student_id=?
            """, (student_id,)).fetchall()
            items = [dict(r) for r in rows]
            if not items:
                raise ValueError("Cart is empty")
            for item in items:
                if item["quantity"] > item["stock"]:
                    raise ValueError(f'Insufficient stock for {item["name"]}')
            subtotal = round(sum(i["price"] * i["quantity"] for i in items), 2)
            discount = best_discount(subtotal, items)
            total = round(subtotal - discount, 2)
            if student["card_balance"] < total:
                raise ValueError("Insufficient campus-card balance")
            cur = con.execute("INSERT INTO orders(student_id, subtotal, discount, total) VALUES (?, ?, ?, ?)",
                              (student_id, subtotal, discount, total))
            order_id = cur.lastrowid
            for item in items:
                con.execute("INSERT INTO order_items(order_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?)",
                            (order_id, item["name"], item["quantity"], item["price"]))
                con.execute("UPDATE products SET stock=stock-? WHERE id=?",
                            (item["quantity"], item["product_id"]))
            con.execute("UPDATE students SET card_balance=card_balance-? WHERE id=?", (total, student_id))
            con.execute("DELETE FROM cart_items WHERE student_id=?", (student_id,))
            con.commit()
            return {"order_id": order_id, "student_id": student_id, "subtotal": subtotal,
                    "discount": discount, "total": total, "status": "PAID"}
        except Exception:
            con.rollback()
            raise
        finally:
            con.close()
