from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
import uuid

from ..extensions import db
from ..models.user import User
from ..models.location import PollingUnit, Ward

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/create-user", methods=["POST"])
@jwt_required()
def create_user():
    try:
        admin_id = uuid.UUID(get_jwt_identity())
        admin = User.query.get(admin_id)

        if admin.role != "ADMIN":
            return jsonify({"error": "Unauthorized"}), 403

        data = request.get_json()

        # =========================
        # BASIC FIELDS
        # =========================
        full_name = data.get("full_name")
        email = data.get("email")
        password = data.get("password")
        phone = data.get("phone")
        role = data.get("role")

        # =========================
        # CONVERT UUIDs
        # =========================
        state_id = uuid.UUID(data.get("state_id")) if data.get("state_id") else None
        lga_id = uuid.UUID(data.get("lga_id")) if data.get("lga_id") else None
        ward_id = uuid.UUID(data.get("ward_id")) if data.get("ward_id") else None
        polling_unit_id = uuid.UUID(data.get("polling_unit_id")) if data.get("polling_unit_id") else None

        pu_name = data.get("pu_name")
        pu_code = data.get("pu_code")

        # =========================
        # VALIDATION
        # =========================
        if not full_name or not email or not password:
            return jsonify({"error": "Missing required fields"}), 400

        if role == "POLLING_AGENT" and not polling_unit_id and not (pu_name and pu_code):
            return jsonify({"error": "Polling unit required"}), 400

        # =========================
        # CREATE PU IF NEEDED
        # =========================
        if not polling_unit_id and pu_name and pu_code:
            if not ward_id:
                return jsonify({"error": "Ward required"}), 400

            existing = PollingUnit.query.filter_by(code=pu_code).first()
            if existing:
                return jsonify({"error": "PU code exists"}), 400

            new_pu = PollingUnit(
                name=pu_name,
                code=pu_code,
                ward_id=ward_id
            )

            db.session.add(new_pu)
            db.session.flush()

            polling_unit_id = new_pu.id

        # =========================
        # CREATE USER
        # =========================
        user = User(
            full_name=full_name,
            email=email,
            password_hash=generate_password_hash(password),
            phone=phone,
            role=role,
            assigned_state_id=state_id,
            assigned_lga_id=lga_id,
            assigned_ward_id=ward_id,
            assigned_polling_unit_id=polling_unit_id
        )

        db.session.add(user)
        db.session.commit()

        return jsonify({"message": "User created successfully"})

    except Exception as e:
        db.session.rollback()
        print("CREATE USER ERROR:", str(e))
        return jsonify({"error": str(e)}), 400


@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def get_users():
    admin_id = uuid.UUID(get_jwt_identity())
    admin = User.query.get(admin_id)

    if admin.role != "ADMIN":
        return jsonify({"error": "Unauthorized"}), 403

    users = User.query.all()

    result = []
    for u in users:
        result.append({
            "id": str(u.id),
            "full_name": u.full_name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "polling_unit_id": str(u.assigned_polling_unit_id) if u.assigned_polling_unit_id else None,
            "ward_id": str(u.assigned_ward_id) if u.assigned_ward_id else None,
            "lga_id": str(u.assigned_lga_id) if u.assigned_lga_id else None,
            "state_id": str(u.assigned_state_id) if u.assigned_state_id else None,
        })

    return jsonify(result)

#@admin_bp.route("/assign-agent", methods=["POST"])
@admin_bp.route("/assign-user", methods=["POST"])
@jwt_required()
def assign_user():

    admin_id = uuid.UUID(get_jwt_identity())

    admin = db.session.get(User, admin_id)

    if admin.role != "ADMIN":
        return jsonify({"error": "Unauthorized"}), 403

    data = request.json

    user_id = data.get("user_id")
    role = data.get("role")

    polling_unit_id = data.get("polling_unit_id")
    ward_id = data.get("ward_id")
    lga_id = data.get("lga_id")
    state_id = data.get("state_id")

    user = db.session.get(User, uuid.UUID(user_id))

    if not user:
        return jsonify({"error": "User not found"}), 404

    # Clear previous assignment
    user.assigned_polling_unit_id = None
    user.assigned_ward_id = None
    user.assigned_lga_id = None
    user.assigned_state_id = None

    if role == "POLLING_AGENT":
        user.assigned_polling_unit_id = polling_unit_id

    elif role == "WARD_AGENT":
        user.assigned_ward_id = ward_id

    elif role == "LGA_AGENT":
        user.assigned_lga_id = lga_id

    elif role == "STATE_AGENT":
        user.assigned_state_id = state_id

    db.session.commit()

    return jsonify({
        "message": "User assigned successfully"
    })

