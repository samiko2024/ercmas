from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from werkzeug.security import check_password_hash
from app.models.user import User
from app.extensions import db
from sqlalchemy import or_ # 👈 Imported for multi-column conditional checking
import uuid

auth_bp = Blueprint("auth", __name__)


# =========================
# LOGIN (SUPPORTING EMAIL OR PHONE)
# =========================
@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()

        # Accepting a flexible generic identifier parameter instead of strict email
        identifier = data.get("identifier") or data.get("email")
        password = data.get("password")

        if not identifier or not password:
            return jsonify({"error": "Security identifier and password are required"}), 400

        # Querying the database to find matches on either column
        user = User.query.filter(
            or_(User.email == identifier, User.phone == identifier)
        ).first()

        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"error": "Invalid credentials"}), 401

        access_token = create_access_token(identity=str(user.id))

        return jsonify({
            "message": "Login successful",
            "access_token": access_token,
            "user": serialize_user(user)
        }), 200

    except Exception as e:
        print("❌ LOGIN ERROR:", e)
        return jsonify({"error": "Login failed"}), 500


# =========================
# GET CURRENT USER
# =========================
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    try:
        user_id = uuid.UUID(get_jwt_identity())
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify(serialize_user(user)), 200

    except Exception as e:
        print("❌ /me ERROR:", e)
        return jsonify({"error": "Failed to fetch user"}), 500


# =========================
# SERIALIZER
# =========================
def serialize_user(user):
    return {
        "id": str(user.id),
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,  # Added safely to payload
        "role": user.role,
        "polling_unit_id": str(user.assigned_polling_unit_id) if user.assigned_polling_unit_id else None,
        "ward_id": str(user.assigned_ward_id) if user.assigned_ward_id else None,
        "lga_id": str(user.assigned_lga_id) if user.assigned_lga_id else None,
        "state_id": str(user.assigned_state_id) if user.assigned_state_id else None,
    }