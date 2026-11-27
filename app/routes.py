from flask import request
from flask_restx import Resource, fields, Namespace
from app.repositories import ProductRepository, StudentRepository, OrderRepository
from app.services import CartService, CheckoutService

def register_routes(api, db):
    ns = Namespace("api", description="Canteen operations")
    product_model = api.model("Product", {
        "id": fields.Integer, "name": fields.String, "price": fields.Float, "stock": fields.Integer
    })
    cart_input = api.model("CartInput", {
        "student_id": fields.Integer(required=True),
        "item_id": fields.Integer(required=True),
        "quantity": fields.Integer(required=True)
    })
    cart_remove = api.model("CartRemove", {
        "student_id": fields.Integer(required=True),
        "item_id": fields.Integer(required=True)
    })

    @ns.route("/menu")
    class Menu(Resource):
        @ns.marshal_list_with(product_model)
        def get(self):
            return ProductRepository(db).all()

    @ns.route("/students/<int:student_id>")
    class Student(Resource):
        def get(self, student_id):
            student = StudentRepository(db).get(student_id)
            return student or {"message": "Student not found"}, (200 if student else 404)

    @ns.route("/cart")
    class CartAdd(Resource):
        @ns.expect(cart_input, validate=True)
        def post(self):
            data = request.get_json()
            try:
                result = CartService(db).add_item(data["student_id"], data["item_id"], data["quantity"])
                return result, 200
            except ValueError as exc:
                return {"message": str(exc)}, 400

    @ns.route("/cart/<int:student_id>")
    class CartView(Resource):
        def get(self, student_id):
            return CartService(db).get_cart(student_id)

    @ns.route("/cart/remove")
    class CartRemove(Resource):
        @ns.expect(cart_remove, validate=True)
        def post(self):
            data = request.get_json()
            return CartService(db).remove_item(data["student_id"], data["item_id"])

    @ns.route("/checkout/<int:student_id>")
    class Checkout(Resource):
        def post(self, student_id):
            try:
                return CheckoutService(db).checkout(student_id), 201
            except ValueError as exc:
                return {"message": str(exc)}, 400

    @ns.route("/orders/<int:student_id>")
    class Orders(Resource):
        def get(self, student_id):
            return OrderRepository(db).history(student_id)

    api.add_namespace(ns)
