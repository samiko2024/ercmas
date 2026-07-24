from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models.location import State, LGA, Ward, PollingUnit

location_bp = Blueprint("location_admin", __name__)

@location_bp.route("/create-pu", methods=["POST"])
def create_polling_unit():
    data = request.json

    try:
        # 🔹 Validate input
        if not data.get("ward_id"):
            return jsonify({"error": "Ward is required"}), 400

        if not data.get("pu_name") or not data.get("pu_code"):
            return jsonify({"error": "PU name and code required"}), 400

        # 🔹 Check duplicate code
        existing = PollingUnit.query.filter_by(code=data["pu_code"]).first()
        if existing:
            return jsonify({"error": "Polling Unit code already exists"}), 400

        # 🔹 Ensure ward exists
        ward = Ward.query.get(data["ward_id"])
        if not ward:
            return jsonify({"error": "Invalid ward"}), 404

        # 🔹 Create PU
        pu = PollingUnit(
            name=data["pu_name"],
            code=data["pu_code"],
            ward_id=ward.id
        )

        db.session.add(pu)
        db.session.commit()

        return jsonify({
            "message": "Polling Unit created successfully",
            "pu": {
                "id": str(pu.id),
                "name": pu.name,
                "code": pu.code
            }
        })

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({"error": "Server error"}), 500