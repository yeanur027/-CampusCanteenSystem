from abc import ABC, abstractmethod

class DiscountStrategy(ABC):
    @abstractmethod
    def discount(self, subtotal, items):
        pass

class PercentageDiscount(DiscountStrategy):
    def __init__(self, rate=0.10):
        self.rate = rate

    def discount(self, subtotal, items):
        return round(subtotal * self.rate, 2) if subtotal >= 200 else 0.0

class ComboDiscount(DiscountStrategy):
    # Buy at least 2 cakes and 1 coffee; subtract a fixed 20 currency units.
    def discount(self, subtotal, items):
        quantities = {item["name"].lower(): item["quantity"] for item in items}
        if quantities.get("cake", 0) >= 2 and quantities.get("coffee", 0) >= 1:
            return 20.0
        return 0.0

class DiscountFactory:
    @staticmethod
    def create(name):
        if name == "percentage":
            return PercentageDiscount()
        if name == "combo":
            return ComboDiscount()
        raise ValueError("Unknown discount type")

def best_discount(subtotal, items):
    # Select the rule that gives the lowest payable total (highest valid discount).
    strategies = [DiscountFactory.create("percentage"), DiscountFactory.create("combo")]
    discounts = [strategy.discount(subtotal, items) for strategy in strategies]
    return min(subtotal, max(discounts))
