from flask import Flask
from .config import Config
from .extensions import db, migrate, jwt
from flask_cors import CORS

# Blueprints
from .routes.auth import auth_bp
from .routes.admin import admin_bp
from .routes.pu_results import pu_results_bp
from .routes.polling_unit import polling_unit_bp
from .routes.location_admin import location_bp
from .routes.location_public import location_public_bp
from .routes.party import party_bp
from .routes.public import public_bp
from .routes.admin_dashboard import admin_dashboard_bp
from .routes.ward import ward_bp


# Models (important for migrations)
from .models import result, user, location


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, supports_credentials=True)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Blueprints
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(pu_results_bp, url_prefix="/results")
    app.register_blueprint(party_bp, url_prefix="/api")
    app.register_blueprint(polling_unit_bp, url_prefix="/polling-units")
    app.register_blueprint(public_bp, url_prefix="/public")
    # ✅ FIXED (ONLY ONCE)
    app.register_blueprint(location_bp, url_prefix="/admin/location")

    app.register_blueprint(location_public_bp, url_prefix="/locations")
    app.register_blueprint(admin_dashboard_bp, url_prefix="/dashboard")
    app.register_blueprint(ward_bp, url_prefix="/ward")

    return app