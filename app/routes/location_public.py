from flask import Blueprint, jsonify
from ..models.location import State, LGA, Ward, PollingUnit
from ..extensions import db
import uuid


location_public_bp = Blueprint("location_public", __name__)

# STATES
@location_public_bp.route("/states", methods=["GET"])
def get_states():
    states = State.query.all()
    return jsonify([{"id": str(s.id), "name": s.name} for s in states])


# LGAs BY STATE
@location_public_bp.route("/lgas/<uuid:state_id>", methods=["GET"])
def get_lgas(state_id):
    lgas = LGA.query.filter_by(state_id=state_id).all()
    return jsonify([{"id": str(l.id), "name": l.name} for l in lgas])


# WARDS BY LGA
@location_public_bp.route("/wards/<uuid:lga_id>", methods=["GET"])
def get_wards(lga_id):
    wards = Ward.query.filter_by(lga_id=lga_id).all()
    return jsonify([{"id": str(w.id), "name": w.name} for w in wards])


# POLLING UNITS BY WARD ✅
@location_public_bp.route("/polling-units/<uuid:ward_id>", methods=["GET"])
def get_pus(ward_id):
    pus = PollingUnit.query.filter_by(ward_id=ward_id).all()

    print("PUs found:", pus)  # 👈 DEBUG

    return jsonify([
        {
            "id": str(p.id),
            "name": p.name,
            "code": p.code
        } for p in pus
    ])


# POLLING UNITS BY WARD
@location_public_bp.route("/ward/<uuid:ward_id>/polling-units", methods=["GET"])
def get_pus_for_ward(ward_id):  # 🚀 Changed function name to be fully unique
    pus = PollingUnit.query.filter_by(ward_id=ward_id).all()
    print("PUs found:", pus)
    return jsonify([
        {
            "id": str(p.id),
            "name": p.name,
            "code": p.code
        } for p in pus
    ])


@location_public_bp.route('/polling-unit/<string:pu_id>', methods=['GET'])
def get_single_pu(pu_id):
    try:
        # Cast the string ID into a native Python UUID object
        uuid_obj = uuid.UUID(pu_id)
    except ValueError:
        return jsonify({"error": "Invalid UUID format submitted"}), 400

    # Query all tables using explicit foreign key joins with the native UUID object
    result = db.session.query(PollingUnit, Ward, LGA, State) \
        .join(Ward, PollingUnit.ward_id == Ward.id) \
        .join(LGA, Ward.lga_id == LGA.id) \
        .join(State, LGA.state_id == State.id) \
        .filter(PollingUnit.id == uuid_obj) \
        .first()

    # Fallback safety if the multi-table join yields an empty row match
    if not result:
        pu = PollingUnit.query.get(uuid_obj)
        if not pu:
            return jsonify({"error": "Polling unit not found"}), 404

        return jsonify({
            "id": str(pu.id),
            "name": pu.name,
            "code": pu.code,
            "ward_name": "Unspecified Ward",
            "lga_name": "Unspecified LGA",
            "state_name": "Unspecified State"
        }), 200

    # Unpack entities if the structural location lookup chain matches successfully
    pu, ward, lga, state = result

    return jsonify({
        "id": str(pu.id),
        "name": pu.name,
        "code": pu.code,
        "ward_name": ward.name if ward else "Unspecified Ward",
        "lga_name": lga.name if lga else "Unspecified LGA",
        "state_name": state.name if state else "Unspecified State"
    }), 200
