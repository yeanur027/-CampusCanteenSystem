import unittest
from unittest.mock import Mock
from app.services import CartService

class CartServiceValidationTests(unittest.TestCase):
    def test_rejects_zero_quantity_before_database_access(self):
        db = Mock()
        service = CartService(db)
        with self.assertRaises(ValueError):
            service.add_item(1, 1, 0)
        db.connect.assert_not_called()

if __name__ == "__main__":
    unittest.main()
