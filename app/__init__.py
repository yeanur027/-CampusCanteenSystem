def create_app(test_config=None):
    # Import web dependencies only when the API server is started.
    from flask import Flask
    from flask_restx import Api
    from app.database import Database
    from app.routes import register_routes

    app = Flask(__name__)
    app.config.update(test_config or {})
    db_path = app.config.get("DATABASE", "canteen.db")
    db = Database(db_path)
    db.initialize()
    api = Api(app, title="Campus Canteen API", version="1.0",
              description="REST API for campus canteen ordering. Swagger/OpenAPI documentation.")
    register_routes(api, db)
    app.extensions["canteen_db"] = db
    return app
