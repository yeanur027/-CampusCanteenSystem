import unittest
from unittest.mock import Mock
from app.discounts import PercentageDiscount, ComboDiscount, DiscountFactory, best_discount

class DiscountTests(unittest.TestCase):
    def test_percentage_discount_applies_at_threshold(self):
        self.assertEqual(PercentageDiscount().discount(200, []), 20.0)

    def test_percentage_discount_not_applied_below_threshold(self):
        self.assertEqual(PercentageDiscount().discount(199, []), 0.0)

    def test_combo_discount_applies_to_qualifying_items(self):
        items = [{"name": "Cake", "quantity": 2}, {"name": "Coffee", "quantity": 1}]
        self.assertEqual(ComboDiscount().discount(210, items), 20.0)

    def test_factory_returns_strategy(self):
        self.assertIsInstance(DiscountFactory.create("combo"), ComboDiscount)

    def test_best_discount_chooses_largest_saving(self):
        items = [{"name": "Cake", "quantity": 2}, {"name": "Coffee", "quantity": 1}]
        self.assertEqual(best_discount(300, items), 30.0)

    def test_unknown_discount_raises_error(self):
        with self.assertRaises(ValueError):
            DiscountFactory.create("unknown")

if __name__ == "__main__":
    unittest.main()
