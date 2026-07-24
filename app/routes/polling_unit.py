from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from ..models.location import PollingUnit

polling_unit_bp = Blueprint("polling_unit", __name__)

@polling_unit_bp.route("/all", methods=["GET"])
def all_pus():
    pus = PollingUnit.query.all()

    return jsonify([
        {
            "id": str(p.id),
            "name": p.name,
            "code": p.code,
            "latitude": p.latitude,
            "longitude": p.longitude
        }
        for p in pus if p.latitude and p.longitude
    ])