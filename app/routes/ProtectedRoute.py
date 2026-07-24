from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import jsonify
import uuid
from ..models.user import User


@jwt_required()
def protected():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    admin_id = uuid.UUID(get_jwt_identity())
    admin = User.query.get(admin_id)

    if admin.role != "ADMIN":
      return jsonify({"error": "Access denied"}), 403